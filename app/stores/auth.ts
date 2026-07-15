import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    email: '' as string,
    isLoggedIn: false as boolean
  }),
  actions: {
    login(email: string) {
      this.email = email
      this.isLoggedIn = true
      localStorage.setItem('user_email', email)
    },
    logout() {
      this.email = ''
      this.isLoggedIn = false
      localStorage.removeItem('user_email')
    },
    init() {
      const savedEmail = localStorage.getItem('user_email')
      if (savedEmail) {
        this.email = savedEmail
        this.isLoggedIn = true
      }
    }
  }
})