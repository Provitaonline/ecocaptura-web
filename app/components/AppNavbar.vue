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
        <b-navbar-dropdown right arrowless>
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
              <b-button expanded type="is-danger" class="mt-3" @click="logout">Logout</b-button>
            </div>
          </div>
        </b-navbar-dropdown>
      </b-navbar-item>
    </template>
  </b-navbar>
</template>

<script setup lang="ts">
import { BNavbar, BNavbarItem, BNavbarDropdown, BIcon, BButton } from 'buefy'
import { onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

const config = useRuntimeConfig()
const auth = useAuthStore()

declare global {
  interface Window {
    google: any
    handleCredentialResponse: (response: any) => void
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
  setTimeout(() => renderGoogleButton(), 100)
}

if (import.meta.client) {
  window.handleCredentialResponse = (response) => {
    const payload = JSON.parse(decodeURIComponent(atob(response.credential.split('.')[1])))
    auth.login(payload.email)
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