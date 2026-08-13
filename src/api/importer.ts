import { api } from './client'
import type {
  AvailabilityPosting,
  ImporterProfile,
  ItemType,
  Job,
  JobPricingQuote,
  JobRequest,
  LoadMatchOffer,
  LoadPosting,
  Location,
  MatchingMode,
  NearbyTruck,
  User,
} from '../types'

export type CreateLoadPostingBody = {
  itemTypeId: string
  quantity: number
  notes?: string
  pickup: { locationId: string }
  delivery: { locationId: string }
  pickupGateId: string
  deliveryGateId: string
  fxFinanced: boolean
  bankPermitNo?: string
  matchingMode: MatchingMode
}

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

export function listImporterGateEntrances() {
  return api<{ data: import('../types').GateEntrance[] }>('/api/importer/gate-entrances')
}

export function previewJobPricing(body: {
  itemTypeId?: string
  quantity: number
  pickup: { locationId: string }
  delivery: { locationId: string }
  pickupGateId: string
  deliveryGateId: string
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
  pickup: { locationId: string }
  delivery: { locationId: string }
  pickupGateId: string
  deliveryGateId: string
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

export function approveJob(jobId: string) {
  return api<{ data: Job }>(`/api/importer/jobs/${jobId}/approve`, {
    method: 'POST',
  })
}

export function createLoadPosting(body: CreateLoadPostingBody) {
  return api<{ data: { loadPosting: LoadPosting; offers: LoadMatchOffer[] } }>(
    '/api/importer/load-postings',
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  )
}

export function listLoadPostings() {
  return api<{ data: LoadPosting[] }>('/api/importer/load-postings')
}

export function getLoadPosting(id: string) {
  return api<{
    data: { loadPosting: LoadPosting; offers?: LoadMatchOffer[]; offersSummary?: { total: number } }
  }>(`/api/importer/load-postings/${id}`)
}

export type NearbyAvailabilityPosting = AvailabilityPosting & { distanceKm: number }

export function listNearbyAvailabilityPostings(params: { lat: number; lng: number; radiusKm?: number }) {
  const qs = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    ...(params.radiusKm ? { radiusKm: String(params.radiusKm) } : {}),
  })
  return api<{ data: NearbyAvailabilityPosting[] }>(`/api/importer/availability-postings/nearby?${qs}`)
}
