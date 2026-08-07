import { defineStore } from 'pinia'
import { validateUser } from '~/scripts/data/validateUser'
import { registerUser } from '~/scripts/data/registerUser'
import { tokenStorage } from '../utils/tokenStorage'

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
      tokenStorage.setTokens(accessToken, refreshToken, username)
      this.username = username
      this.isLoggedIn = true
    },

    async refreshAccessToken(): Promise<string | null> {
      const refreshToken = tokenStorage.getRefreshToken()
      if (!refreshToken) return null

      try {
        const config = useRuntimeConfig()
        const response = await fetch(`${config.public.apiBase}/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        })

        if (!response.ok) throw new Error('Refresh token expired or invalid')

        const data = await response.json()
        const newAccessToken = data.accessToken || data.token
        
        if (newAccessToken) {
          tokenStorage.setAccessToken(newAccessToken)
          return newAccessToken
        }
      } catch (error) {
        console.error('Session completely expired. Clearing tokens.', error)
        this.logout()
      }

      return null
    },

    logout() {
      this.$reset()
      tokenStorage.clear()
      window.dispatchEvent(new CustomEvent('auth-expired'))
    },

    async init() {
      const accessToken = tokenStorage.getAccessToken()
      const refreshToken = tokenStorage.getRefreshToken()
      const username = tokenStorage.getUsername()

      if (accessToken && username) {
        this.username = username
        this.isLoggedIn = true
      } else if (refreshToken && username) {
        // Access token is missing or expired, but we have a refresh token
        const newToken = await this.refreshAccessToken()
        if (newToken) {
          this.username = username
          this.isLoggedIn = true
        } else {
          this.logout()
        }
      } else {
        this.logout()
      }
    }
  }
})