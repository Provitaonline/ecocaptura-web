import { apiClient } from './apiClient'

export interface CapturePhoto {
  photoId: string
  description?: string | null
  heading?: number | null
  tiltY?: number | null
  roll?: number | null
  fov?: number | null
  zoomLevel?: number | null
  rawSensors?: Record<string, any>
  gpsCoordinates?: string | null
  gpsAccuracy?: number | null
  gpsAltitude?: number | null
  geoHash?: string
  timestamp?: string | null
  s3Key: string
  thumbKey: string
  thumbnailUrl: string | null
}

export interface CaptureDetailRecord {
  captureId: string
  description?: string | null
  qualityScore?: number | null
  qualityReason?: string | null
  centroidCoordinates: string
  centroidGeoHash: string
  timestamp: string
  createdAt: string
  photos: CapturePhoto[]
}

export async function getCaptureDetails(captureId: string | number): Promise<CaptureDetailRecord> {
  if (!captureId) {
    throw new Error('A valid captureId is required to fetch capture details.')
  }

  return apiClient<CaptureDetailRecord>(`capture/${captureId}`)
}