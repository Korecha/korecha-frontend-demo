import { api } from './client'
import type { DriverAvailability, DriverProfile, Location, Truck, User } from '../types'

export function getDriverProfile() {
  return api<{
    data: {
      user: User
      profile: DriverProfile
      stats: {
        truckCount: number
        pendingTruckCount: number
        pendingRequestCount: number
        activeJobCount: number
      }
    }
  }>('/api/driver/profile')
}

export function listDriverLocations() {
  return api<{ data: Location[] }>('/api/driver/locations')
}

export function updateDriverRoutes(preferredRouteIds: string[]) {
  return api<{ data: DriverProfile }>('/api/driver/profile/routes', {
    method: 'PUT',
    body: JSON.stringify({ preferredRouteIds }),
  })
}

export function updateDriverLocation(body: {
  lat?: number
  lng?: number
  accuracy?: number
  isLocationLive?: boolean
  availability?: DriverAvailability
}) {
  return api<{ data: DriverProfile }>('/api/driver/location', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function listDriverTrucks() {
  return api<{ data: Truck[] }>('/api/driver/trucks')
}

export function createDriverTruck(body: { plateNumber: string; truckTypeId: string }) {
  return api<{ data: Truck }>('/api/driver/trucks', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function listDriverJobRequests() {
  return api<{ data: import('../types').JobRequest[] }>('/api/driver/jobs/requests')
}

export function listDriverActiveJobs() {
  return api<{ data: import('../types').Job[] }>('/api/driver/jobs/active')
}

export function listDriverJobHistory() {
  return api<{ data: import('../types').Job[] }>('/api/driver/jobs/history')
}

export function getDriverJob(id: string) {
  return api<{ data: { job: import('../types').Job; request: import('../types').JobRequest | null } }>(
    `/api/driver/jobs/${id}`
  )
}

export function respondToJobRequest(id: string, accept: boolean) {
  return api<{ data: import('../types').JobRequest }>(`/api/driver/jobs/requests/${id}/respond`, {
    method: 'POST',
    body: JSON.stringify({ accept }),
  })
}

export function startDriverJob(id: string) {
  return api<{ data: import('../types').Job }>(`/api/driver/jobs/${id}/start`, { method: 'POST' })
}

export function completeDriverJob(id: string) {
  return api<{ data: import('../types').Job }>(`/api/driver/jobs/${id}/complete`, { method: 'POST' })
}
