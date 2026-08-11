import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiRequestError } from '../../api/client'
import { listPublicFleetManagers, listPublicOrganizations, type FleetManagerOption } from '../../api/public'
import { registerTruckOwner } from '../../api/register'
import { getHomeRoute, useAuth } from '../../auth/AuthContext'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { TRUCK_OWNER_TYPE_LABELS } from '../../utils/format'
import type { Organization, TruckOwnerType } from '../../types'

export function RegisterTruckOwnerPage() {
  const navigate = useNavigate()
  const { refreshSession } = useAuth()
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [fleetManagers, setFleetManagers] = useState<FleetManagerOption[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    ownerType: 'INDIVIDUAL' as TruckOwnerType,
    displayName: '',
    fullName: '',
    email: '',
    password: '',
    phone: '',
    organizationId: '',
    fleetManagerId: '',
  })

  useEffect(() => {
    listPublicOrganizations()
      .then((r) => setOrgs(r.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const orgId = form.organizationId
    if (!orgId) return
    let active = true
    listPublicFleetManagers(orgId)
      .then((r) => {
        if (active) setFleetManagers(r.data)
      })
      .catch(() => {
        if (active) setFleetManagers([])
      })
    return () => {
      active = false
    }
  }, [form.organizationId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await registerTruckOwner({
        ownerType: form.ownerType,
        displayName: form.displayName,
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        organizationId: form.organizationId || undefined,
        fleetManagerId: form.fleetManagerId || undefined,
      })
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
          description="Register as an individual owner or a company. A platform admin reviews your application before you can operate."
        />
        <div className="mt-6 rounded-2xl border border-korecha-border bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <Alert>{error}</Alert>}
            <Field label="I am registering as">
              <Select
                value={form.ownerType}
                onChange={(e) => setForm({ ...form, ownerType: e.target.value as TruckOwnerType })}
              >
                {(Object.keys(TRUCK_OWNER_TYPE_LABELS) as TruckOwnerType[]).map((value) => (
                  <option key={value} value={value}>
                    {TRUCK_OWNER_TYPE_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={form.ownerType === 'COMPANY' ? 'Company name' : 'Display name'}>
              <Input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder={form.ownerType === 'COMPANY' ? 'Registered company name' : 'Name shown to dispatchers'}
                required
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
            <Field label="Organization (optional)">
              <Select
                value={form.organizationId}
                onChange={(e) => setForm({ ...form, organizationId: e.target.value, fleetManagerId: '' })}
              >
                <option value="">Operate independently</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </Select>
            </Field>
            {form.organizationId && (
              <Field label="Fleet manager affiliation (optional)">
                <Select
                  value={form.fleetManagerId}
                  onChange={(e) => setForm({ ...form, fleetManagerId: e.target.value })}
                >
                  <option value="">No affiliation</option>
                  {fleetManagers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fleetName}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
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
