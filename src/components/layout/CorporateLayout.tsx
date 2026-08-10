import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { ApprovalBanner } from '../ui/ApprovalBanner'

export function CorporateLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-korecha-bg">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-white px-6 py-4 shadow-sm">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-korecha-muted">Korecha Corporate</p>
          <h1 className="text-lg font-bold text-slate-900">{user?.fullName}</h1>
        </div>
        <button
          type="button"
          onClick={() => { logout(); navigate('/login') }}
          className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold hover:bg-slate-200"
        >
          Sign out
        </button>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-6">
        <ApprovalBanner />
        <Outlet />
      </main>
    </div>
  )
}
