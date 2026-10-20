import { useRuntimeConfig } from '#imports'
import { useAuthStore } from '@/scripts/stores/auth'
import { tokenStorage } from '@/scripts/utils/tokenStorage'

export interface ApiClientOptions extends Omit<RequestInit, 'body'> {
  body?: any
}

export async function apiClient<T>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
  const config = useRuntimeConfig()
  const auth = useAuthStore()
  let accessToken = tokenStorage.getAccessToken()

  const formattedBody =
    options.body !== undefined &&
    typeof options.body === 'object' &&
    !(options.body instanceof FormData) &&
    !(options.body instanceof Blob) &&
    !(options.body instanceof ArrayBuffer)
      ? JSON.stringify(options.body)
      : options.body

  const makeRequest = async (token: string | null) => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${config.public.apiBase}${cleanEndpoint}`

    return fetch(url, {
      ...options,
      body: formattedBody,
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
    const newToken = await auth.refreshSession()
    if (newToken) {
      response = await makeRequest(newToken)
      responseData = null
      try {
        responseData = await response.clone().json()
      } catch {
        // Response wasn't JSON
      }
    } else {
      throw new Error('Unauthorized: Session could not be refreshed.')
    }
  }

  if (!response.ok) {
    const errorMessage = responseData?.message || responseData?.error || response.statusText
    throw new Error(`API Error [${endpoint}]: ${response.status} ${errorMessage}`)
  }

  if (response.status === 204) {
    return null as T
  }

  if (responseData !== null) {
    return responseData as T
  }

  try {
    const text = await response.text()
    if (!text) return null as T
    return JSON.parse(text) as T
  } catch {
    return null as T
  }
}

apiClient.get = <T>(endpoint: string, options?: ApiClientOptions) =>
  apiClient<T>(endpoint, { ...options, method: 'GET' })

apiClient.post = <T>(endpoint: string, body?: any, options?: ApiClientOptions) =>
  apiClient<T>(endpoint, { ...options, method: 'POST', body })

apiClient.patch = <T>(endpoint: string, body?: any, options?: ApiClientOptions) =>
  apiClient<T>(endpoint, { ...options, method: 'PATCH', body })

apiClient.put = <T>(endpoint: string, body?: any, options?: ApiClientOptions) =>
  apiClient<T>(endpoint, { ...options, method: 'PUT', body })

apiClient.delete = <T>(endpoint: string, options?: ApiClientOptions) =>
  apiClient<T>(endpoint, { ...options, method: 'DELETE' })