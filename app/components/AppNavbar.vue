<template>
  <b-navbar>
    <template #brand>
      <b-navbar-item tag="router-link" :to="{ path: '/' }">
        <div style="width: 40px; height: 40px; background: #3273dc; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
          EC
        </div>
      </b-navbar-item>
    </template>

    <template #end>
      <b-navbar-item>
        <b-navbar-dropdown right arrowless ref="authDropdown">
          <template #label>
            <b-icon 
              icon="account" 
              size="is-medium" 
              :type="auth.isLoggedIn ? 'is-success' : 'is-dark'"
            />
          </template>

          <div class="px-4 py-4" style="min-width: 250px;">
            <div v-if="!auth.isLoggedIn">
              <div id="google-signin-btn" class="is-flex is-justify-content-center"></div>
            </div>

            <div v-else>
              <p class="has-text-centered">Logged in as {{ auth.email }}</p>
              <p class="has-text-centered is-size-7">@{{ auth.username }}</p>
              <b-button expanded type="is-danger" class="mt-3" @click="logout">Logout</b-button>
            </div>
          </div>
        </b-navbar-dropdown>
      </b-navbar-item>
      <b-navbar-dropdown right arrowless>
        <template #label>
            <span>{{ $t(`flags.${locale}`) }}</span>
          </template>

          <b-navbar-item 
            v-for="l in allLocales" 
            :key="l.code"
            @click="setLocale(l.code)"
          >
            {{ $t(`flags.${l.code}`) }} {{ $t(`language_names.${l.code}`) }}
          </b-navbar-item>
        </b-navbar-dropdown>
    </template>
  </b-navbar>

  <RegisterModal />

</template>

<script setup lang="ts">
import RegisterModal from '~/components/modals/RegisterModal.vue'
import { onMounted } from 'vue'
import { useAuthStore } from '~/scripts/stores/auth'

const config = useRuntimeConfig()
const auth = useAuthStore()
const authDropdown = ref<any>(null)

declare global {
  interface Window {
    google: any
    handleCredentialResponse: (response: any) => void
  }
}

const { locale, locales, setLocale } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const allLocales = computed(() => locales.value)

const currentLocale = computed(() => 
  locales.value.find(l => l.code === locale.value)!
)

const closeDropdown = () => {
  if (authDropdown.value) {
    authDropdown.value.closeMenu()
  }
}

const renderGoogleButton = () => {
  const btn = document.getElementById("google-signin-btn")
  if (btn && window.google) {
    window.google.accounts.id.renderButton(btn, { 
      theme: "outline", size: "large", text: "continue_with" 
    })
  }
}

const logout = () => {
  if (import.meta.client && window.google) {
    window.google.accounts.id.disableAutoSelect()
  }
  auth.logout()
  // Re-render button after logout
  setTimeout(() => renderGoogleButton(), 100)
}

if (import.meta.client) {
  window.handleCredentialResponse = (response) => {
    // Decode JWT payload
    const payload = JSON.parse(atob(response.credential.split('.')[1]))
    // Call the new registration-aware login
    auth.handleGoogleLogin(payload.email)

    if (!auth.isRegistrationPending) {
      closeDropdown()
    }
  }
}

onMounted(() => {
  auth.init()
  
  if (import.meta.client && window.google) {
    window.google.accounts.id.initialize({
      client_id: config.public.googleClientId,
      callback: window.handleCredentialResponse
    })
    
    if (!auth.isLoggedIn) {
      renderGoogleButton()
    }
  }
})
</script>