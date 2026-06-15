export function getGeoErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return 'Location permission denied. Allow location access for this site in your browser settings.'
    case err.POSITION_UNAVAILABLE:
      return 'Could not determine your location (GPS unavailable). Enable Wi‑Fi, move near a window, or set the point on the map instead.'
    case err.TIMEOUT:
      return 'Location request timed out. Try again or tap the map to set your position.'
    default:
      if (err.message?.includes('kCLErrorLocationUnknown') || err.message?.includes('LocationUnknown')) {
        return 'Location temporarily unavailable. Try again in a few seconds, or tap the map to place your point.'
      }
      return err.message || 'Could not get your location'
  }
}

type PositionOptions = {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

const ATTEMPTS: PositionOptions[] = [
  // Best for macOS/desktop — Wi‑Fi positioning, allows recent cache
  { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 },
  // Outdoor / mobile GPS
  { enableHighAccuracy: true, timeout: 25000, maximumAge: 10000 },
  // Last resort — any cached position
  { enableHighAccuracy: false, timeout: 30000, maximumAge: 300000 },
]

function tryGetCurrentPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

/** Resolves with a position, retrying with progressively relaxed options (helps macOS kCLErrorLocationUnknown). */
export async function getCurrentPositionReliable(): Promise<GeolocationPosition> {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported on this device')
  }

  let lastError: GeolocationPositionError | null = null
  for (const opts of ATTEMPTS) {
    try {
      return await tryGetCurrentPosition(opts)
    } catch (err) {
      lastError = err as GeolocationPositionError
      // Permission denied won't succeed on retry
      if (lastError.code === lastError.PERMISSION_DENIED) break
    }
  }

  throw lastError ?? new Error('Could not get your location')
}

export const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 15000,
  timeout: 30000,
}
