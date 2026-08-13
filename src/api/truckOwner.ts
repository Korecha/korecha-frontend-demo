import { api } from './client'
import type { AvailabilityPosting, Location } from '../types'

export function listTruckOwnerLocations() {
  return api<{ data: Location[] }>('/api/truck-owner/locations')
}

export function listTruckOwnerAvailabilityPostings() {
  return api<{ data: AvailabilityPosting[] }>('/api/truck-owner/availability-postings')
}

export function createTruckOwnerAvailabilityPosting(body: {
  originLocationId: string
  availableFrom: string
  availableTo: string
}) {
  return api<{ data: AvailabilityPosting }>('/api/truck-owner/availability-postings', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
