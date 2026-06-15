import { useEffect, useState, type FormEvent } from 'react'
import {
  createContainer,
  deleteContainer,
  listContainers,
  listOrganizations,
} from '../../api/admin'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Input'
import { LinkButton } from '../../components/ui/LinkButton'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import type { Container, ContainerSize, ContainerStatus, ContainerType, Organization } from '../../types'
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
  locationLabel: '',
  lastFreeDay: '',
}

export function ContainersPage() {
  const [containers, setContainers] = useState<Container[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
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
    load()
    listOrganizations().then((res) => setOrgs(res.data))
  }, [statusFilter, search])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await createContainer({ ...form, lastFreeDay: form.lastFreeDay || undefined })
      setShowForm(false)
      setForm(emptyForm)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create')
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

  return (
    <div>
      <PageHeader
        title="Container Fleet"
        description="Manage shipping line containers across the corridor"
        action={
          <div className="flex gap-3">
            <LinkButton to="/admin/containers/upload" variant="secondary">Bulk Upload</LinkButton>
            <Button onClick={() => setShowForm(true)}>+ Add Container</Button>
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
                  <Td>{c.organization?.name || '—'}</Td>
                  <Td>{c.location?.label || '—'}</Td>
                  <Td className={isDemurrageRisk(c.lastFreeDay) ? 'font-semibold text-red-600' : ''}>
                    {formatDate(c.lastFreeDay)}
                  </Td>
                  <Td>
                    <button type="button" onClick={() => handleDelete(c)} className="font-medium text-red-500 hover:underline">
                      Delete
                    </button>
                  </Td>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </TableWrapper>

      {showForm && (
        <Modal title="Add Container" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Container Number">
              <Input
                value={form.containerNumber}
                onChange={(e) => setForm({ ...form, containerNumber: e.target.value })}
                className="font-mono"
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Size">
                <Select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value as ContainerSize })}>
                  {SIZES.map((s) => <option key={s} value={s}>{SIZE_LABELS[s]}</option>)}
                </Select>
              </Field>
              <Field label="Type">
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ContainerType })}>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </Field>
            </div>
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
            <Field label="Location Label">
              <Input value={form.locationLabel} onChange={(e) => setForm({ ...form, locationLabel: e.target.value })} />
            </Field>
            <Field label="Last Free Day">
              <Input type="date" value={form.lastFreeDay} onChange={(e) => setForm({ ...form, lastFreeDay: e.target.value })} />
            </Field>
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
