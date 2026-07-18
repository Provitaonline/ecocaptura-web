<template>
  <b-modal 
    :model-value="auth.isRegistrationPending" 
    :can-cancel="['x', 'outside']"
	has-modal-card
    @close="handleCancel"
  >
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">Welcome to EcoCaptura!</p>
        <button type="button" class="delete" @click="handleCancel" />
      </header>

      <section class="modal-card-body">
        <p class="mb-4">Please choose a unique username to complete your account.</p>
        
        <b-field label="Username" :type="error ? 'is-danger' : ''" :message="error">
          <b-input v-model="username" placeholder="e.g. ecocaptura_user"></b-input>
        </b-field>
      </section>

      <footer class="modal-card-foot">
        <b-button @click="handleCancel" label="Cancel" />
        <b-button 
          type="is-primary" 
          :loading="isRegistering" 
          @click="handleRegister"
          label="Complete Registration"
        />
      </footer>
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

const handleCancel = () => {
  auth.isRegistrationPending = false
  auth.registrationError = ''
}
</script>