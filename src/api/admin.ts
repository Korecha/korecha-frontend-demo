import { api } from './client'
import type {
  Container,
  ContainerSize,
  ContainerStatus,
  ContainerType,
  DashboardStats,
  ImporterProfile,
  ItemType,
  Location,
  Organization,
  OrgStatus,
  OrgType,
  PaginatedMeta,
  PlatformSettings,
  Pricing,
  QuotePreview,
  User,
} from '../types'

export function getDashboardStats() {
  return api<{ data: DashboardStats }>('/api/admin/dashboard/stats')
}

export function listOrganizations(params?: {
  page?: number
  type?: OrgType
  status?: OrgStatus
  search?: string
}) {
  const q = new URLSearchParams()
  if (params?.page) q.set('page', String(params.page))
  if (params?.type) q.set('type', params.type)
  if (params?.status) q.set('status', params.status)
  if (params?.search) q.set('search', params.search)
  const qs = q.toString()
  return api<{ data: Organization[]; meta: PaginatedMeta }>(
    `/api/admin/organizations${qs ? `?${qs}` : ''}`
  )
}

export function getOrganization(id: string) {
  return api<{ data: Organization }>(`/api/admin/organizations/${id}`)
}

export function createOrganization(
  body: Partial<Organization> & {
    basePricePerKm?: number
    adminFullName: string
    adminEmail: string
    adminPassword: string
  }
) {
  return api<{ data: Organization }>('/api/admin/organizations', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function createOrgCredentials(
  orgId: string,
  body: { adminFullName: string; adminEmail: string; adminPassword: string }
) {
  return api<{ data: User }>(`/api/admin/organizations/${orgId}/credentials`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateOrganization(id: string, body: Partial<Organization> & { basePricePerKm?: number }) {
  return api<{ data: Organization }>(`/api/admin/organizations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function suspendOrganization(id: string) {
  return api<{ data: Organization }>(`/api/admin/organizations/${id}`, {
    method: 'DELETE',
  })
}

export function getPricing(orgId: string) {
  return api<{ data: Pricing }>(`/api/admin/organizations/${orgId}/pricing`)
}

export function updatePricing(orgId: string, pricing: Partial<Pricing>) {
  return api<{ data: Pricing }>(`/api/admin/organizations/${orgId}/pricing`, {
    method: 'PUT',
    body: JSON.stringify(pricing),
  })
}

export function previewPricing(
  orgId: string,
  body: {
    originLocationId: string
    destinationLocationId: string
    containerSize: ContainerSize
    containerType?: ContainerType
    isRoundTrip?: boolean
  }
) {
  return api<{ data: QuotePreview }>(`/api/admin/organizations/${orgId}/pricing/preview`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function listContainers(params?: {
  page?: number
  orgId?: string
  status?: ContainerStatus
  size?: ContainerSize
  search?: string
}) {
  const q = new URLSearchParams()
  if (params?.page) q.set('page', String(params.page))
  if (params?.orgId) q.set('orgId', params.orgId)
  if (params?.status) q.set('status', params.status)
  if (params?.size) q.set('size', params.size)
  if (params?.search) q.set('search', params.search)
  const qs = q.toString()
  return api<{ data: Container[]; meta: PaginatedMeta }>(
    `/api/admin/containers${qs ? `?${qs}` : ''}`
  )
}

export function createContainer(body: {
  containerNumber: string
  size: ContainerSize
  type: ContainerType
  status: ContainerStatus
  organizationId: string
  locationId?: string
  locationLabel?: string
  shippingLineCode?: string
  lastFreeDay?: string
  notes?: string
}) {
  return api<{ data: Container }>('/api/admin/containers', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateContainer(
  id: string,
  body: Partial<{
    status: ContainerStatus
    organizationId: string
    locationId: string | null
    locationLabel: string
    shippingLineCode: string
    lastFreeDay: string | null
    notes: string
  }>
) {
  return api<{ data: Container }>(`/api/admin/containers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deleteContainer(id: string) {
  return api<{ data: { id: string } }>(`/api/admin/containers/${id}`, {
    method: 'DELETE',
  })
}

export function bulkUploadContainers(file: File) {
  const form = new FormData()
  form.append('file', file)
  return api<{
    data: { created: number; failed: { row: number; error: string }[]; containers: Container[] }
  }>('/api/admin/containers/bulk', { method: 'POST', body: form })
}

export function listLocations() {
  return api<{ data: Location[] }>('/api/admin/locations')
}

export function createLocation(body: Partial<Location>) {
  return api<{ data: Location }>('/api/admin/locations', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateLocation(id: string, body: Partial<Location>) {
  return api<{ data: Location }>(`/api/admin/locations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function getSettings() {
  return api<{ data: PlatformSettings }>('/api/admin/settings')
}

export function updateSettings(body: Partial<PlatformSettings>) {
  return api<{ data: PlatformSettings }>('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function listSoleImporterApplications(status = 'PENDING') {
  return api<{ data: ImporterProfile[] }>(`/api/admin/applications/importers?status=${status}`)
}

export function reviewSoleImporterApplication(
  id: string,
  body: {
    status: 'APPROVED' | 'REJECTED'
    rejectionReason?: string
    organizationId?: string
    createOrganization?: {
      name: string
      contactEmail?: string
      phone?: string
      address?: string
      basePricePerKm?: number
    }
  }
) {
  return api<{ data: ImporterProfile }>(`/api/admin/applications/importers/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function listDefaultItemTypes() {
  return api<{ data: ItemType[] }>('/api/admin/item-types')
}

export function createDefaultItemType(body: {
  name: string
  description?: string
  unit?: string
  pricePerKmEtb?: number
  flatFeeEtb?: number
}) {
  return api<{ data: ItemType }>('/api/admin/item-types', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateDefaultItemType(
  id: string,
  body: Partial<{
    name: string
    description: string
    unit: string
    pricePerKmEtb: number
    flatFeeEtb: number
    isActive: boolean
  }>
) {
  return api<{ data: ItemType }>(`/api/admin/item-types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}
