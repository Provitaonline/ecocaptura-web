export const validateUser = async (idToken: string) => {
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
      token: response.token,
      user: response.user
    }
  } catch (error: any) {
    // Nuxt/ofetch throws an error object for 4xx/5xx status codes
    if (error.status === 404) {
      return { status: 404 }
    }
    throw error
  }
}