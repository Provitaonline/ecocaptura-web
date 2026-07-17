import { defineStore } from 'pinia'
import { validateUser } from '~/scripts/data/validateUser'
import { registerUser } from '~/scripts/data/registerUser'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    email: '',
    username: '',
    isLoggedIn: false,
    isRegistrationPending: false,
    registrationError: '', 
    idToken: ''
  }),
  
  actions: {
    async handleGoogleLogin(idToken: string) {
      const response = await validateUser(idToken)
      
      if (response.status === 404) {
        this.idToken = idToken
        this.isRegistrationPending = true
        return
      }
      
      const { token, user } = response
      if (token && user) {
        this.persistSession(token, user.username)
      }
    },

    async completeRegistration(idToken: string, username: string) {
      this.registrationError = ''
      const response = await registerUser(idToken, username)
      
      if (response.status === 409) {
        this.registrationError = response.message || 'Username already taken'
        return
      }

      if (response.status === 201 && response.token && response.user) {
        this.persistSession(response.token, response.user.username)
        this.isRegistrationPending = false
      }
    },

    persistSession(token: string, username: string) {
      localStorage.setItem('ecocaptura-jwt', token)
      localStorage.setItem('ecocaptura-username', username)
      this.username = username
      this.isLoggedIn = true
    },

    logout() {
      this.$reset() // Resets state to initial values
      localStorage.removeItem('ecocaptura-jwt')
      localStorage.removeItem('ecocaptura-username')
    },

    init() {
      const token = localStorage.getItem('ecocaptura-jwt')
      const username = localStorage.getItem('ecocaptura-username')
      if (token && username) {
        this.username = username
        this.isLoggedIn = true
      }
    }
  }
})