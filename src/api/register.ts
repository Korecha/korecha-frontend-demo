import { api, setToken } from './client'
import type {
  CorporateCustomerProfile,
  DriverProfile,
  FleetProfile,
  ImporterProfile,
  Organization,
  TruckOwnerProfile,
  User,
} from '../types'

interface RegisterResponse {
  token: string
  user: User
  organization: Organization | null
  profile: DriverProfile | FleetProfile | ImporterProfile | TruckOwnerProfile | CorporateCustomerProfile
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

export async function registerTruckOwner(form: FormData) {
  const res = await api<RegisterResponse>('/api/auth/register/truck-owner', {
    method: 'POST',
    body: form,
  })
  setToken(res.token)
  return res
}

export async function registerCorporateCustomer(form: FormData) {
  const res = await api<RegisterResponse>('/api/auth/register/corporate-customer', {
    method: 'POST',
    body: form,
  })
  setToken(res.token)
  return res
}
