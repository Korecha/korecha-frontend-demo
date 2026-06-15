import { useEffect, useState, type FormEvent } from 'react'
import { createFleetDriver, listFleetDrivers, listFleetLocations, listFleetTruckTypes } from '../../api/fleet'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Input'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import { refName } from '../../utils/format'
import type { DriverProfile, Location, TruckType, User } from '../../types'

const emptyForm = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  truckTypeId: '',
  preferredRouteIds: [] as string[],
}

export function FleetDriversPage() {
  const { memberProfile } = useAuth()
  const [drivers, setDrivers] = useState<(DriverProfile & { user: User })[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [truckTypes, setTruckTypes] = useState<TruckType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [nationalId, setNationalId] = useState<File | null>(null)
  const [driversLicense, setDriversLicense] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const approved = isApproved(memberProfile)

  const load = () => {
    if (!approved) { setLoading(false); return }
    setLoading(true)
    listFleetDrivers()
      .then((r) => setDrivers(r.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!approved) return
    load()
    listFleetLocations().then((r) => setLocations(r.data)).catch(() => {})
    listFleetTruckTypes().then((r) => setTruckTypes(r.data)).catch(() => {})
  }, [approved])

  const toggleRoute = (id: string) => {
    setForm((f) => ({
      ...f,
      preferredRouteIds: f.preferredRouteIds.includes(id)
        ? f.preferredRouteIds.filter((r) => r !== id)
        : [...f.preferredRouteIds, id],
    }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setNationalId(null)
    setDriversLicense(null)
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
      fd.append('fullName', form.fullName)
      fd.append('email', form.email)
      fd.append('password', form.password)
      fd.append('phone', form.phone)
      fd.append('preferredRouteIds', JSON.stringify(form.preferredRouteIds))
      if (form.truckTypeId) fd.append('truckTypeId', form.truckTypeId)
      fd.append('nationalId', nationalId)
      fd.append('driversLicense', driversLicense)
      await createFleetDriver(fd)
      setShowForm(false)
      resetForm()
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create driver')
    } finally {
      setSubmitting(false)
    }
  }

  if (!approved) {
    return (
      <div>
        <PageHeader title="Fleet Drivers" description="Create and manage drivers in your fleet" />
        <Alert variant="warning" className="mt-6">Available after your fleet account is approved.</Alert>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Fleet Drivers"
        description="Create driver accounts with documents, truck type, and preferred routes"
        action={<Button onClick={() => { resetForm(); setShowForm(true) }}>+ Add Driver</Button>}
      />

      {error && !showForm && <div className="mb-4"><Alert>{error}</Alert></div>}

      <TableWrapper>
        <Table>
          <TableHead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Truck Type</Th>
              <Th>Status</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={5} message="Loading..." />
            ) : drivers.length === 0 ? (
              <TableEmpty colSpan={5} message="No drivers in your fleet yet. Add your first driver." />
            ) : (
              drivers.map((d) => (
                <TableRow key={d.id}>
                  <Td className="font-semibold">{d.user?.fullName}</Td>
                  <Td>{d.user?.email}</Td>
                  <Td>{d.user?.phone || '—'}</Td>
                  <Td>{refName(d.truckTypeId)}</Td>
                  <Td><Badge status={d.status} /></Td>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </TableWrapper>

      {showForm && (
        <Modal title="Add Driver" onClose={() => setShowForm(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert>{error}</Alert>}
            <Field label="Full Name">
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
            <Field label="National ID (image or PDF)">
              <Input type="file" accept="image/*,.pdf" onChange={(e) => setNationalId(e.target.files?.[0] || null)} required />
            </Field>
            <Field label="Driver's License (image or PDF)">
              <Input type="file" accept="image/*,.pdf" onChange={(e) => setDriversLicense(e.target.files?.[0] || null)} required />
            </Field>
            <Field label="Truck Type">
              <Select value={form.truckTypeId} onChange={(e) => setForm({ ...form, truckTypeId: e.target.value })}>
                <option value="">Select truck type</option>
                {truckTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
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
            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Driver'}</Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  )
}
