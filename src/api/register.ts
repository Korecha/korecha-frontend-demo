import { api, setToken } from './client'
import type {
  CorporateCustomerProfile,
  DriverProfile,
  FleetProfile,
  ImporterProfile,
  Organization,
  TruckOwnerProfile,
  TruckOwnerType,
  User,
} from '../types'

interface RegisterResponse<TProfile = DriverProfile | FleetProfile | ImporterProfile> {
  token: string
  user: User
  organization: Organization | null
  profile: TProfile
}

export async function registerDriver(form: FormData) {
  const res = await api<RegisterResponse>('/api/auth/register/driver', {
    method: 'POST',
    body: form,
  })
  setToken(res.token)
  return res
}

export async function registerImporter(form: FormData) {
  const res = await api<RegisterResponse>('/api/auth/register/importer', {
    method: 'POST',
    body: form,
  })
  setToken(res.token)
  return res
}

export async function registerFleet(form: FormData) {
  const res = await api<RegisterResponse>('/api/auth/register/fleet', {
    method: 'POST',
    body: form,
  })
  setToken(res.token)
  return res
}

export async function registerTruckOwner(body: {
  ownerType: TruckOwnerType
  displayName: string
  fullName: string
  email: string
  password: string
  phone: string
  organizationId?: string
  fleetManagerId?: string
}) {
  const res = await api<RegisterResponse<TruckOwnerProfile>>('/api/auth/register/truck-owner', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  setToken(res.token)
  return res
}

export async function registerCorporateCustomer(form: FormData) {
  const res = await api<RegisterResponse<CorporateCustomerProfile>>(
    '/api/auth/register/corporate-customer',
    {
      method: 'POST',
      body: form,
    }
  )
  setToken(res.token)
  return res
}
