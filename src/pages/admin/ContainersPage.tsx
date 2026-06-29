import { useEffect, useState, type FormEvent } from 'react'
import {
  createContainer,
  deleteContainer,
  listContainers,
  listLocations,
  listOrganizations,
  updateContainer,
} from '../../api/admin'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/Input'
import { LinkButton } from '../../components/ui/LinkButton'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import type { Container, ContainerSize, ContainerStatus, ContainerType, Location, Organization } from '../../types'
import { formatDate, isDemurrageRisk, SIZE_LABELS } from '../../utils/format'

const SIZES: ContainerSize[] = ['TWENTY_FT', 'FORTY_FT', 'FORTY_FT_HC']
const TYPES: ContainerType[] = ['DRY', 'REEFER', 'OPEN_TOP', 'FLAT_RACK']
const STATUSES: ContainerStatus[] = ['AVAILABLE', 'IN_TRANSIT', 'EMPTY', 'LOADED', 'DISCHARGED', 'AT_PORT', 'MAINTENANCE']

const emptyForm = {
  containerNumber: '',
  size: 'FORTY_FT' as ContainerSize,
  type: 'DRY' as ContainerType,
  status: 'AVAILABLE' as ContainerStatus,
  organizationId: '',
  locationId: '',
  locationLabel: '',
  shippingLineCode: '',
  lastFreeDay: '',
  notes: '',
}

function toDateInputValue(date?: string | null) {
  if (!date) return ''
  return date.split('T')[0]
}

export function ContainersPage() {
  const [containers, setContainers] = useState<Container[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Container | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    listContainers({
      status: (statusFilter as ContainerStatus) || undefined,
      search: search || undefined,
    })
      .then((res) => setContainers(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let active = true
    void Promise.resolve()
      .then(() => {
        setLoading(true)
        return listContainers({
          status: (statusFilter as ContainerStatus) || undefined,
          search: search || undefined,
        })
      })
      .then((res) => {
        if (active) setContainers(res.data)
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
  }, [statusFilter, search])

  useEffect(() => {
    listOrganizations().then((res) => setOrgs(res.data)).catch(() => {})
    listLocations().then((res) => setLocations(res.data.filter((loc) => loc.isActive))).catch(() => {})
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (container: Container) => {
    setEditing(container)
    setForm({
      containerNumber: container.containerNumber,
      size: container.size,
      type: container.type,
      status: container.status,
      organizationId: container.organizationId || container.organization?.id || '',
      locationId: container.location?.locationId || '',
      locationLabel: container.location?.label || '',
      shippingLineCode: container.shippingLineCode || '',
      lastFreeDay: toDateInputValue(container.lastFreeDay),
      notes: container.notes || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const selectedLocation = locations.find((loc) => loc.id === form.locationId)
    const body = {
      status: form.status,
      organizationId: form.organizationId,
      locationId: form.locationId || undefined,
      locationLabel: selectedLocation?.name || form.locationLabel || undefined,
      shippingLineCode: form.shippingLineCode || undefined,
      lastFreeDay: form.lastFreeDay || undefined,
      notes: form.notes || undefined,
    }
    try {
      if (editing) {
        await updateContainer(editing.id, body)
      } else {
        await createContainer({
          ...body,
          containerNumber: form.containerNumber,
          size: form.size,
          type: form.type,
          status: form.status,
          organizationId: form.organizationId,
        })
      }
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

  const handleDelete = async (c: Container) => {
    if (!confirm(`Delete container ${c.containerNumber}?`)) return
    try {
      await deleteContainer(c.id)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const shippingOrgs = orgs.filter((o) => o.type === 'SHIPPING_LINE')
  const locationOptions = locations.filter((loc) => loc.isActive)

  return (
    <div>
      <PageHeader
        title="Container Fleet"
        description="Manage shipping line containers across the corridor"
        action={
          <div className="flex gap-3">
            <LinkButton to="/admin/containers/upload" variant="secondary">Bulk Upload</LinkButton>
            <Button onClick={openCreate}>+ Add Container</Button>
          </div>
        }
      />

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}

      <div className="mb-6 flex flex-wrap gap-3">
        <Input
          type="search"
          placeholder="Search by container number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-xs">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </Select>
      </div>

      <TableWrapper>
        <Table>
          <TableHead>
            <tr>
              <Th>Number</Th>
              <Th>Size</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Owner</Th>
              <Th>Location</Th>
              <Th>Last Free Day</Th>
              <Th>Actions</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={8} message="Loading..." />
            ) : containers.length === 0 ? (
              <TableEmpty colSpan={8} message="No containers found" />
            ) : (
              containers.map((c) => (
                <TableRow key={c.id}>
                  <Td className="font-mono font-semibold text-slate-900">{c.containerNumber}</Td>
                  <Td>{SIZE_LABELS[c.size] || c.size}</Td>
                  <Td>{c.type}</Td>
                  <Td><Badge status={c.status} /></Td>
                  <Td>
                    <p>{c.organization?.name || '—'}</p>
                    {c.shippingLineCode && <p className="mt-1 font-mono text-xs text-slate-500">{c.shippingLineCode}</p>}
                  </Td>
                  <Td>
                    <p>{c.location?.label || '—'}</p>
                    {c.notes && <p className="mt-1 max-w-[12rem] truncate text-xs text-slate-500">{c.notes}</p>}
                  </Td>
                  <Td className={isDemurrageRisk(c.lastFreeDay) ? 'font-semibold text-red-600' : ''}>
                    {formatDate(c.lastFreeDay)}
                  </Td>
                  <Td>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => openEdit(c)} className="font-medium text-korecha-primary hover:underline">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(c)} className="font-medium text-red-500 hover:underline">
                        Delete
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
        <Modal title={editing ? 'Edit Container Lifecycle' : 'Add Container'} onClose={() => setShowForm(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Container Number">
              <Input
                value={form.containerNumber}
                onChange={(e) => setForm({ ...form, containerNumber: e.target.value })}
                className="font-mono"
                disabled={Boolean(editing)}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Size">
                <Select
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value as ContainerSize })}
                  disabled={Boolean(editing)}
                >
                  {SIZES.map((s) => <option key={s} value={s}>{SIZE_LABELS[s]}</option>)}
                </Select>
              </Field>
              <Field label="Type">
                <Select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as ContainerType })}
                  disabled={Boolean(editing)}
                >
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Lifecycle Status">
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ContainerStatus })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </Select>
              </Field>
              <Field label="Shipping Line (Org)">
                <Select
                  value={form.organizationId}
                  onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
                  required
                >
                  <option value="">Select organization</option>
                  {shippingOrgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Current Location">
                <Select
                  value={form.locationId}
                  onChange={(e) => {
                    const nextLocation = locationOptions.find((loc) => loc.id === e.target.value)
                    setForm({
                      ...form,
                      locationId: e.target.value,
                      locationLabel: nextLocation?.name || form.locationLabel,
                    })
                  }}
                >
                  <option value="">Use custom label</option>
                  {locationOptions.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.type.replace(/_/g, ' ')})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Custom Location Label">
                <Input value={form.locationLabel} onChange={(e) => setForm({ ...form, locationLabel: e.target.value })} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Shipping Line Code">
                <Input value={form.shippingLineCode} onChange={(e) => setForm({ ...form, shippingLineCode: e.target.value })} />
              </Field>
              <Field label="Last Free Day">
                <Input type="date" value={form.lastFreeDay} onChange={(e) => setForm({ ...form, lastFreeDay: e.target.value })} />
              </Field>
            </div>
            <Field label="Operations Notes">
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Customs hold, seal issue, maintenance note, or other exception"
              />
            </Field>
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
