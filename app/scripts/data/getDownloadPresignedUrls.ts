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
  items: PresignItem[]
): Promise<PresignedUrlResult[]> {
  const data = await apiClient<PresignResponse>('/presign-download', {
    method: 'POST',
    body: JSON.stringify({
      captureId,
      items
    })
  })

  return data.presignedUrls
}