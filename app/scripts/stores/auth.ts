import { defineStore } from 'pinia'
import { validateUser } from '~/scripts/data/validateUser'
import { registerUser } from '~/scripts/data/registerUser'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    email: '',
    username: '',
    isLoggedIn: false,
    isRegistrationPending: false,
  }),
  
  actions: {

    async handleGoogleLogin(idToken: string) {
      const response = await validateUser(idToken)
      
      if (response.status === 404) {
        this.isRegistrationPending = true
        return
      }
      
      const { token, user } = response
      
      if (token && user) {
        localStorage.setItem('ecocaptura-jwt', token)
        localStorage.setItem('ecocaptura-username', user.username)
        this.username = user.username
        this.isLoggedIn = true
      }
    },

    async completeRegistration(username: string) {
      await registerUser(this.email, username)
      this.username = username
      this.isRegistrationPending = false
      this.isLoggedIn = true
    },

    logout() {
      this.username = ''
      this.isLoggedIn = false
      this.isRegistrationPending = false
      localStorage.removeItem('ecocaptura-jwt')
      localStorage.removeItem('ecocaptura-username')
    },

    init() {
      const token = localStorage.getItem('ecocaptura-jwt')
      if (token) {
        this.isLoggedIn = true
      }
    }
  }
})