import { api } from './client'
import type {
  ApprovalStatus,
  ContainerSize,
  DriverProfile,
  FleetProfile,
  Location,
  Organization,
  Pricing,
  QuotePreview,
  Truck,
  TruckType,
  User,
} from '../types'

export function listOrgLocations() {
  return api<{ data: Location[] }>('/api/org/locations')
}

export function getOrgProfile() {
  return api<{ data: { organization: Organization; memberCount: number } }>('/api/org/profile')
}

export function listOrgUsers() {
  return api<{ data: User[] }>('/api/org/users')
}

export function createOrgUser(form: FormData) {
  return api<{ data: User }>('/api/org/users', {
    method: 'POST',
    body: form,
  })
}

export function getOrgPricing() {
  return api<{ data: Pricing }>('/api/org/pricing')
}

export function updateOrgPricing(pricing: Partial<Pricing>) {
  return api<{ data: Pricing }>('/api/org/pricing', {
    method: 'PUT',
    body: JSON.stringify(pricing),
  })
}

export function previewOrgPricing(body: {
  originLocationId: string
  destinationLocationId: string
  containerSize: ContainerSize
  containerType?: string
  isRoundTrip?: boolean
}) {
  return api<{ data: QuotePreview }>('/api/org/pricing/preview', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function listApplications(status: ApprovalStatus = 'PENDING') {
  return api<{ data: { drivers: DriverProfile[]; fleets: FleetProfile[]; importers: import('../types').ImporterProfile[] } }>(
    `/api/org/applications?status=${status}`
  )
}

export function reviewDriverApplication(id: string, body: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) {
  return api<{ data: DriverProfile }>(`/api/org/applications/drivers/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function reviewImporterApplication(id: string, body: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) {
  return api<{ data: import('../types').ImporterProfile }>(`/api/org/applications/importers/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function reviewFleetApplication(id: string, body: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) {
  return api<{ data: FleetProfile }>(`/api/org/applications/fleets/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function listItemTypes() {
  return api<{ data: import('../types').ItemType[] }>('/api/org/item-types')
}

export function createItemType(body: { name: string; description?: string; unit?: string }) {
  return api<{ data: import('../types').ItemType }>('/api/org/item-types', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateItemType(id: string, body: Partial<{ name: string; description: string; unit: string; isActive: boolean }>) {
  return api<{ data: import('../types').ItemType }>(`/api/org/item-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function listTruckTypes() {
  return api<{ data: TruckType[] }>('/api/org/truck-types')
}

export function createTruckType(body: { name: string; description?: string }) {
  return api<{ data: TruckType }>('/api/org/truck-types', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateTruckType(id: string, body: Partial<{ name: string; description: string; isActive: boolean }>) {
  return api<{ data: TruckType }>(`/api/org/truck-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function listPendingTrucks() {
  return api<{ data: Truck[] }>('/api/org/trucks/pending')
}

export function reviewOrgTruck(id: string, body: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) {
  return api<{ data: Truck }>(`/api/org/trucks/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
