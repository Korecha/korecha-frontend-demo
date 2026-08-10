import { api } from './client'
import type { Location, Organization, ProviderType, TruckType } from '../types'

// A FleetManager is now 1:1 with an Organization, so this returns at most one entry.
export interface FleetManagerOption {
  id: string
  fleetName: string
  providerType: ProviderType
}

export interface TruckOwnerOption {
  id: string
  ownerName: string
}

export function listPublicOrganizations() {
  return api<{ data: Organization[] }>('/api/public/organizations')
}

export function listPublicLocations(orgId: string) {
  return api<{ data: Location[] }>(`/api/public/organizations/${orgId}/locations`)
}

export function listPublicTruckTypes(orgId: string) {
  return api<{ data: TruckType[] }>(`/api/public/organizations/${orgId}/truck-types`)
}

export function listPublicFleetOwners(orgId: string) {
  return api<{ data: FleetManagerOption[] }>(`/api/public/organizations/${orgId}/fleet-owners`)
}

export function listPublicTruckOwners(orgId: string) {
  return api<{ data: TruckOwnerOption[] }>(`/api/public/organizations/${orgId}/truck-owners`)
}
