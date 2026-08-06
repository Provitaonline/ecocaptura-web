import { useRuntimeConfig } from '#imports'

async function refreshAccessToken(): Promise<string | null> {
  const config = useRuntimeConfig()
  const refreshToken = localStorage.getItem('ecocaptura-refresh-token')
  if (!refreshToken) return null

  try {
    const response = await fetch(`${config.public.apiBase}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })

    if (!response.ok) throw new Error('Refresh token expired or invalid')

    const data = await response.json()
    const newAccessToken = data.accessToken
    
    if (newAccessToken) {
      localStorage.setItem('ecocaptura-access-token', newAccessToken)
      return newAccessToken
    }
  } catch (error) {
    console.error('Session completely expired. Clearing tokens.', error)
    localStorage.removeItem('ecocaptura-access-token')
    localStorage.removeItem('ecocaptura-refresh-token')
    window.dispatchEvent(new CustomEvent('auth-expired'))
  }
  
  return null
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const config = useRuntimeConfig()
  let accessToken = localStorage.getItem('ecocaptura-access-token')

  const makeRequest = async (token: string | null) => {
    // Ensure endpoint handles leading slashes cleanly
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

  if (response.status === 401) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      response = await makeRequest(newToken)
    } else {
      throw new Error('Unauthorized: Session could not be refreshed.')
    }
  }

  if (!response.ok) {
    throw new Error(`API Error [${endpoint}]: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}