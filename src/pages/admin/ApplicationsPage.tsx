import { useEffect, useState, type FormEvent } from 'react'
import { listSoleImporterApplications, reviewSoleImporterApplication } from '../../api/admin'
import { ApplicationQueueTabs } from '../../components/admin/ApplicationQueueTabs'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, Textarea } from '../../components/ui/Input'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import { fileUrl } from '../../utils/fileUrl'
import type { ApprovalStatus, ImporterProfile } from '../../types'

const STATUS_TABS: ApprovalStatus[] = ['PENDING', 'APPROVED', 'REJECTED']

export function AdminApplicationsPage() {
  const [importers, setImporters] = useState<ImporterProfile[]>([])
  const [status, setStatus] = useState<ApprovalStatus>('PENDING')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approving, setApproving] = useState<ImporterProfile | null>(null)
  const [rejecting, setRejecting] = useState<ImporterProfile | null>(null)
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

  const approve = async () => {
    if (!approving) return
    setSubmitting(true)
    setError('')
    try {
      await reviewSoleImporterApplication(approving.id, { status: 'APPROVED' })
      setApproving(null)
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
        title="Applications"
        description="Separate review queues for sole importers/exporters and corporate customers"
      />
      <ApplicationQueueTabs />
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
                ? 'bg-slate-900 text-white shadow-sm'
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
              <Th>Trade side</Th>
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
                  <Td>{imp.tradeSide || 'IMPORTER'}</Td>
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
                        <Button size="sm" onClick={() => setApproving(imp)}>
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

      {approving && (
        <Modal title="Approve importer" onClose={() => setApproving(null)}>
          <p className="text-sm text-slate-600">
            Approve <span className="font-semibold text-slate-900">{approving.companyName || approving.user?.fullName}</span>?
            They will be marked verified and can continue in the importer portal.
          </p>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setApproving(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={approve} disabled={submitting}>
              {submitting ? 'Approving...' : 'Approve'}
            </Button>
          </ModalFooter>
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
