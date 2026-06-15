import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiRequestError } from '../../api/client'
import { listPublicOrganizations } from '../../api/public'
import { registerFleet } from '../../api/register'
import { getHomeRoute, useAuth } from '../../auth/AuthContext'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import type { Organization } from '../../types'

export function RegisterFleetPage() {
  const navigate = useNavigate()
  const { refreshSession } = useAuth()
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    organizationId: '',
    fleetName: '',
    fullName: '',
    email: '',
    password: '',
    phone: '',
  })
  const [ceoNationalId, setCeoNationalId] = useState<File | null>(null)

  useEffect(() => {
    listPublicOrganizations().then((r) => setOrgs(r.data)).catch(() => {})
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!ceoNationalId) {
      setError('CEO national ID document is required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('ceoNationalId', ceoNationalId)
      const res = await registerFleet(fd)
      await refreshSession()
      navigate(getHomeRoute(res.user.role))
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-korecha-bg px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Fleet Owner Registration" description="Register your fleet and manage drivers and trucks" />
        <div className="mt-6 rounded-2xl border border-korecha-border bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <Alert>{error}</Alert>}
            <Field label="Organization">
              <Select value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })} required>
                <option value="">Select organization</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </Select>
            </Field>
            <Field label="Fleet / Company Name"><Input value={form.fleetName} onChange={(e) => setForm({ ...form, fleetName: e.target.value })} required /></Field>
            <Field label="CEO / Contact Name"><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></Field>
            <Field label="Password"><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={6} required /></Field>
            <Field label="CEO National ID (image or PDF)">
              <Input type="file" accept="image/*,.pdf" onChange={(e) => setCeoNationalId(e.target.files?.[0] || null)} required />
            </Field>
            <Button type="submit" disabled={submitting} className="w-full">{submitting ? 'Submitting...' : 'Submit Application'}</Button>
          </form>
          <p className="mt-4 text-center text-sm text-korecha-muted">
            Already have an account? <Link to="/login" className="font-medium text-korecha-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
