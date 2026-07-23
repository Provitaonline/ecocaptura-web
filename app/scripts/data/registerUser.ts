export interface RegisterResponse {
  status: 201 | 409
  accessToken?: string
  refreshToken?: string
  user?: {
    username: string
    PK: string
  }
  message?: string
}

export const registerUser = async (idToken: string, username: string): Promise<RegisterResponse> => {
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
      `${config.public.apiBase}/user`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: { idToken, username }
      }
    )

    // Successful registration (201)
    return {
      status: 201,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user
    }
  } catch (error: any) {
    if (error.status === 409) {
      return { 
        status: 409, 
        message: error.data?.message || 'Username already taken' 
      }
    }
    
    throw error
  }
}