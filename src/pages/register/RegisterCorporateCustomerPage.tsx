import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiRequestError } from '../../api/client'
import { registerCorporateCustomer } from '../../api/register'
import { getHomeRoute, useAuth } from '../../auth/AuthContext'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'

export function RegisterCorporateCustomerPage() {
  const navigate = useNavigate()
  const { refreshSession } = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    companyName: '',
    tinNumber: '',
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
      Object.entries(form).forEach(([k, v]) => {
        if (v) fd.append(k, v)
      })
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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="Corporate Customer Registration"
          description="Premium account for high-volume shippers. A platform admin verifies your business registration and assigns your matching tier."
        />
        <div className="mt-6 rounded-2xl border border-korecha-border bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <Alert>{error}</Alert>}
            <Field label="Company name">
              <Input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
              />
            </Field>
            <Field label="TIN number">
              <Input
                value={form.tinNumber}
                onChange={(e) => setForm({ ...form, tinNumber: e.target.value })}
                placeholder="Optional"
              />
            </Field>
            <Field label="Contact person">
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={6}
                required
              />
            </Field>
            <Field label="Business registration (image or PDF)">
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setBusinessRegistration(e.target.files?.[0] || null)}
                required
              />
            </Field>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Submitting...' : 'Submit application'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-korecha-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-korecha-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
