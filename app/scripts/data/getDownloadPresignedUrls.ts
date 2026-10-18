import { apiClient } from './apiClient'

interface PresignItem {
  id: string
  type?: 'PHOTO' | 'THUMB'
}

interface PresignedUrlResult {
  id: string
  type: string
  s3Key: string
  downloadUrl: string
}

interface PresignResponse {
  captureId: string
  presignedUrls: PresignedUrlResult[]
}

export async function getDownloadPresignedUrls(
  captureId: string, 
  items: PresignItem[],
  username?: string
): Promise<PresignedUrlResult[]> {
  const data = await apiClient.post<PresignResponse>('/presign-download', {
    captureId,
    items,
    username
  })

  return data.presignedUrls
}