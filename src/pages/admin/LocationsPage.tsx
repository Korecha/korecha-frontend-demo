import { useEffect, useState, type FormEvent } from 'react'
import { createLocation, listLocations } from '../../api/admin'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Input'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import type { Location, LocationType } from '../../types'

const LOCATION_TYPES: LocationType[] = ['PORT', 'DRY_PORT', 'WAREHOUSE', 'CITY', 'BORDER', 'TRUCK_STOP']
const REGIONS = ['DJIBOUTI', 'OROMIA', 'ADDIS_ABABA', 'AFAR', 'SNNPR', 'DIRE_DAWA']

const emptyForm = { name: '', type: 'CITY' as LocationType, region: 'ADDIS_ABABA', lat: 9.03, lng: 38.75 }

export function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    listLocations()
      .then((res) => setLocations(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createLocation({
        name: form.name,
        type: form.type,
        region: form.region,
        coordinates: { lat: form.lat, lng: form.lng },
      })
      setShowForm(false)
      setForm(emptyForm)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Corridor Locations"
        description="Logistics waypoints for pricing and matching"
        action={<Button onClick={() => setShowForm(true)}>+ Add Location</Button>}
      />

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}

      <TableWrapper>
        <Table>
          <TableHead>
            <tr>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>Region</Th>
              <Th>Coordinates</Th>
              <Th>Active</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={5} message="Loading..." />
            ) : locations.length === 0 ? (
              <TableEmpty colSpan={5} message="No locations yet" />
            ) : (
              locations.map((loc) => (
                <TableRow key={loc.id}>
                  <Td className="font-semibold text-slate-900">{loc.name}</Td>
                  <Td className="capitalize">{loc.type.replace(/_/g, ' ').toLowerCase()}</Td>
                  <Td className="capitalize">{loc.region.replace(/_/g, ' ').toLowerCase()}</Td>
                  <Td className="font-mono text-xs text-slate-500">
                    {loc.coordinates.lat.toFixed(4)}, {loc.coordinates.lng.toFixed(4)}
                  </Td>
                  <Td>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      loc.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {loc.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </Td>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </TableWrapper>

      {showForm && (
        <Modal title="Add Location" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type">
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as LocationType })}>
                  {LOCATION_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Region">
                <Select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
                  {REGIONS.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Latitude">
                <Input type="number" step="any" value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })} />
              </Field>
              <Field label="Longitude">
                <Input type="number" step="any" value={form.lng}
                  onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })} />
              </Field>
            </div>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create'}</Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  )
}
