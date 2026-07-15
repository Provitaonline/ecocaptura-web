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
import { BModal, BInput, BField, BButton } from 'buefy'
import { ref } from 'vue'
import { useAuthStore } from '~/scripts/stores/auth'

const auth = useAuthStore()
const username = ref('')
const isRegistering = ref(false)
const error = ref('')

const handleRegister = async () => {
  if (!username.value) {
    error.value = 'Username is required'
    return
  }
  
  isRegistering.value = true
  try {
    await auth.completeRegistration(username.value)
  } catch (e) {
    error.value = 'Failed to register. Please try again.'
  } finally {
    isRegistering.value = false
  }
}
</script>