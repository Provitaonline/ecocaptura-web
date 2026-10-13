import { apiClient } from './apiClient'

export interface AdminUser {
  username: string
  email: string
  isAdmin: boolean
  isReviewer: boolean
}

export interface UpdateUserRolesPayload {
  isAdmin?: boolean
  isReviewer?: boolean
}

export async function getUsers(): Promise<AdminUser[]> {
  const response = await apiClient<{ users: AdminUser[] }>('/users')
  return response.users || []
}

export async function updateUserRoles(
  username: string,
  payload: UpdateUserRolesPayload
): Promise<AdminUser> {
  return apiClient.patch<AdminUser>(`user/${username}`, payload)
}

