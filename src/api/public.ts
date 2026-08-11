import { api } from './client'
import type { FleetProviderType, Location, Organization, TruckType } from '../types'

export interface FleetOwnerOption {
  id: string
  fullName: string
  email: string
  phone?: string
  fleetName: string
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
  return api<{ data: FleetOwnerOption[] }>(`/api/public/organizations/${orgId}/fleet-owners`)
}

export interface FleetManagerOption {
  id: string
  fleetName: string
  providerType?: FleetProviderType
}

export function listPublicFleetManagers(orgId: string) {
  return api<{ data: FleetManagerOption[] }>(`/api/public/organizations/${orgId}/fleet-managers`)
}
