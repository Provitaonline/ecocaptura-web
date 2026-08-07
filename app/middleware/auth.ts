import { defineNuxtRouteMiddleware, navigateTo } from '#imports'
import { useAuthStore } from '~/scripts/stores/auth'

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (import.meta.client) {
    const auth = useAuthStore()
    
    // Initialize or verify session (this will attempt token refresh if access token is missing)
    await auth.init()

    if (!auth.isLoggedIn) {
      // Redirect to home or your login page if unauthorized
      return navigateTo('/')
    }
  }
})