import { useCallback, useEffect, useRef, useState } from 'react'
import { updateDriverLocation } from '../api/driver'
import { getCurrentPositionReliable, getGeoErrorMessage, WATCH_OPTIONS } from '../utils/geolocation'
import type { DriverAvailability } from '../types'

interface Position {
  lat: number
  lng: number
  accuracy?: number
}

export function useDriverLocation(isLive: boolean) {
  const [position, setPosition] = useState<Position | null>(null)
  const [error, setError] = useState<string | null>(null)
  const watchId = useRef<number | null>(null)
  const watchFailures = useRef(0)

  const syncLocation = useCallback(
    async (pos: Position, extra?: { isLocationLive?: boolean; availability?: DriverAvailability }) => {
      try {
        await updateDriverLocation({
          lat: pos.lat,
          lng: pos.lng,
          accuracy: pos.accuracy,
          ...extra,
        })
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update location')
      }
    },
    []
  )

  useEffect(() => {
    if (!isLive || !navigator.geolocation) {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current)
        watchId.current = null
      }
      return
    }

    watchFailures.current = 0

    watchId.current = navigator.geolocation.watchPosition(
      (geo) => {
        watchFailures.current = 0
        const pos = {
          lat: geo.coords.latitude,
          lng: geo.coords.longitude,
          accuracy: geo.coords.accuracy,
        }
        setPosition(pos)
        setError(null)
        syncLocation(pos, { isLocationLive: true, availability: 'AVAILABLE' })
      },
      (err) => {
        watchFailures.current += 1
        // Transient macOS errors — don't spam the UI until several failures
        if (watchFailures.current >= 3) {
          setError(getGeoErrorMessage(err))
        }
      },
      WATCH_OPTIONS
    )

    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [isLive, syncLocation])

  const goLive = useCallback(async () => {
    try {
      const geo = await getCurrentPositionReliable()
      const pos = {
        lat: geo.coords.latitude,
        lng: geo.coords.longitude,
        accuracy: geo.coords.accuracy,
      }
      setPosition(pos)
      await syncLocation(pos, { isLocationLive: true, availability: 'AVAILABLE' })
      setError(null)
      return true
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        setError(getGeoErrorMessage(err))
      } else {
        setError(err instanceof Error ? err.message : 'Could not get your location')
      }
      return false
    }
  }, [syncLocation])

  const goOffline = useCallback(async () => {
    try {
      await updateDriverLocation({ isLocationLive: false, availability: 'OFFLINE' })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to go offline')
    }
    setPosition(null)
  }, [])

  const setAvailability = useCallback(
    async (availability: DriverAvailability) => {
      if (!position && availability !== 'OFFLINE') {
        setError('Enable live location first')
        return
      }
      if (position) {
        await syncLocation(position, {
          isLocationLive: availability !== 'OFFLINE',
          availability,
        })
      }
    },
    [position, syncLocation]
  )

  return { position, error, goLive, goOffline, setAvailability, syncLocation }
}
