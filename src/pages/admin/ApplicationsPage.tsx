import { useEffect, useState, type FormEvent } from 'react'
import { listOrganizations, listSoleImporterApplications, reviewSoleImporterApplication } from '../../api/admin'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/Input'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import { fileUrl } from '../../utils/fileUrl'
import type { ApprovalStatus, ImporterProfile, Organization } from '../../types'

type ApprovalMode = 'existing' | 'new'

const STATUS_TABS: ApprovalStatus[] = ['PENDING', 'APPROVED', 'REJECTED']

const emptyApprovalForm = {
  mode: 'existing' as ApprovalMode,
  organizationId: '',
  name: '',
  contactEmail: '',
  phone: '',
  address: '',
  basePricePerKm: 28,
}

export function AdminApplicationsPage() {
  const [importers, setImporters] = useState<ImporterProfile[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [status, setStatus] = useState<ApprovalStatus>('PENDING')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewing, setReviewing] = useState<ImporterProfile | null>(null)
  const [rejecting, setRejecting] = useState<ImporterProfile | null>(null)
  const [approvalForm, setApprovalForm] = useState(emptyApprovalForm)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    listSoleImporterApplications(status)
      .then((res) => setImporters(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let active = true
    void Promise.resolve()
      .then(() => {
        setLoading(true)
        return listSoleImporterApplications(status)
      })
      .then((res) => {
        if (active) setImporters(res.data)
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
  }, [status])

  useEffect(() => {
    listOrganizations({ type: 'IMPORTER', status: 'ACTIVE' })
      .then((res) => setOrganizations(res.data))
      .catch(() => {})
  }, [])

  const openApprove = (imp: ImporterProfile) => {
    setError('')
    setReviewing(imp)
    setApprovalForm({
      ...emptyApprovalForm,
      name: imp.companyName || `${imp.user?.fullName || 'Importer'} Organization`,
      contactEmail: imp.user?.email || '',
      phone: imp.user?.phone || '',
    })
  }

  const approve = async (e: FormEvent) => {
    e.preventDefault()
    if (!reviewing) return
    if (approvalForm.mode === 'existing' && !approvalForm.organizationId) {
      setError('Choose an importer organization before approving')
      return
    }
    if (approvalForm.mode === 'new' && !approvalForm.name.trim()) {
      setError('Organization name is required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await reviewSoleImporterApplication(reviewing.id, {
        status: 'APPROVED',
        organizationId: approvalForm.mode === 'existing' ? approvalForm.organizationId : undefined,
        createOrganization:
          approvalForm.mode === 'new'
            ? {
                name: approvalForm.name.trim(),
                contactEmail: approvalForm.contactEmail || undefined,
                phone: approvalForm.phone || undefined,
                address: approvalForm.address || undefined,
                basePricePerKm: approvalForm.basePricePerKm,
              }
            : undefined,
      })
      setReviewing(null)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  const reject = async (e: FormEvent) => {
    e.preventDefault()
    if (!rejecting) return
    if (!rejectionReason.trim()) {
      setError('Add a rejection reason before rejecting')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await reviewSoleImporterApplication(rejecting.id, {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
      })
      setRejecting(null)
      setRejectionReason('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Importer Applications"
        description="Review independent importers registering without an organization"
      />
      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatus(tab)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
              status === tab
                ? 'bg-korecha-primary text-white shadow-sm'
                : 'bg-white text-slate-600 ring-1 ring-korecha-border hover:bg-slate-50'
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <TableWrapper>
        <Table>
          <TableHead>
            <tr>
              <Th>Company</Th>
              <Th>Contact</Th>
              <Th>Phone</Th>
              <Th>Organization</Th>
              <Th>Documents</Th>
              <Th>Actions</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={6} message="Loading..." />
            ) : importers.length === 0 ? (
              <TableEmpty colSpan={6} message={`No ${status.toLowerCase()} sole importer applications`} />
            ) : (
              importers.map((imp) => (
                <TableRow key={imp.id}>
                  <Td className="font-semibold">{imp.companyName || imp.user?.fullName}</Td>
                  <Td>{imp.user?.fullName}</Td>
                  <Td>{imp.user?.phone || '—'}</Td>
                  <Td>{imp.organizationId ? 'Linked' : 'Unlinked'}</Td>
                  <Td className="space-x-3">
                    {imp.nationalIdFile && (
                      <a
                        href={fileUrl(imp.nationalIdFile)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-korecha-primary hover:underline"
                      >
                        National ID
                      </a>
                    )}
                    {imp.importLicenseFile && (
                      <a
                        href={fileUrl(imp.importLicenseFile)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-korecha-primary hover:underline"
                      >
                        Import license
                      </a>
                    )}
                  </Td>
                  <Td>
                    {status === 'PENDING' ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => openApprove(imp)}>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setRejecting(imp)
                            setRejectionReason(imp.rejectionReason || '')
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">
                        {status === 'REJECTED' ? imp.rejectionReason || 'Rejected' : 'Reviewed'}
                      </span>
                    )}
                  </Td>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </TableWrapper>

      {reviewing && (
        <Modal title="Approve importer" onClose={() => setReviewing(null)} wide>
          <form onSubmit={approve} className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <p className="text-sm font-semibold text-slate-900">
                {reviewing.companyName || reviewing.user?.fullName}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Link this importer to an organization before approving so they can post jobs.
              </p>
            </div>

            <Field label="Organization assignment">
              <Select
                value={approvalForm.mode}
                onChange={(e) => setApprovalForm({ ...approvalForm, mode: e.target.value as ApprovalMode })}
              >
                <option value="existing">Assign to existing importer organization</option>
                <option value="new">Create a new importer organization</option>
              </Select>
            </Field>

            {approvalForm.mode === 'existing' ? (
              <Field label="Importer organization">
                <Select
                  value={approvalForm.organizationId}
                  onChange={(e) => setApprovalForm({ ...approvalForm, organizationId: e.target.value })}
                  required
                >
                  <option value="">Select organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Organization name">
                  <Input
                    value={approvalForm.name}
                    onChange={(e) => setApprovalForm({ ...approvalForm, name: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Contact email">
                  <Input
                    type="email"
                    value={approvalForm.contactEmail}
                    onChange={(e) => setApprovalForm({ ...approvalForm, contactEmail: e.target.value })}
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    value={approvalForm.phone}
                    onChange={(e) => setApprovalForm({ ...approvalForm, phone: e.target.value })}
                  />
                </Field>
                <Field label="Base price per km (ETB)">
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={approvalForm.basePricePerKm}
                    onChange={(e) => setApprovalForm({ ...approvalForm, basePricePerKm: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Address">
                  <Input
                    value={approvalForm.address}
                    onChange={(e) => setApprovalForm({ ...approvalForm, address: e.target.value })}
                    className="sm:col-span-2"
                  />
                </Field>
              </div>
            )}

            <ModalFooter>
              <Button variant="secondary" onClick={() => setReviewing(null)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Approving...' : 'Approve and link'}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {rejecting && (
        <Modal title="Reject importer application" onClose={() => setRejecting(null)}>
          <form onSubmit={reject} className="space-y-4">
            <Field label="Rejection reason">
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                placeholder="Explain what documents or details need to be fixed"
                required
              />
            </Field>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setRejecting(null)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" disabled={submitting}>
                {submitting ? 'Rejecting...' : 'Reject application'}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  )
}
