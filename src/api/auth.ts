import { api } from './client'
import type { MemberProfileResponse, Organization, User } from '../types'

interface AuthResponse {
  token: string
  user: User
  organization?: Organization | null
  memberProfile?: MemberProfileResponse | null
}

interface MeResponse {
  user: User
  organization?: Organization | null
  memberProfile?: MemberProfileResponse | null
}

export function login(email: string, password: string) {
  return api<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function getMe() {
  return api<MeResponse>('/api/auth/me')
}
