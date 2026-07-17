export interface RegisterResponse {
  status: 201 | 409
  token?: string
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
    token: string
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
      token: response.token,
      user: response.user
    }
  } catch (error: any) {
    // fetch throws for non-2xx responses
    if (error.status === 409) {
      return { 
        status: 409, 
        message: error.data?.message || 'Username already taken' 
      }
    }
    
    // Re-throw if it's an unexpected error (e.g., 500)
    throw error
  }
}