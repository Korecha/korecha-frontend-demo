import { useEffect, useState, type FormEvent } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { createLocation, listLocations, updateLocation } from '../../api/admin'
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
const pickerIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid white;box-shadow:0 3px 10px rgba(37,99,235,.4)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function MapCenterSync({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom())
  }, [lat, lng, map])
  return null
}

function LocationMapPicker({
  lat,
  lng,
  onPick,
}: {
  lat: number
  lng: number
  onPick: (lat: number, lng: number) => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-korecha-border">
      <div className="h-64">
        <MapContainer center={[lat, lng]} zoom={8} className="h-full w-full" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onPick={onPick} />
          <MapCenterSync lat={lat} lng={lng} />
          <Marker position={[lat, lng]} icon={pickerIcon} />
        </MapContainer>
      </div>
      <div className="border-t border-korecha-border bg-slate-50 px-4 py-2 text-xs text-slate-500">
        Click the map to update coordinates, or adjust latitude and longitude manually.
      </div>
    </div>
  )
}

export function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    listLocations()
      .then((res) => setLocations(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let active = true
    void Promise.resolve()
      .then(() => {
        setLoading(true)
        return listLocations()
      })
      .then((res) => {
        if (active) setLocations(res.data)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (location: Location) => {
    setEditing(location)
    setForm({
      name: location.name,
      type: location.type,
      region: location.region,
      lat: location.coordinates.lat,
      lng: location.coordinates.lng,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const body = {
        name: form.name,
        type: form.type,
        region: form.region,
        coordinates: { lat: form.lat, lng: form.lng },
      }
      if (editing) await updateLocation(editing.id, body)
      else await createLocation(body)
      setShowForm(false)
      setEditing(null)
      setForm(emptyForm)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (location: Location) => {
    const nextActive = !location.isActive
    const action = nextActive ? 'reactivate' : 'deactivate'
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${location.name}?`)) return
    setError('')
    try {
      await updateLocation(location.id, { isActive: nextActive })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`)
    }
  }

  return (
    <div>
      <PageHeader
        title="Corridor Locations"
        description="Logistics waypoints for pricing and matching"
        action={<Button onClick={openCreate}>+ Add Location</Button>}
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
              <Th>Actions</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={6} message="Loading..." />
            ) : locations.length === 0 ? (
              <TableEmpty colSpan={6} message="No locations yet" />
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
                  <Td>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => openEdit(loc)} className="font-medium text-korecha-primary hover:underline">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(loc)}
                        className={`font-medium hover:underline ${
                          loc.isActive ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {loc.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  </Td>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </TableWrapper>

      {showForm && (
        <Modal title={editing ? 'Edit Location' : 'Add Location'} onClose={() => setShowForm(false)} wide>
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
            <LocationMapPicker
              lat={form.lat}
              lng={form.lng}
              onPick={(lat, lng) => setForm({ ...form, lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) })}
            />
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
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : editing ? 'Save changes' : 'Create'}</Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  )
}
