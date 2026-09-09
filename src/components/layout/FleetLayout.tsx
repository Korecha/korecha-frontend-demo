import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { ApprovalBanner } from '../ui/ApprovalBanner'

const baseNavItems = [
  { to: '/fleet', label: 'Overview', end: true },
  { to: '/fleet/match-offers', label: 'Match offers', end: false },
  { to: '/fleet/shipments', label: 'Shipments', end: false },
  { to: '/fleet/availability', label: 'Availability', end: false },
  { to: '/fleet/drivers', label: 'Drivers', end: false },
  { to: '/fleet/trucks', label: 'Trucks', end: false },
]

export function FleetLayout() {
  const { user, organization, logout, memberProfile } = useAuth()
  const navigate = useNavigate()
  const fleetProfile =
    memberProfile?.type === 'fleet'
      ? (memberProfile.profile as { fleetName?: string; shippingLineId?: string | null })
      : null
  const fleetName = fleetProfile?.fleetName ?? null
  const navItems = fleetProfile?.shippingLineId
    ? [...baseNavItems, { to: '/fleet/containers', label: 'Containers', end: false }]
    : baseNavItems

  return (
    <div className="flex min-h-screen bg-korecha-bg">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-korecha-border bg-white shadow-sm">
        <div className="border-b border-korecha-border px-6 py-6">
          <h1 className="truncate text-base font-bold text-slate-900">
            {fleetName || 'Fleet Portal'}
          </h1>
          <p className="mt-1 truncate text-xs text-korecha-muted">{organization?.name}</p>
        </div>
        <div className="relative min-h-0 flex-1">
          <nav className="h-full space-y-1 overflow-y-auto px-3 py-5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `block rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-korecha-primary'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
        </div>
        <div className="border-t border-korecha-border p-4">
          <p className="truncate text-sm font-semibold text-slate-900">{user?.fullName}</p>
        </div>
      </aside>
      <main className="ml-64 flex-1">
        <div className="sticky top-0 z-20 flex justify-end border-b border-korecha-border bg-white/90 px-8 py-3 backdrop-blur">
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-korecha-primary transition hover:bg-blue-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign out
          </button>
        </div>
        <div className="px-8 py-8">
          <ApprovalBanner />
          <Outlet />
        </div>
      </main>
    </div>
  )
}
