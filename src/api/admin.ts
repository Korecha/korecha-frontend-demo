import { api } from './client'
import type {
  AdminOrgFleetMembers,
  AdminOrgFleetTree,
  AdminSearchResults,
  ApprovalStatus,
  CommissionSetting,
  CommissionScopeType,
  CommissionMatrix,
  Container,
  ContainerSize,
  ContainerStatus,
  ContainerType,
  DashboardPeriodKey,
  DashboardStats,
  EffectiveCommission,
  FleetManagerApplication,
  ItemType,
  ItemTypeModePricingLeaf,
  LoadPosting,
  LoadPostingStatus,
  Location,
  LocationStatus,
  ModeScope,
  Organization,
  OrgStatus,
  OrgType,
  PaginatedMeta,
  PlatformSettings,
  Pricing,
  QuotePreview,
  Shipment,
  ShipmentStatus,
  TradeCustomerApplication,
  TradeCustomerSource,
  Truck,
  TruckOwnerProfile,
  User,
} from '../types'

export function getDashboardStats(params?: { period?: DashboardPeriodKey }) {
  const q = new URLSearchParams()
  if (params?.period) q.set('period', params.period)
  const qs = q.toString()
  return api<{ data: DashboardStats }>(`/api/admin/dashboard/stats${qs ? `?${qs}` : ''}`)
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
    `/api/admin/organizations${qs ? `?${qs}` : ''}`,
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
  },
) {
  return api<{ data: Organization }>('/api/admin/organizations', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function createOrgCredentials(
  orgId: string,
  body: { adminFullName: string; adminEmail: string; adminPassword: string },
) {
  return api<{ data: User }>(`/api/admin/organizations/${orgId}/credentials`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateOrganization(
  id: string,
  body: Partial<Organization> & { basePricePerKm?: number },
) {
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
  },
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
    `/api/admin/containers${qs ? `?${qs}` : ''}`,
  )
}

export function getContainer(id: string) {
  return api<{ data: Container }>(`/api/admin/containers/${id}`)
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
  }>,
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
    data: {
      created: number
      failed: { row: number; error: string }[]
      containers: Container[]
    }
  }>('/api/admin/containers/bulk', { method: 'POST', body: form })
}

export function listLocations(params?: { status?: LocationStatus | 'ALL'; isCustomsBranch?: boolean }) {
  const q = new URLSearchParams()
  if (params?.status) q.set('status', params.status)
  if (params?.isCustomsBranch !== undefined) q.set('isCustomsBranch', String(params.isCustomsBranch))
  const qs = q.toString()
  return api<{ data: Location[] }>(`/api/admin/locations${qs ? `?${qs}` : ''}`)
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

export function publishLocation(id: string, coordinates: { lat: number; lng: number }) {
  return api<{ data: Location }>(`/api/admin/locations/${id}/publish`, {
    method: 'PATCH',
    body: JSON.stringify({ coordinates }),
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

export function listTradeCustomerApplications(status: ApprovalStatus | 'ALL' = 'PENDING') {
  const q = new URLSearchParams()
  q.set('status', status)
  return api<{ data: TradeCustomerApplication[] }>(
    `/api/admin/applications/trade-customers?${q.toString()}`,
  )
}

export function reviewTradeCustomerApplication(
  id: string,
  body: {
    source: TradeCustomerSource
    status: 'APPROVED' | 'REJECTED'
    rejectionReason?: string
    tier?: string
  },
) {
  return api<{ data: TradeCustomerApplication }>(
    `/api/admin/applications/trade-customers/${id}/review`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
}

export function listFleetManagerApplications(params?: {
  status?: ApprovalStatus | 'ALL'
  modeScope?: ModeScope
}) {
  const q = new URLSearchParams()
  if (params?.status) q.set('status', params.status)
  if (params?.modeScope) q.set('modeScope', params.modeScope)
  const qs = q.toString()
  return api<{ data: FleetManagerApplication[] }>(
    `/api/admin/applications/fleet-managers${qs ? `?${qs}` : ''}`,
  )
}

export function reviewFleetManagerApplication(
  id: string,
  body: {
    status: 'APPROVED' | 'REJECTED'
    rejectionReason?: string
  },
) {
  return api<{ data: FleetManagerApplication }>(
    `/api/admin/applications/fleet-managers/${id}/review`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
}

/** Rows are licensed_operator fleet managers. isSelfPaired is gone from the payload. */
export function listTruckOwners(status?: ApprovalStatus) {
  const qs = status ? `?status=${status}` : ''
  return api<{ data: TruckOwnerProfile[] }>(`/api/admin/truck-owners${qs}`)
}

export function reviewTruckOwner(
  id: string,
  body: {
    status: 'APPROVED' | 'REJECTED'
    rejectionReason?: string
  },
) {
  return api<{ data: TruckOwnerProfile }>(`/api/admin/truck-owners/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function setTruckOwnerCanPostAvailability(id: string, canPostAvailability: boolean) {
  return api<{ data: TruckOwnerProfile }>(`/api/admin/truck-owners/${id}/can-post-availability`, {
    method: 'POST',
    body: JSON.stringify({ canPostAvailability }),
  })
}

export function listPendingTrucks() {
  return api<{ data: Truck[] }>('/api/admin/trucks/pending')
}

export function reviewTruck(
  id: string,
  body: {
    status: 'APPROVED' | 'REJECTED'
    rejectionReason?: string
  },
) {
  return api<{ data: Truck }>(`/api/admin/trucks/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function listAvailabilityRequests(status?: ApprovalStatus | 'ALL') {
  const qs = status ? `?status=${status}` : ''
  return api<{ data: TruckOwnerProfile[] }>(`/api/admin/truck-owners/availability-requests${qs}`)
}

export function reviewAvailabilityRequest(
  id: string,
  body: {
    status: 'APPROVED' | 'REJECTED'
    rejectionReason?: string
  },
) {
  return api<{ data: TruckOwnerProfile }>(
    `/api/admin/truck-owners/${id}/availability-request/review`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
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
  specialHandling?: ItemType['specialHandling']
  requiresQuote?: boolean
  modePricing?: {
    UNIMODAL?: ItemTypeModePricingLeaf
    MULTIMODAL?: ItemTypeModePricingLeaf
  }
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
    specialHandling: ItemType['specialHandling']
    requiresQuote: boolean
    modePricing: {
      UNIMODAL?: ItemTypeModePricingLeaf
      MULTIMODAL?: ItemTypeModePricingLeaf
    }
    isActive: boolean
  }>,
) {
  return api<{ data: ItemType }>(`/api/admin/item-types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function listCommissionSettings(params?: { page?: number; limit?: number }) {
  const q = new URLSearchParams()
  if (params?.page) q.set('page', String(params.page))
  if (params?.limit) q.set('limit', String(params.limit))
  const qs = q.toString()
  return api<{ data: CommissionSetting[]; pagination: PaginatedMeta }>(
    `/api/admin/commission-settings${qs ? `?${qs}` : ''}`,
  )
}

export function createCommissionSetting(body: {
  ratePct: number
  scopeType: CommissionScopeType
  scopeValue: string | null
  effectiveFrom: string
}) {
  return api<{ data: CommissionSetting }>('/api/admin/commission-settings', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getEffectiveCommission(params?: {
  mode?: string
  tier?: string
  importerTier?: string
  at?: string
}) {
  const q = new URLSearchParams()
  if (params?.mode) q.set('mode', params.mode)
  if (params?.tier) q.set('tier', params.tier)
  if (params?.importerTier) q.set('importerTier', params.importerTier)
  if (params?.at) q.set('at', params.at)
  const qs = q.toString()
  return api<{ data: EffectiveCommission }>(
    `/api/admin/commission-settings/effective${qs ? `?${qs}` : ''}`,
  )
}

export function getCommissionMatrix(params?: { at?: string }) {
  const q = new URLSearchParams()
  if (params?.at) q.set('at', params.at)
  const qs = q.toString()
  return api<{ data: CommissionMatrix }>(
    `/api/admin/commission-settings/matrix${qs ? `?${qs}` : ''}`,
  )
}

export function listPayments(params?: { page?: number; limit?: number; status?: string }) {
  const q = new URLSearchParams()
  if (params?.page) q.set('page', String(params.page))
  if (params?.limit) q.set('limit', String(params.limit))
  if (params?.status) q.set('status', params.status)
  const qs = q.toString()
  return api<{ data: import('../types').Payment[]; pagination: PaginatedMeta }>(
    `/api/admin/payments${qs ? `?${qs}` : ''}`,
  )
}

export function updatePaymentStatus(
  id: string,
  body: {
    status: string
    releaseMethod?: import('../types').PaymentReleaseMethod
    geofencePassed?: boolean
    travelTimePlausible?: boolean
  },
) {
  return api<{ data: import('../types').Payment }>(`/api/admin/payments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

// KAN-93: Admin manually records a payment against a shipment's payment record since no real
// gateway exists yet. Always updates the existing payment (one per shipment), never duplicates.
export function recordManualPayment(
  id: string,
  body: {
    provider: import('../types').PaymentProvider
    providerReference?: string
    providerConfirmed?: boolean
    providerTransactionId?: string
  },
) {
  return api<{ data: import('../types').Payment }>(`/api/admin/payments/${id}/provider`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function listPaymentDisputes(params?: { page?: number; limit?: number; status?: string }) {
  const q = new URLSearchParams()
  if (params?.page) q.set('page', String(params.page))
  if (params?.limit) q.set('limit', String(params.limit))
  if (params?.status) q.set('status', params.status)
  const qs = q.toString()
  return api<{ data: import('../types').PaymentDispute[]; pagination: PaginatedMeta }>(
    `/api/admin/payment-disputes${qs ? `?${qs}` : ''}`,
  )
}

export function raiseDispute(
  paymentId: string,
  body: { reasonCode: import('../types').DisputeReasonCode; reason: string },
) {
  return api<{ data: import('../types').PaymentDispute }>(
    `/api/admin/payments/${paymentId}/disputes`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
}

export function resolveDispute(
  disputeId: string,
  body: { resolution: import('../types').DisputeResolution; resolutionNotes?: string },
) {
  return api<{ data: import('../types').PaymentDispute }>(
    `/api/admin/payment-disputes/${disputeId}/resolve`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
}

export function listOrgTruckOwners(orgId: string, params?: { status?: ApprovalStatus }) {
  const q = new URLSearchParams()
  if (params?.status) q.set('status', params.status)
  const qs = q.toString()
  return api<{ data: AdminOrgFleetTree }>(
    `/api/admin/organizations/${orgId}/truck-owners${qs ? `?${qs}` : ''}`,
  )
}

export function listOrgTruckOwnerMembers(orgId: string, fleetManagerId: string) {
  return api<{ data: AdminOrgFleetMembers }>(
    `/api/admin/organizations/${orgId}/truck-owners/${fleetManagerId}/drivers`,
  )
}

export function listOrgShipments(
  orgId: string,
  params?: { page?: number; limit?: number; status?: ShipmentStatus },
) {
  const q = new URLSearchParams()
  if (params?.page) q.set('page', String(params.page))
  if (params?.limit) q.set('limit', String(params.limit))
  if (params?.status) q.set('status', params.status)
  const qs = q.toString()
  return api<{ data: Shipment[]; meta: PaginatedMeta }>(
    `/api/admin/organizations/${orgId}/shipments${qs ? `?${qs}` : ''}`,
  )
}

export function listOrgLoadPostings(
  orgId: string,
  params?: { page?: number; limit?: number; status?: LoadPostingStatus },
) {
  const q = new URLSearchParams()
  if (params?.page) q.set('page', String(params.page))
  if (params?.limit) q.set('limit', String(params.limit))
  if (params?.status) q.set('status', params.status)
  const qs = q.toString()
  return api<{ data: LoadPosting[]; meta: PaginatedMeta }>(
    `/api/admin/organizations/${orgId}/load-postings${qs ? `?${qs}` : ''}`,
  )
}

export function adminSearch(q: string, limit?: number) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (limit != null) params.set('limit', String(limit))
  const qs = params.toString()
  return api<{ data: AdminSearchResults }>(`/api/admin/search${qs ? `?${qs}` : ''}`)
}
