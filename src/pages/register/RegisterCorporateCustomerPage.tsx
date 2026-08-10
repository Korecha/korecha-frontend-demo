import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiRequestError } from '../../api/client'
import { registerCorporateCustomer } from '../../api/register'
import { getHomeRoute, useAuth } from '../../auth/AuthContext'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'

// Genuinely separate onboarding/approval path from importer/exporter registration (product
// decision #3) — premium tier: large companies, state enterprises, major project contractors.
export function RegisterCorporateCustomerPage() {
  const navigate = useNavigate()
  const { refreshSession } = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    companyName: '',
    fullName: '',
    email: '',
    password: '',
    phone: '',
  })
  const [businessRegistration, setBusinessRegistration] = useState<File | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!businessRegistration) {
      setError('Business registration document is required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('businessRegistration', businessRegistration)
      const res = await registerCorporateCustomer(fd)
      await refreshSession()
      navigate(getHomeRoute(res.user.role))
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="Corporate Customer Registration"
          description="For large companies, state enterprises, and major project contractors — priority matching and dedicated review."
        />
        <div className="mt-6 rounded-2xl border bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <Alert>{error}</Alert>}
            <Field label="Company Name">
              <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
            </Field>
            <Field label="Your Full Name">
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </Field>
            <Field label="Password">
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={6} required />
            </Field>
            <Field label="Business Registration (image or PDF)">
              <Input type="file" accept="image/*,.pdf" onChange={(e) => setBusinessRegistration(e.target.files?.[0] || null)} required />
            </Field>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Submitting...' : 'Submit application'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            <Link to="/login" className="font-medium text-purple-600">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
