import type { Job, Location, ShipmentLeg } from '../types'

export function jobRouteLocations(job: Job): Location[] {
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
