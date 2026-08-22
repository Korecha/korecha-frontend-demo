import { api } from './client'
import type {
  AvailabilityPosting,
  DriverProfile,
  Location,
  Payment,
  Truck,
  TruckType,
  User,
} from '../types'

export function getTruckOwnerProfile() {
  return api<{
    data: {
      user: User
      profile: import('../types').TruckOwnerProfile
      driverCount: number
      truckCount: number
    }
  }>('/api/truck-owner/profile')
}

export function listTruckOwnerLocations() {
  return api<{ data: Location[] }>('/api/truck-owner/locations')
}

export function listTruckOwnerTruckTypes() {
  return api<{ data: TruckType[] }>('/api/truck-owner/truck-types')
}

export function listTruckOwnerDrivers() {
  return api<{ data: (DriverProfile & { user: User })[] }>('/api/truck-owner/drivers')
}

export function createTruckOwnerDriver(form: FormData) {
  return api<{ data: { user: User; profile: DriverProfile & { user: User } } }>(
    '/api/truck-owner/drivers',
    {
      method: 'POST',
      body: form,
    },
  )
}

export function listTruckOwnerTrucks() {
  return api<{ data: Truck[] }>('/api/truck-owner/trucks')
}

export function createTruckOwnerTruck(body: {
  plateNumber: string
  truckTypeId: string
  driverId?: string
}) {
  return api<{ data: Truck }>('/api/truck-owner/trucks', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getTruckOwnerEarnings() {
  return api<{
    data: {
      totals: { HELD: number; RELEASED: number; DISPUTED: number }
      payments: Payment[]
    }
  }>('/api/truck-owner/earnings')
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
