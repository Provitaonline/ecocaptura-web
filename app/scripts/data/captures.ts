import { apiClient } from './apiClient';

export interface Capture {
  captureId: string
  description?: string
  qualityScore?: number
  qualityReason?: string
  centroidCoordinates?: string
  centroidGeoHash?: string
  timestamp?: string
  createdAt?: string
  expanded?: boolean
}

export async function getCaptures(): Promise<Capture[]> {
  const response = await apiClient<{ captures: Capture[] }>('/captures')
  return response.captures || []
}