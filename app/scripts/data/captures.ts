import { apiClient } from './apiClient';

export interface Capture {
  captureId: string
  username?: string
  description?: string
  qualityScore?: number
  qualityReason?: string
  centroidCoordinates?: string
  centroidGeoHash?: string
  timestamp?: string
  createdAt?: string
  expanded?: boolean
}

export interface GetCapturesByLocResponse {
  center: { lat: number; lon: number }
  radiusKm: number
  count: number
  captures: Capture[]
}

export async function getCaptures(): Promise<Capture[]> {
  const response = await apiClient<{ captures: Capture[] }>('/captures')
  return response.captures || []
}

export async function getCapturesByLoc(lat: number, lon: number, username?: string): Promise<GetCapturesByLocResponse> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString()
  })
  
  if (username) {
    params.append('username', username)
  }

  return await apiClient<GetCapturesByLocResponse>(`/loccaptures?${params.toString()}`)
}

export { updateCapture, type UpdateCapturePayload } from './captureDetails'