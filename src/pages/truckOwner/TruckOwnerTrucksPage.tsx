import { useEffect, useState, type FormEvent } from 'react'
import {
  createTruckOwnerTruck,
  listTruckOwnerDrivers,
  listTruckOwnerTrucks,
  listTruckOwnerTruckTypes,
} from '../../api/truckOwner'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Input'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import {
  Table,
  TableEmpty,
  TableHead,
  TableRow,
  TableWrapper,
  Td,
  Th,
} from '../../components/ui/Table'
import { refName } from '../../utils/format'
import type { DriverProfile, Truck, TruckType, User } from '../../types'

export function TruckOwnerTrucksPage() {
  const { memberProfile } = useAuth()
  const approved = isApproved(memberProfile)
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [truckTypes, setTruckTypes] = useState<TruckType[]>([])
  const [drivers, setDrivers] = useState<(DriverProfile & { user: User })[]>([])
  const [loading, setLoading] = useState(approved)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ plateNumber: '', truckTypeId: '', driverId: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    if (!approved) {
      setLoading(false)
      return
    }
    setLoading(true)
    listTruckOwnerTrucks()
      .then((r) => setTrucks(r.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load trucks'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let cancelled = false
    if (!approved) return
    listTruckOwnerTrucks()
      .then((r) => {
        if (!cancelled) setTrucks(r.data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load trucks')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    listTruckOwnerTruckTypes()
      .then((r) => {
        if (!cancelled) setTruckTypes(r.data)
      })
      .catch(() => {})
    listTruckOwnerDrivers()
      .then((r) => {
        if (!cancelled) setDrivers(r.data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [approved])

  const resetForm = () => setForm({ plateNumber: '', truckTypeId: '', driverId: '' })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await createTruckOwnerTruck({
        plateNumber: form.plateNumber,
        truckTypeId: form.truckTypeId,
        driverId: form.driverId || undefined,
      })
      setShowForm(false)
      resetForm()
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register truck')
    } finally {
      setSubmitting(false)
    }
  }

  if (!approved) {
    return (
      <div>
        <PageHeader title="Trucks" description="Register and manage your trucks" />
        <Alert variant="warning" className="mt-6">
          Available after your truck owner account is approved.
        </Alert>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Trucks"
        description="Register your trucks and track their approval status"
        action={
          <Button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
          >
            + Register Truck
          </Button>
        }
      />

      {error && !showForm && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <TableWrapper>
        <Table>
          <TableHead>
            <tr>
              <Th>Plate</Th>
              <Th>Type</Th>
              <Th>Driver</Th>
              <Th>Status</Th>
              <Th>Available</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={5} message="Loading..." />
            ) : trucks.length === 0 ? (
              <TableEmpty colSpan={5} message="No trucks yet. Register your first truck." />
            ) : (
              trucks.map((t) => (
                <TableRow key={t.id}>
                  <Td className="font-semibold">{t.plateNumber}</Td>
                  <Td>{refName(t.truckTypeId)}</Td>
                  <Td>
                    {typeof t.driverId === 'object' && t.driverId
                      ? t.driverId.fullName
                      : 'No driver assigned'}
                  </Td>
                  <Td>
                    <Badge status={t.status} />
                  </Td>
                  <Td>
                    <span
                      className={`text-xs font-medium ${t.available ? 'text-emerald-600' : 'text-slate-400'}`}
                    >
                      {t.available ? 'Available' : 'Unavailable'}
                    </span>
                  </Td>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </TableWrapper>

      {showForm && (
        <Modal title="Register truck" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert>{error}</Alert>}
            <Field label="Plate number">
              <Input
                value={form.plateNumber}
                onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
                required
                className="uppercase"
              />
            </Field>
            <Field label="Truck type">
              <Select
                value={form.truckTypeId}
                onChange={(e) => setForm({ ...form, truckTypeId: e.target.value })}
                required
              >
                <option value="">Select type</option>
                {truckTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
            {drivers.length > 0 && (
              <Field label="Driver (optional)">
                <Select
                  value={form.driverId}
                  onChange={(e) => setForm({ ...form, driverId: e.target.value })}
                >
                  <option value="">No driver assigned</option>
                  {drivers.map((d) => (
                    <option key={d.userId} value={d.userId}>
                      {d.user?.fullName}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  )
}
