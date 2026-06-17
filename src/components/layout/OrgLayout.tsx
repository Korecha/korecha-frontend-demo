import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { TYPE_LABELS } from '../../utils/format'

const navItems = [
  { to: '/org', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', end: true },
  { to: '/org/applications', label: 'Applications', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { to: '/org/users', label: 'Drivers & Fleet', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { to: '/org/truck-types', label: 'Truck Types', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { to: '/org/item-types', label: 'Item Types', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { to: '/org/gate-entrances', label: 'Gate Fees', icon: 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z' },
  { to: '/org/pricing', label: 'Pricing', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
]

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

export function OrgLayout() {
  const { user, organization, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-korecha-bg">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-korecha-border bg-white shadow-sm">
        <div className="border-b border-korecha-border px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-korecha-primary text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-slate-900">{organization?.name || 'Korecha'}</h1>
              <p className="text-xs text-korecha-muted">
                {organization?.type ? TYPE_LABELS[organization.type] : 'Organization Portal'}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-korecha-primary'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <NavIcon d={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-korecha-border p-4">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="truncate text-sm font-semibold text-slate-900">{user?.fullName}</p>
            <p className="truncate text-xs text-korecha-muted">{user?.email}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 text-xs font-medium text-korecha-primary hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="ml-64 flex-1">
        <div className="min-h-screen px-8 py-8 lg:px-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
