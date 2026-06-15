import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { ApprovalBanner } from '../ui/ApprovalBanner'

const navItems = [
  { to: '/fleet', label: 'Overview', end: true },
  { to: '/fleet/drivers', label: 'Drivers', end: false },
  { to: '/fleet/trucks', label: 'Trucks', end: false },
]

export function FleetLayout() {
  const { user, organization, logout, memberProfile } = useAuth()
  const navigate = useNavigate()
  const fleetName = memberProfile?.type === 'fleet' ? (memberProfile.profile as { fleetName?: string }).fleetName : null

  return (
    <div className="flex min-h-screen bg-korecha-bg">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-korecha-border bg-white shadow-sm">
        <div className="border-b border-korecha-border px-6 py-6">
          <h1 className="truncate text-base font-bold text-slate-900">{fleetName || 'Fleet Portal'}</h1>
          <p className="mt-1 truncate text-xs text-korecha-muted">{organization?.name}</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive ? 'bg-blue-50 text-korecha-primary' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-korecha-border p-4">
          <p className="truncate text-sm font-semibold text-slate-900">{user?.fullName}</p>
          <button type="button" onClick={() => { logout(); navigate('/login') }} className="mt-2 text-xs font-medium text-korecha-primary hover:underline">
            Sign out
          </button>
        </div>
      </aside>
      <main className="ml-64 flex-1 px-8 py-8">
        <ApprovalBanner />
        <Outlet />
      </main>
    </div>
  )
}
