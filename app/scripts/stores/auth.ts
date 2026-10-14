import { defineStore } from 'pinia'
import { validateUser } from '~/scripts/data/validateUser'
import { registerUser } from '~/scripts/data/registerUser'
import { tokenStorage } from '../utils/tokenStorage'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    email: '',
    username: '',
    isLoggedIn: false,
    isAdmin: false,
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
        this.persistSession(resolvedAccessToken, refreshToken, user.username, user.isAdmin ?? false)
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
        this.persistSession(resolvedAccessToken, refreshToken, user.username, user.isAdmin ?? false)
        this.isRegistrationPending = false
      }
    },

    persistSession(accessToken: string, refreshToken: string, username: string, isAdmin = false) {
      tokenStorage.setTokens(accessToken, refreshToken, username, isAdmin)
      this.username = username
      this.isAdmin = isAdmin
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

    /**
     * Explicitly logs out the user and forces a full-page redirect.
     * Use this when a token expires mid-session or when the user clicks 'Log Out'.
     */
    logout() {
      this.$reset()
      tokenStorage.clear()
      window.location.href = '/'
    },

    /**
     * Initializes auth state on application startup.
     */
    async init() {
      const accessToken = tokenStorage.getAccessToken()
      const refreshToken = tokenStorage.getRefreshToken()
      const username = tokenStorage.getUsername()
      const isAdmin = tokenStorage.getIsAdmin()

      if (accessToken && username) {
        this.username = username
        this.isAdmin = isAdmin
        this.isLoggedIn = true
      } else if (refreshToken && username) {
        // Access token is missing or expired, but we have a refresh token
        const newToken = await this.refreshAccessToken()
        if (newToken) {
          this.username = username
          this.isAdmin = isAdmin
          this.isLoggedIn = true
        } else {
          // Token refresh failed during initialization -> clear & redirect home
          this.logout()
        }
      } else {
        // Guest user visiting for the first time or logged out session.
        // Silently reset state without triggering a redirect loop.
        this.$reset()
        tokenStorage.clear()
      }
    }
  }
})