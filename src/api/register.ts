import { api, setToken } from './client'
import type { DriverProfile, FleetProfile, ImporterProfile, Organization, User } from '../types'

interface RegisterResponse {
  token: string
  user: User
  organization: Organization
  profile: DriverProfile | FleetProfile | ImporterProfile
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
