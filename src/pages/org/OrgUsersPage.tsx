import { useEffect, useState, type FormEvent } from 'react'
import { createOrgUser, listOrgLocations, listOrgUsers, listTruckTypes } from '../../api/org'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Input'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import type { Location, OrgMemberRole, TruckType, User } from '../../types'

const MEMBER_ROLES: { value: OrgMemberRole; label: string }[] = [
  { value: 'DRIVER', label: 'Driver' },
  { value: 'FLEET_OWNER', label: 'Fleet Owner' },
  { value: 'IMPORTER', label: 'Importer' },
]

const emptyForm = {
  fullName: '',
  fleetName: '',
  companyName: '',
  email: '',
  password: '',
  phone: '',
  role: 'DRIVER' as OrgMemberRole,
  truckTypeId: '',
  fleetOwnerId: '',
  preferredRouteIds: [] as string[],
}

export function OrgUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [truckTypes, setTruckTypes] = useState<TruckType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [nationalId, setNationalId] = useState<File | null>(null)
  const [driversLicense, setDriversLicense] = useState<File | null>(null)
  const [ceoNationalId, setCeoNationalId] = useState<File | null>(null)
  const [importLicense, setImportLicense] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    listOrgUsers()
      .then((res) => setUsers(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    listOrgLocations().then((r) => setLocations(r.data)).catch(() => {})
    listTruckTypes().then((r) => setTruckTypes(r.data.filter((t) => t.isActive))).catch(() => {})
  }, [])

  const fleetOwners = users.filter(
    (u) => u.role === 'FLEET_OWNER' && u.memberProfile?.status === 'APPROVED'
  )

  const resetForm = () => {
    setForm(emptyForm)
    setNationalId(null)
    setDriversLicense(null)
    setCeoNationalId(null)
    setImportLicense(null)
  }

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
    setSubmitting(true)
    setError('')

    if (form.role === 'DRIVER') {
      if (!nationalId || !driversLicense) {
        setError('National ID and driver\'s license documents are required')
        setSubmitting(false)
        return
      }
    } else if (form.role === 'FLEET_OWNER') {
      if (!ceoNationalId) {
        setError('CEO national ID document is required')
        setSubmitting(false)
        return
      }
    } else if (!nationalId || !importLicense) {
      setError('National ID and import license documents are required')
      setSubmitting(false)
      return
    }

    try {
      const fd = new FormData()
      fd.append('fullName', form.fullName)
      fd.append('email', form.email)
      fd.append('password', form.password)
      fd.append('phone', form.phone)
      fd.append('role', form.role)

      if (form.role === 'DRIVER') {
        fd.append('preferredRouteIds', JSON.stringify(form.preferredRouteIds))
        if (form.truckTypeId) fd.append('truckTypeId', form.truckTypeId)
        if (form.fleetOwnerId) fd.append('fleetOwnerId', form.fleetOwnerId)
        fd.append('nationalId', nationalId!)
        fd.append('driversLicense', driversLicense!)
      } else if (form.role === 'FLEET_OWNER') {
        fd.append('fleetName', form.fleetName)
        fd.append('ceoNationalId', ceoNationalId!)
      } else {
        if (form.companyName) fd.append('companyName', form.companyName)
        fd.append('nationalId', nationalId!)
        fd.append('importLicense', importLicense!)
      }

      await createOrgUser(fd)
      setShowForm(false)
      resetForm()
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  const teamMembers = users.filter((u) => u.role !== 'ORG_ADMIN')

  return (
    <div>
      <PageHeader
        title="Team Members"
        description="Create driver, fleet owner, or importer accounts with documents"
        action={<Button onClick={() => { resetForm(); setShowForm(true) }}>+ Add Member</Button>}
      />

      {error && !showForm && <div className="mb-4"><Alert>{error}</Alert></div>}

      <TableWrapper>
        <Table>
          <TableHead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Phone</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={5} message="Loading..." />
            ) : teamMembers.length === 0 ? (
              <TableEmpty colSpan={5} message="No team members yet. Add your first driver, fleet owner, or importer." />
            ) : (
              teamMembers.map((u) => (
                <TableRow key={u.id}>
                  <Td className="font-semibold text-slate-900">
                    {u.role === 'FLEET_OWNER' && u.memberProfile && 'fleetName' in u.memberProfile
                      ? (u.memberProfile as { fleetName?: string }).fleetName || u.fullName
                      : u.role === 'IMPORTER' && u.memberProfile && 'companyName' in u.memberProfile
                        ? (u.memberProfile as { companyName?: string }).companyName || u.fullName
                        : u.fullName}
                  </Td>
                  <Td>{u.email}</Td>
                  <Td><Badge status={u.role} /></Td>
                  <Td>
                    {u.memberProfile?.status ? <Badge status={u.memberProfile.status} /> : '—'}
                  </Td>
                  <Td>{u.phone || '—'}</Td>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </TableWrapper>

      {showForm && (
        <Modal title="Add Team Member" onClose={() => setShowForm(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert>{error}</Alert>}

            <Field label="Role">
              <Select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as OrgMemberRole })}
              >
                {MEMBER_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
            </Field>

            {form.role === 'FLEET_OWNER' ? (
              <>
                <Field label="Fleet / Company Name">
                  <Input
                    value={form.fleetName}
                    onChange={(e) => setForm({ ...form, fleetName: e.target.value })}
                    required
                  />
                </Field>
                <Field label="CEO / Contact Name">
                  <Input
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    required
                  />
                </Field>
              </>
            ) : form.role === 'IMPORTER' ? (
              <>
                <Field label="Company Name (optional)">
                  <Input
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  />
                </Field>
                <Field label="Contact Name">
                  <Input
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    required
                  />
                </Field>
              </>
            ) : (
              <Field label="Full Name">
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                />
              </Field>
            )}

            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
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

            {form.role === 'DRIVER' ? (
              <>
                <Field label="National ID (image or PDF)">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setNationalId(e.target.files?.[0] || null)}
                    required
                  />
                </Field>
                <Field label="Driver's License (image or PDF)">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setDriversLicense(e.target.files?.[0] || null)}
                    required
                  />
                </Field>
                <Field label="Truck Type">
                  <Select
                    value={form.truckTypeId}
                    onChange={(e) => setForm({ ...form, truckTypeId: e.target.value })}
                  >
                    <option value="">Select truck type</option>
                    {truckTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Assign to Fleet (optional)">
                  <Select
                    value={form.fleetOwnerId}
                    onChange={(e) => setForm({ ...form, fleetOwnerId: e.target.value })}
                  >
                    <option value="">Independent driver</option>
                    {fleetOwners.map((f) => (
                      <option key={f.id} value={f.id}>
                        {(f.memberProfile as { fleetName?: string })?.fleetName || f.fullName}
                      </option>
                    ))}
                  </Select>
                </Field>
                {locations.length > 0 && (
                  <Field label="Preferred Routes">
                    <div className="max-h-36 space-y-2 overflow-y-auto rounded-xl border border-korecha-border p-3">
                      {locations.map((l) => (
                        <label key={l.id} className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={form.preferredRouteIds.includes(l.id)}
                            onChange={() => toggleRoute(l.id)}
                          />
                          {l.name} ({l.region})
                        </label>
                      ))}
                    </div>
                  </Field>
                )}
              </>
            ) : form.role === 'FLEET_OWNER' ? (
              <Field label="CEO National ID (image or PDF)">
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setCeoNationalId(e.target.files?.[0] || null)}
                  required
                />
              </Field>
            ) : (
              <>
                <Field label="National ID (image or PDF)">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setNationalId(e.target.files?.[0] || null)}
                    required
                  />
                </Field>
                <Field label="Import License (image or PDF)">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setImportLicense(e.target.files?.[0] || null)}
                    required
                  />
                </Field>
              </>
            )}

            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Account'}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  )
}
