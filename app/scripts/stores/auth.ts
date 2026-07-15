import { defineStore } from 'pinia'
import { checkUser } from '~/scripts/data/checkUser'
import { registerUser } from '~/scripts/data/registerUser'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    email: '',
    username: '',
    isLoggedIn: false,
    isRegistrationPending: false,
  }),
  
  actions: {
    // Initial login handler
    async handleGoogleLogin(email: string) {
      const response = await checkUser(email)
      
      if (!response.exists) {
        this.isRegistrationPending = true
        this.email = email
      } else {
        this.username = response.username
        this.completeLogin(email)
      }
    },

    // Complete registration for new users
    async completeRegistration(username: string) {
      await registerUser(this.email, username)
      this.username = username
      this.isRegistrationPending = false
      this.completeLogin(this.email)
    },

    // Finalize local state
    completeLogin(email: string) {
      this.email = email
      this.isLoggedIn = true
      localStorage.setItem('user_email', email)
      localStorage.setItem('user_name', this.username)
    },

    // Reset state
    logout() {
      this.email = ''
      this.username = ''
      this.isLoggedIn = false
      this.isRegistrationPending = false
      localStorage.removeItem('user_email')
      localStorage.removeItem('user_name')
    },

    // Restore session
    init() {
      const savedEmail = localStorage.getItem('user_email')
      const savedUsername = localStorage.getItem('user_name')
      if (savedEmail) {
        this.email = savedEmail
        this.username = savedUsername || '' // Retrieve it
        this.isLoggedIn = true
      }
    }
  }
})