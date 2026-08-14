const urlCache = new Map<string, { url: string; expiresAt: number }>()

export function getCachedPresignedUrl(photoId: string): string | null {
  const cached = urlCache.get(photoId)
  if (!cached) return null

  // Check if it's expired or about to expire in the next 60 seconds
  if (Date.now() >= cached.expiresAt - 60000) {
    urlCache.delete(photoId)
    return null
  }

  return cached.url
}

export function cachePresignedUrl(photoId: string, url: string, expiresInSeconds = 900) {
  // Default S3 presigned expiry is usually 900s (15 mins)
  const expiresAt = Date.now() + (expiresInSeconds * 1000)
  urlCache.set(photoId, { url, expiresAt })
}