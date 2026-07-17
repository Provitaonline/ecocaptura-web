<template>
  <b-modal :model-value="auth.isRegistrationPending" :can-cancel="false">
    <div class="card p-5">
      <h3 class="title is-4">Welcome to EcoCaptura!</h3>
      <p>Please choose a unique username to complete your account.</p>
      
      <b-field label="Username" :type="error ? 'is-danger' : ''" :message="error">
        <b-input v-model="username" placeholder="e.g. ecocaptura_user"></b-input>
      </b-field>

      <b-button 
        type="is-primary" 
        class="mt-4" 
        expanded 
        :loading="isRegistering" 
        @click="handleRegister"
      >
        Complete Registration
      </b-button>
    </div>
  </b-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '~/scripts/stores/auth'

const auth = useAuthStore()
const username = ref('')
const isRegistering = ref(false)

const error = computed(() => auth.registrationError)

const handleRegister = async () => {
  if (!username.value) {
    return
  }
  
  isRegistering.value = true
  try {
    // Pass the token from the store to the action
    await auth.completeRegistration(auth.idToken, username.value)
  } catch (e) {
    // General catch for network/unexpected errors
    console.error('Registration failed:', e)
  } finally {
    isRegistering.value = false
  }
}
</script>