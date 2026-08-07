export const tokenStorage = {
  getAccessToken(): string | null {
    if (import.meta.client) {
      return localStorage.getItem('ecocaptura-access-token')
    }
    return null
  },

  getRefreshToken(): string | null {
    if (import.meta.client) {
      return localStorage.getItem('ecocaptura-refresh-token')
    }
    return null
  },

  getUsername(): string | null {
    if (import.meta.client) {
      return localStorage.getItem('ecocaptura-username')
    }
    return null
  },

  setTokens(accessToken: string, refreshToken: string, username: string) {
    if (import.meta.client) {
      localStorage.setItem('ecocaptura-access-token', accessToken)
      localStorage.setItem('ecocaptura-refresh-token', refreshToken)
      localStorage.setItem('ecocaptura-username', username)
    }
  },

  setAccessToken(accessToken: string) {
    if (import.meta.client) {
      localStorage.setItem('ecocaptura-access-token', accessToken)
    }
  },

  clear() {
    if (import.meta.client) {
      localStorage.removeItem('ecocaptura-access-token')
      localStorage.removeItem('ecocaptura-refresh-token')
      localStorage.removeItem('ecocaptura-username')
    }
  }
}