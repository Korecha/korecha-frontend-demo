import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { ApprovalBanner } from '../ui/ApprovalBanner'
import { ImporterBottomNav } from '../importer/ImporterBottomNav'

const desktopNav = [
  { to: '/importer', label: 'Dashboard', end: true },
  { to: '/importer/jobs', label: 'My Jobs', end: false },
  { to: '/importer/jobs/new', label: 'Post Job', end: false },
  { to: '/importer/profile', label: 'Profile', end: false },
]

export function ImporterLayout() {
  const { user, organization, logout, memberProfile } = useAuth()
  const navigate = useNavigate()
  const company =
    memberProfile?.type === 'importer'
      ? (memberProfile.profile as { companyName?: string }).companyName
      : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-korecha-bg to-blue-50/40">
      <header className="sticky top-0 z-30 bg-gradient-to-r from-korecha-navy via-korecha-navy-light to-blue-700 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] text-white shadow-lg shadow-blue-900/20 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-200/80">Korecha Importer</p>
            <h1 className="truncate text-lg font-bold">{company || user?.fullName}</h1>
            <p className="truncate text-xs text-blue-100/70">
              {organization?.name || 'Independent importer'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { logout(); navigate('/login') }}
            className="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur hover:bg-white/20"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-4 md:px-8 md:py-6">
        <aside className="hidden w-52 shrink-0 md:block">
          <nav className="sticky top-28 space-y-1 rounded-2xl border border-korecha-border bg-white p-2 shadow-sm">
            {desktopNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                    isActive ? 'bg-blue-50 text-korecha-primary' : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 pb-24 md:pb-8">
          <ApprovalBanner />
          <Outlet />
        </main>
      </div>
      <ImporterBottomNav />
    </div>
  )
}
