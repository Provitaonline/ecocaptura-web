export interface ValidateResponse {
  status: number
  accessToken?: string
  refreshToken?: string
  user?: {
    username: string
    PK: string
  }
}

export const validateUser = async (idToken: string): Promise<ValidateResponse> => {
  const config = useRuntimeConfig()
  
  interface ApiResponse {
    message: string
    accessToken: string
    refreshToken: string
    user: {
      username: string
      PK: string
    }
  }

  try {
    const response = await $fetch<ApiResponse>(
      `${config.public.apiBase}/token`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: { idToken }
      }
    )

    return {
      status: 200,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user
    }
  } catch (error: any) {
    if (error.status === 404) {
      return { status: 404 }
    }
    throw error
  }
}