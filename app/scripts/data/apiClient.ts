import { useRuntimeConfig } from '#imports'
import { useAuthStore } from '~/scripts/stores/auth'
import { tokenStorage } from '../utils/tokenStorage'

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const config = useRuntimeConfig()
  const auth = useAuthStore()
  let accessToken = tokenStorage.getAccessToken()

  const makeRequest = async (token: string | null) => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${config.public.apiBase}${cleanEndpoint}`

    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || ''}`,
        ...(options.headers || {})
      }
    })
  }

  let response = await makeRequest(accessToken)

  // Catch both HTTP 401/403 AND custom 200/4xx responses where error data returns InvalidToken
  let responseData: any = null
  const clone = response.clone()
  try {
    responseData = await clone.json()
  } catch {
    // Response wasn't JSON
  }

  const isTokenExpired = 
    response.status === 401 || 
    response.status === 403 || 
    responseData?.error === 'InvalidToken' || 
    responseData?.description?.includes('expired')

  if (isTokenExpired) {
    const newToken = await auth.refreshAccessToken()
    if (newToken) {
      response = await makeRequest(newToken)
    } else {
      throw new Error('Unauthorized: Session could not be refreshed.')
    }
  }

  if (!response.ok) {
    throw new Error(`API Error [${endpoint}]: ${response.status} ${response.statusText}`)
  }

  return responseData || (await response.json())
}