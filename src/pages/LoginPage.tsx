import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ApiRequestError } from '../api/client'
import { getHomeRoute, useAuth } from '../auth/AuthContext'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'

export function LoginPage() {
  const { user, login, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@korecha.et')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to={getHomeRoute(user.role)} replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { user: loggedIn } = await login(email, password)
      navigate(getHomeRoute(loggedIn.role))
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-korecha-navy via-korecha-navy-light to-blue-600 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-blue-400/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">Korecha</span>
          </div>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight text-white">
            Carrying Ethiopia
            <br />
            <span className="text-blue-200">Forward</span>
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-blue-100/80">
            Digital logistics platform connecting importers, exporters, truck owners, and shipping
            lines across the Djibouti–Addis corridor.
          </p>
          <div className="mt-8 flex gap-6">
            {['Live Tracking', 'ETB Pricing', 'Container Matching'].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-blue-100/70">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-300" />
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-blue-200/50">© 2026 Korecha Digital Logistics</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center bg-korecha-bg px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-korecha-primary text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900">Korecha</span>
            </div>
          </div>

          <div className="rounded-2xl border border-korecha-border bg-white p-8 shadow-xl shadow-blue-900/5">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
              <p className="mt-1.5 text-sm text-korecha-muted">Sign in to your organization or admin account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <Alert>{error}</Alert>}
              <Field label="Email address">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@korecha.et"
                  required
                />
              </Field>
              <Field label="Password">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </Field>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
            <div className="mt-6 border-t border-korecha-border pt-6">
              <p className="text-center text-sm text-korecha-muted">New to Korecha?</p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Link to="/register/driver" className="rounded-xl border border-korecha-border py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">Driver</Link>
                <Link to="/register/fleet" className="rounded-xl border border-korecha-border py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">Fleet</Link>
                <Link to="/register/importer" className="rounded-xl border border-emerald-200 py-2.5 text-center text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Importer</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
