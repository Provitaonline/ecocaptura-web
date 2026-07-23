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
      const response = await validateUser(idToken) as any
      
      if (response.status === 404) {
        this.idToken = idToken
        this.isRegistrationPending = true
        return
      }
      
      const { accessToken, refreshToken, token, user } = response
      // Fallback to 'token' if the backend hasn't been updated yet during your incremental rollout
      const resolvedAccessToken = accessToken || token
      
      if (resolvedAccessToken && refreshToken && user) {
        this.persistSession(resolvedAccessToken, refreshToken, user.username)
      }
    },

    async completeRegistration(idToken: string, username: string) {
      this.registrationError = ''
      const response = await registerUser(idToken, username) as any
      
      if (response.status === 409) {
        this.registrationError = response.message || 'Username already taken'
        return
      }

      const { accessToken, refreshToken, token, user } = response
      const resolvedAccessToken = accessToken || token

      if (response.status === 201 && resolvedAccessToken && refreshToken && user) {
        this.persistSession(resolvedAccessToken, refreshToken, user.username)
        this.isRegistrationPending = false
      }
    },

    persistSession(accessToken: string, refreshToken: string, username: string) {
      localStorage.setItem('ecocaptura-access-token', accessToken)
      localStorage.setItem('ecocaptura-refresh-token', refreshToken)
      localStorage.setItem('ecocaptura-username', username)
      this.username = username
      this.isLoggedIn = true
    },

    logout() {
      this.$reset() // Resets state to initial values
      localStorage.removeItem('ecocaptura-access-token')
      localStorage.removeItem('ecocaptura-refresh-token')
      localStorage.removeItem('ecocaptura-username')
    },

    init() {
      // Session is active if we have a refresh token (or both)
      const refreshToken = localStorage.getItem('ecocaptura-refresh-token')
      const username = localStorage.getItem('ecocaptura-username')
      if (refreshToken && username) {
        this.username = username
        this.isLoggedIn = true
      }
    }
  }
})