import { api } from './client'
import type {
  AvailabilityPosting,
  GateEntrance,
  ItemType,
  JobPricingQuote,
  LoadMatchOffer,
  LoadPosting,
  Location,
  ShipmentLeg,
} from '../types'
import type { CreateLoadPostingBody } from './importer'

export function listCorporateLocations() {
  return api<{ data: Location[] }>('/api/corporate/locations')
}

export function listCorporateItemTypes() {
  return api<{ data: ItemType[] }>('/api/corporate/item-types')
}

export function listCorporateGateEntrances() {
  return api<{ data: GateEntrance[] }>('/api/corporate/gate-entrances')
}

export function previewCorporateLoadPricing(body: {
  itemTypeId?: string
  quantity: number
  pickup: { locationId: string }
  delivery: { locationId: string }
  pickupGateId: string
  deliveryGateId: string
}) {
  return api<{ data: JobPricingQuote }>('/api/corporate/jobs/preview-pricing', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function createCorporateLoadPosting(body: CreateLoadPostingBody) {
  return api<{ data: { loadPosting: LoadPosting; offers: LoadMatchOffer[] } }>(
    '/api/corporate/load-postings',
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  )
}

export function listCorporateLoadPostings() {
  return api<{ data: LoadPosting[] }>('/api/corporate/load-postings')
}

export function getCorporateLoadPosting(id: string) {
  return api<{
    data: {
      loadPosting: LoadPosting
      offers?: LoadMatchOffer[]
      offersSummary?: { total: number }
      legs?: ShipmentLeg[]
    }
  }>(`/api/corporate/load-postings/${id}`)
}

export type NearbyAvailabilityPosting = AvailabilityPosting & { distanceKm: number }

export function listCorporateNearbyAvailabilityPostings(params: {
  lat: number
  lng: number
  radiusKm?: number
}) {
  const qs = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    ...(params.radiusKm ? { radiusKm: String(params.radiusKm) } : {}),
  })
  return api<{ data: NearbyAvailabilityPosting[] }>(`/api/corporate/availability-postings/nearby?${qs}`)
}
