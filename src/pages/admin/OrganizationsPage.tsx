import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  createOrganization,
  listOrganizations,
  suspendOrganization,
  updateOrganization,
} from '../../api/admin'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import type { Organization } from '../../types'
import { formatEtb } from '../../utils/format'

const emptyForm = {
  name: '',
  contactEmail: '',
  phone: '',
  address: '',
  basePricePerKm: 28,
  adminFullName: '',
  adminEmail: '',
  adminPassword: '',
}

export function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Organization | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    listOrganizations({ search: search || undefined })
      .then((res) => setOrgs(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [search])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (org: Organization) => {
    setEditing(org)
    setForm({
      name: org.name,
      contactEmail: org.contactEmail || '',
      phone: org.phone || '',
      address: org.address || '',
      basePricePerKm: org.pricing?.basePricePerKm || 28,
      adminFullName: '',
      adminEmail: '',
      adminPassword: '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (editing) await updateOrganization(editing.id, form)
      else await createOrganization(form)
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSuspend = async (org: Organization) => {
    if (!confirm(`Suspend ${org.name}?`)) return
    try {
      await suspendOrganization(org.id)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suspend')
    }
  }

  const handleReactivate = async (org: Organization) => {
    try {
      await updateOrganization(org.id, { status: 'ACTIVE' })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate')
    }
  }

  return (
    <div>
      <PageHeader
        title="Organizations"
        description="Manage organizations and their pricing"
        action={
          <Button onClick={openCreate}>+ New Organization</Button>
        }
      />

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}

      <div className="mb-6">
        <Input
          type="search"
          placeholder="Search organizations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <TableWrapper>
        <Table>
          <TableHead>
            <tr>
              <Th>Name</Th>
              <Th>Status</Th>
              <Th>Price/km</Th>
              <Th>Org Admin</Th>
              <Th>Containers</Th>
              <Th>Actions</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={6} message="Loading..." />
            ) : orgs.length === 0 ? (
              <TableEmpty colSpan={6} message="No organizations found" />
            ) : (
              orgs.map((org) => (
                <TableRow key={org.id}>
                  <Td className="font-semibold text-slate-900">{org.name}</Td>
                  <Td><Badge status={org.status} /></Td>
                  <Td>
                    {org.pricing ? formatEtb(org.pricing.basePricePerKm) : '—'}
                  </Td>
                  <Td className="text-xs">{org.orgAdmin?.email || '—'}</Td>
                  <Td>{org.containerCount ?? 0}</Td>
                  <Td>
                    <div className="flex gap-3">
                      <Link to={`/admin/organizations/${org.id}`} className="font-medium text-korecha-primary hover:underline">
                        View
                      </Link>
                      <button type="button" onClick={() => openEdit(org)} className="font-medium text-slate-500 hover:text-slate-800">
                        Edit
                      </button>
                      {org.status === 'ACTIVE' ? (
                        <button type="button" onClick={() => handleSuspend(org)} className="font-medium text-red-500 hover:underline">
                          Suspend
                        </button>
                      ) : (
                        <button type="button" onClick={() => handleReactivate(org)} className="font-medium text-emerald-600 hover:underline">
                          Reactivate
                        </button>
                      )}
                    </div>
                  </Td>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </TableWrapper>

      {showForm && (
        <Modal title={editing ? 'Edit Organization' : 'New Organization'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label="Contact Email">
              <Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Address">
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            <Field label="Base Price per km (ETB)">
              <Input
                type="number"
                min={0}
                step={0.5}
                value={form.basePricePerKm}
                onChange={(e) => setForm({ ...form, basePricePerKm: Number(e.target.value) })}
              />
            </Field>
            {!editing && (
              <>
                <div className="border-t border-korecha-border pt-4">
                  <p className="mb-3 text-sm font-semibold text-slate-900">Organization Login Credentials</p>
                </div>
                <Field label="Admin Full Name">
                  <Input value={form.adminFullName} onChange={(e) => setForm({ ...form, adminFullName: e.target.value })} required />
                </Field>
                <Field label="Admin Email">
                  <Input type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} required />
                </Field>
                <Field label="Admin Password">
                  <Input type="password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} minLength={6} required />
                </Field>
              </>
            )}
            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  )
}
