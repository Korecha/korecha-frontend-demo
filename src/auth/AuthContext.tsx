import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getMe, login as apiLogin } from '../api/auth'
import { clearToken, getToken, setToken } from '../api/client'
import type { DriverProfile, FleetProfile, MemberProfileResponse, Organization, User } from '../types'

interface AuthContextValue {
  user: User | null
  organization: Organization | null
  memberProfile: MemberProfileResponse | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ user: User; organization: Organization | null }>
  logout: () => void
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [memberProfile, setMemberProfile] = useState<MemberProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const applySession = useCallback(
    (res: { user: User; organization?: Organization | null; memberProfile?: MemberProfileResponse | null }) => {
      setUser(res.user)
      setOrganization(res.organization ?? null)
      setMemberProfile(res.memberProfile ?? null)
    },
    []
  )

  const refreshSession = useCallback(async () => {
    const res = await getMe()
    applySession(res)
  }, [applySession])

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    getMe()
      .then(applySession)
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [applySession])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiLogin(email, password)
      setToken(res.token)
      applySession(res)
      return { user: res.user, organization: res.organization ?? null }
    },
    [applySession]
  )

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
    setOrganization(null)
    setMemberProfile(null)
  }, [])

  const value = useMemo(
    () => ({ user, organization, memberProfile, loading, login, logout, refreshSession }),
    [user, organization, memberProfile, loading, login, logout, refreshSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function getHomeRoute(role?: string) {
  if (role === 'ADMIN') return '/admin'
  if (role === 'ORG_ADMIN') return '/org'
  if (role === 'DRIVER') return '/driver'
  if (role === 'FLEET_OWNER') return '/fleet'
  if (role === 'IMPORTER') return '/importer'
  return '/login'
}

export function getApprovalStatus(memberProfile: MemberProfileResponse | null): string | null {
  return memberProfile?.profile?.status ?? null
}

export function isApproved(memberProfile: MemberProfileResponse | null): boolean {
  return memberProfile?.profile?.status === 'APPROVED'
}

export function getDriverProfile(memberProfile: MemberProfileResponse | null): DriverProfile | null {
  if (memberProfile?.type === 'driver') return memberProfile.profile as DriverProfile
  return null
}

export function getFleetProfile(memberProfile: MemberProfileResponse | null): FleetProfile | null {
  if (memberProfile?.type === 'fleet') return memberProfile.profile as FleetProfile
  return null
}
