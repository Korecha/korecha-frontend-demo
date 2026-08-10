import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiRequestError } from '../../api/client'
import { listPublicFleetOwners, listPublicOrganizations } from '../../api/public'
import { registerTruckOwner } from '../../api/register'
import { getHomeRoute, useAuth } from '../../auth/AuthContext'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import type { FleetManagerOption } from '../../api/public'
import type { Organization } from '../../types'

// Genuinely separate role/table from fleet managers (product decision #1): registers the
// truck-owning individual/company itself, optionally affiliated with a fleet manager's network.
export function RegisterTruckOwnerPage() {
  const navigate = useNavigate()
  const { refreshSession } = useAuth()
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [fleetManagers, setFleetManagers] = useState<FleetManagerOption[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    organizationId: '',
    fleetManagerId: '',
    ownerName: '',
    fullName: '',
    email: '',
    password: '',
    phone: '',
  })
  const [nationalId, setNationalId] = useState<File | null>(null)

  useEffect(() => {
    listPublicOrganizations().then((r) => setOrgs(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!form.organizationId) { setFleetManagers([]); return }
    listPublicFleetOwners(form.organizationId).then((r) => setFleetManagers(r.data)).catch(() => {})
  }, [form.organizationId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!nationalId) {
      setError('National ID document is required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('ownerName', form.ownerName)
      fd.append('fullName', form.fullName)
      fd.append('email', form.email)
      fd.append('password', form.password)
      fd.append('phone', form.phone)
      if (form.organizationId) fd.append('organizationId', form.organizationId)
      if (form.fleetManagerId) fd.append('fleetManagerId', form.fleetManagerId)
      fd.append('nationalId', nationalId)
      const res = await registerTruckOwner(fd)
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
        <PageHeader
          title="Truck Owner Registration"
          description="Register your trucks. A platform admin will review before you can post availability directly (Unimodal only) — otherwise your fleet manager posts on your behalf."
        />
        <div className="mt-6 rounded-2xl border border-korecha-border bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <Alert>{error}</Alert>}
            <Field label="Owner / Company Name">
              <Input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} required />
            </Field>
            <Field label="Your Full Name">
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </Field>
            <Field label="Organization (optional)">
              <Select value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })}>
                <option value="">Independent</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </Select>
            </Field>
            {fleetManagers.length > 0 && (
              <Field label="Affiliate with Fleet Manager (optional)">
                <Select value={form.fleetManagerId} onChange={(e) => setForm({ ...form, fleetManagerId: e.target.value })}>
                  <option value="">None</option>
                  {fleetManagers.map((f) => <option key={f.id} value={f.id}>{f.fleetName}</option>)}
                </Select>
              </Field>
            )}
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></Field>
            <Field label="Password"><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={6} required /></Field>
            <Field label="National ID (image or PDF)">
              <Input type="file" accept="image/*,.pdf" onChange={(e) => setNationalId(e.target.files?.[0] || null)} required />
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
