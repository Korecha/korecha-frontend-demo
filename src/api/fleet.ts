import { api } from './client'
import type {
  AvailabilityPosting,
  DriverProfile,
  FleetProfile,
  LoadMatchOffer,
  LoadMatchOfferStatus,
  Location,
  Truck,
  TruckType,
  User,
} from '../types'

export function getFleetProfile() {
  return api<{ data: { user: User; profile: FleetProfile; driverCount: number; truckCount: number } }>(
    '/api/fleet/profile'
  )
}

export function listFleetLocations() {
  return api<{ data: Location[] }>('/api/fleet/locations')
}

export function listFleetTruckTypes() {
  return api<{ data: TruckType[] }>('/api/fleet/truck-types')
}

export function listFleetDrivers() {
  return api<{ data: (DriverProfile & { user: User })[] }>('/api/fleet/drivers')
}

export function createFleetDriver(form: FormData) {
  return api<{ data: { user: User; profile: DriverProfile & { user: User } } }>('/api/fleet/drivers', {
    method: 'POST',
    body: form,
  })
}

export function listFleetTrucks() {
  return api<{ data: Truck[] }>('/api/fleet/trucks')
}

export function reviewFleetTruck(id: string, body: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) {
  return api<{ data: Truck }>(`/api/fleet/trucks/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function listMatchOffers(params?: { status?: LoadMatchOfferStatus | string }) {
  const qs = params?.status ? `?status=${encodeURIComponent(params.status)}` : ''
  return api<{ data: LoadMatchOffer[]; meta?: { trucksNeededTotal?: number; activeCount?: number } }>(
    `/api/fleet/match-offers${qs}`
  )
}

export function viewMatchOffer(id: string) {
  return api<{ data: LoadMatchOffer }>(`/api/fleet/match-offers/${id}/view`, {
    method: 'POST',
  })
}

export function declineMatchOffer(id: string) {
  return api<{ data: LoadMatchOffer }>(`/api/fleet/match-offers/${id}/decline`, {
    method: 'POST',
  })
}

export function assignMatchOffer(id: string, body: { truckId: string; driverId: string }) {
  return api<{ data: LoadMatchOffer }>(`/api/fleet/match-offers/${id}/assign`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function listAvailabilityPostings() {
  return api<{ data: AvailabilityPosting[] }>('/api/fleet/availability-postings')
}

export function createAvailabilityPosting(body: {
  truckId?: string
  originLocationId: string
  availableFrom: string
  availableTo: string
}) {
  return api<{ data: AvailabilityPosting }>('/api/fleet/availability-postings', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
