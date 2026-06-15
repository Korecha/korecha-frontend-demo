import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiRequestError } from '../../api/client'
import { listPublicFleetOwners, listPublicLocations, listPublicOrganizations, listPublicTruckTypes } from '../../api/public'
import { registerDriver } from '../../api/register'
import { getHomeRoute, useAuth } from '../../auth/AuthContext'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import type { FleetOwnerOption } from '../../api/public'
import type { Location, Organization, TruckType } from '../../types'

export function RegisterDriverPage() {
  const navigate = useNavigate()
  const { refreshSession } = useAuth()
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [truckTypes, setTruckTypes] = useState<TruckType[]>([])
  const [fleets, setFleets] = useState<FleetOwnerOption[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    organizationId: '',
    fullName: '',
    email: '',
    password: '',
    phone: '',
    truckTypeId: '',
    fleetOwnerId: '',
    preferredRouteIds: [] as string[],
  })
  const [nationalId, setNationalId] = useState<File | null>(null)
  const [driversLicense, setDriversLicense] = useState<File | null>(null)

  useEffect(() => {
    listPublicOrganizations().then((r) => setOrgs(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!form.organizationId) return
    Promise.all([
      listPublicLocations(form.organizationId),
      listPublicTruckTypes(form.organizationId),
      listPublicFleetOwners(form.organizationId),
    ])
      .then(([locRes, typeRes, fleetRes]) => {
        setLocations(locRes.data)
        setTruckTypes(typeRes.data)
        setFleets(fleetRes.data)
      })
      .catch(() => {})
  }, [form.organizationId])

  const toggleRoute = (id: string) => {
    setForm((f) => ({
      ...f,
      preferredRouteIds: f.preferredRouteIds.includes(id)
        ? f.preferredRouteIds.filter((r) => r !== id)
        : [...f.preferredRouteIds, id],
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!nationalId || !driversLicense) {
      setError('National ID and driver\'s license documents are required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('organizationId', form.organizationId)
      fd.append('fullName', form.fullName)
      fd.append('email', form.email)
      fd.append('password', form.password)
      fd.append('phone', form.phone)
      fd.append('preferredRouteIds', JSON.stringify(form.preferredRouteIds))
      if (form.truckTypeId) fd.append('truckTypeId', form.truckTypeId)
      if (form.fleetOwnerId) fd.append('fleetOwnerId', form.fleetOwnerId)
      fd.append('nationalId', nationalId)
      fd.append('driversLicense', driversLicense)
      const res = await registerDriver(fd)
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
        <PageHeader title="Driver Registration" description="Join an organization as an independent driver or under a fleet" />
        <div className="mt-6 rounded-2xl border border-korecha-border bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <Alert>{error}</Alert>}
            <Field label="Organization">
              <Select value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })} required>
                <option value="">Select organization</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </Select>
            </Field>
            <Field label="Full Name"><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></Field>
            <Field label="Password"><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={6} required /></Field>
            <Field label="National ID (image or PDF)">
              <Input type="file" accept="image/*,.pdf" onChange={(e) => setNationalId(e.target.files?.[0] || null)} required />
            </Field>
            <Field label="Driver's License (image or PDF)">
              <Input type="file" accept="image/*,.pdf" onChange={(e) => setDriversLicense(e.target.files?.[0] || null)} required />
            </Field>
            <Field label="Preferred Truck Type">
              <Select value={form.truckTypeId} onChange={(e) => setForm({ ...form, truckTypeId: e.target.value })}>
                <option value="">Select truck type</option>
                {truckTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </Field>
            <Field label="Join a Fleet (optional)">
              <Select value={form.fleetOwnerId} onChange={(e) => setForm({ ...form, fleetOwnerId: e.target.value })}>
                <option value="">Independent driver</option>
                {fleets.map((f) => <option key={f.id} value={f.id}>{f.fleetName} — {f.fullName}</option>)}
              </Select>
            </Field>
            {locations.length > 0 && (
              <Field label="Preferred Routes">
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-korecha-border p-3">
                  {locations.map((l) => (
                    <label key={l.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={form.preferredRouteIds.includes(l.id)} onChange={() => toggleRoute(l.id)} />
                      {l.name} ({l.region})
                    </label>
                  ))}
                </div>
              </Field>
            )}
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
