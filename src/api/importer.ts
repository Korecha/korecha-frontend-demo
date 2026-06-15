import { api } from './client'
import type { ImporterProfile, ItemType, Job, JobPricingQuote, JobRequest, Location, NearbyTruck, User } from '../types'

export function getImporterProfile() {
  return api<{ data: { user: User; profile: ImporterProfile; stats: Record<string, number> } }>(
    '/api/importer/profile'
  )
}

export function listImporterLocations() {
  return api<{ data: Location[] }>('/api/importer/locations')
}

export function listImporterItemTypes() {
  return api<{ data: ItemType[] }>('/api/importer/item-types')
}

export function previewJobPricing(body: {
  quantity: number
  pickup: { coordinates: { lat: number; lng: number } }
  delivery: { coordinates: { lat: number; lng: number } }
}) {
  return api<{ data: JobPricingQuote }>('/api/importer/jobs/preview-pricing', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function createJob(body: {
  itemTypeId: string
  quantity: number
  notes?: string
  pickup: { label: string; coordinates: { lat: number; lng: number }; locationId?: string }
  delivery: { label: string; coordinates: { lat: number; lng: number }; locationId?: string }
}) {
  return api<{ data: Job }>('/api/importer/jobs', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function listJobs() {
  return api<{ data: Job[] }>('/api/importer/jobs')
}

export function getJob(id: string) {
  return api<{ data: { job: Job; requests: JobRequest[] } }>(`/api/importer/jobs/${id}`)
}

export interface NearbyTrucksResult {
  nearby: NearbyTruck[]
  extended: NearbyTruck[]
  radiusKm: number
}

export function getNearbyTrucks(jobId: string) {
  return api<{ data: NearbyTrucksResult }>(`/api/importer/jobs/${jobId}/nearby-trucks`)
}

export function requestTruck(jobId: string, body: { driverId: string; truckId: string }) {
  return api<{ data: JobRequest }>(`/api/importer/jobs/${jobId}/request`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
