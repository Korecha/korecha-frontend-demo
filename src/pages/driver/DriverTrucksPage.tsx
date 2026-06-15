import { useEffect, useState, type FormEvent } from 'react'
import { createDriverTruck, listDriverTrucks } from '../../api/driver'
import { listPublicTruckTypes } from '../../api/public'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Input'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { refName } from '../../utils/format'
import type { Truck, TruckType } from '../../types'

export function DriverTrucksPage() {
  const { organization, memberProfile } = useAuth()
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [truckTypes, setTruckTypes] = useState<TruckType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ plateNumber: '', truckTypeId: '' })
  const approved = isApproved(memberProfile)

  const load = () => {
    if (!approved) { setLoading(false); return }
    setLoading(true)
    listDriverTrucks()
      .then((r) => setTrucks(r.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    if (organization?.id) {
      listPublicTruckTypes(organization.id).then((r) => setTruckTypes(r.data)).catch(() => {})
    }
  }, [organization?.id, approved])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await createDriverTruck(form)
      setShowForm(false)
      setForm({ plateNumber: '', truckTypeId: '' })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add truck')
    }
  }

  if (!approved) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="font-bold text-slate-900">Trucks unavailable</h2>
        <p className="mt-2 text-sm text-slate-600">Register trucks after your account is approved.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My trucks</h2>
          <p className="text-sm text-korecha-muted">Visible to importers when you are live</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="shrink-0">+ Add</Button>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <p className="text-sm text-korecha-muted">Loading...</p>
      ) : trucks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-korecha-border bg-white p-10 text-center">
          <p className="text-4xl">🚛</p>
          <p className="mt-3 font-semibold text-slate-900">No trucks yet</p>
          <p className="mt-1 text-sm text-korecha-muted">Add your truck to appear on the importer map</p>
          <Button onClick={() => setShowForm(true)} className="mt-4">Register truck</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {trucks.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-korecha-border bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-lg">🚛</div>
                <div>
                  <p className="font-bold text-slate-900">{t.plateNumber}</p>
                  <p className="text-xs text-korecha-muted">{refName(t.truckTypeId)}</p>
                </div>
              </div>
              <Badge status={t.status} />
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="Register truck" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Plate number">
              <Input value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} required className="uppercase" />
            </Field>
            <Field label="Truck type">
              <Select value={form.truckTypeId} onChange={(e) => setForm({ ...form, truckTypeId: e.target.value })} required>
                <option value="">Select type</option>
                {truckTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </Field>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Submit</Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  )
}
