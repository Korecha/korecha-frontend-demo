import type { Job, Location } from '../types'

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
