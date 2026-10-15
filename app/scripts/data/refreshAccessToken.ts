import { tokenStorage } from '../utils/tokenStorage'

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken()
  if (!refreshToken) return null

  const config = useRuntimeConfig()
  const response = await fetch(`${config.public.apiBase}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  })

  if (!response.ok) {
    throw new Error('Refresh token expired or invalid')
  }

  const data = await response.json()
  const newAccessToken = data.accessToken || data.token

  if (newAccessToken) {
    tokenStorage.setAccessToken(newAccessToken)
    return newAccessToken
  }

  return null
}