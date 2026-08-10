import { api } from './client'
import type { Container, DriverProfile, FleetManagerStaff, FleetProfile, Location, Truck, TruckType, User } from '../types'

export function getFleetProfile() {
  return api<{
    data: { user: User; profile: FleetProfile; staff: FleetManagerStaff; driverCount: number; truckCount: number }
  }>('/api/fleet/profile')
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

export function toggleFleetTruckAvailability(id: string, isAvailable: boolean) {
  return api<{ data: Truck }>(`/api/fleet/trucks/${id}/availability`, {
    method: 'POST',
    body: JSON.stringify({ isAvailable }),
  })
}

// Read-only tab for MTO-linked fleet managers (heads-up #2) — empty for everyone else.
export function listFleetContainers() {
  return api<{ data: Container[] }>('/api/fleet/containers')
}
