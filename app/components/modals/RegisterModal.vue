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
        <p class="mb-2">Please choose a unique username to complete your account.</p>
        <p class="help mb-4 has-text-grey">3 to 20 characters. Letters, numbers, -, +, $, and @ allowed.</p>
        
        <b-field label="Username" :type="displayError ? 'is-danger' : ''" :message="displayError">
          <b-input 
            v-model="username" 
            placeholder="e.g. ecocaptura_user"
            maxlength="20"
            @input="validateInput"
            @keydown.enter="isValid && handleRegister()"
          ></b-input>
        </b-field>
      </section>

      <footer class="modal-card-foot">
        <b-button @click="handleCancel" label="Cancel" />
        <b-button 
          type="is-primary" 
          :loading="isRegistering" 
          :disabled="!isValid"
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
const localError = ref('')

// Matching the Flutter regex: 3 to 20 chars, alphanumeric + - + $ @
const usernameRegex = /^[a-zA-Z0-9\-\+\$\@]{3,20}$/

const isValid = computed(() => usernameRegex.test ? usernameRegex.test(username.value.trim()) : usernameRegex.test(username.value.trim()))

// Combine backend errors (like 409 conflict) with frontend format hints if needed
const displayError = computed(() => {
  if (localError.value) return localError.value
  return auth.registrationError
})

const validateInput = () => {
  // Clear server conflict error when user starts typing again
  if (auth.registrationError) {
    auth.registrationError = ''
  }
  
  const val = username.value.trim()
  if (val.length > 0 && !usernameRegex.test(val)) {
    localError.value = 'Invalid format (3-20 chars: a-z, 0-9, -, +, $, @)'
  } else {
    localError.value = ''
  }
}

const handleRegister = async () => {
  const trimmed = username.value.trim()
  if (!usernameRegex.test(trimmed)) {
    localError.value = 'Please match the required username format.'
    return
  }
  
  isRegistering.value = true
  localError.value = ''
  try {
    await auth.completeRegistration(auth.idToken, trimmed)
  } catch (e) {
    console.error('Registration failed:', e)
  } finally {
    isRegistering.value = false
  }
}

const handleCancel = () => {
  auth.isRegistrationPending = false
  auth.registrationError = ''
  localError.value = ''
  username.value = ''
}
</script>