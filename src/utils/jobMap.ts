import type { JobPoint, Location, ShipmentLeg, TrackingEvent } from '../types'

export function jobRouteLocations(job: { pickup: JobPoint; delivery: JobPoint }): Location[] {
  return [
    {
      id: 'pickup',
      name: job.pickup.label,
      type: 'PORT',
      region: 'Pickup',
      coordinates: job.pickup.coordinates,
      isActive: true,
    },
    {
      id: 'delivery',
      name: job.delivery.label,
      type: 'PORT',
      region: 'Delivery',
      coordinates: job.delivery.coordinates,
      isActive: true,
    },
  ]
}

export function trackingPath(events: TrackingEvent[] | undefined | null): { lat: number; lng: number }[] {
  return (events ?? []).map((e) => ({ lat: e.lat, lng: e.lng }))
}

export function legsTrackingPath(legs: ShipmentLeg[]): { lat: number; lng: number }[] {
  return legs.flatMap((leg) => trackingPath(leg.tracking))
}

export function legRouteLocations(leg: ShipmentLeg): Location[] {
  const from = typeof leg.fromLocationId === 'object' && leg.fromLocationId ? leg.fromLocationId : null
  const to = typeof leg.toLocationId === 'object' && leg.toLocationId ? leg.toLocationId : null
  if (!from?.coordinates || !to?.coordinates) return []
  return [
    {
      id: from.id || 'from',
      name: from.name,
      type: from.type,
      region: from.region,
      coordinates: from.coordinates,
      isActive: true,
    },
    {
      id: to.id || 'to',
      name: to.name,
      type: to.type,
      region: to.region,
      coordinates: to.coordinates,
      isActive: true,
    },
  ]
}
