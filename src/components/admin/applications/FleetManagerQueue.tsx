import { useEffect, useState, type FormEvent } from 'react'
import { listFleetManagerApplications, reviewFleetManagerApplication } from '../../../api/admin'
import { Alert } from '../../ui/Alert'
import { Button } from '../../ui/Button'
import { Field, Textarea } from '../../ui/Input'
import { Modal, ModalFooter } from '../../ui/Modal'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../ui/Table'
import { fileUrl } from '../../../utils/fileUrl'
import { PROVIDER_TYPE_LABELS } from '../../../utils/format'
import type { ApprovalStatus, FleetManagerApplication, ModeScope } from '../../../types'

export function FleetManagerQueue({
  status,
  modeScope,
}: {
  status: ApprovalStatus | 'ALL'
  modeScope: ModeScope
}) {
  const [rows, setRows] = useState<FleetManagerApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approving, setApproving] = useState<FleetManagerApplication | null>(null)
  const [rejecting, setRejecting] = useState<FleetManagerApplication | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isMultimodal = modeScope === 'MULTIMODAL'
  const colSpan = 5

  const load = () => {
    setLoading(true)
    listFleetManagerApplications({ status, modeScope })
      .then((res) => setRows(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let active = true
    void Promise.resolve()
      .then(() => {
        setLoading(true)
        setError('')
        return listFleetManagerApplications({ status, modeScope })
      })
      .then((res) => {
        if (active) setRows(res.data)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [status, modeScope])

  const approve = async () => {
    if (!approving) return
    setSubmitting(true)
    setError('')
    try {
      await reviewFleetManagerApplication(approving.id, { status: 'APPROVED' })
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
      await reviewFleetManagerApplication(rejecting.id, {
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
      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {isMultimodal ? (
        <p className="mb-4 text-sm text-korecha-muted">
          MTO applicants must hold a verified Ethiopian Maritime Authority multimodal license. Verification
          is manual pending policy sign-off.
        </p>
      ) : (
        <p className="mb-4 text-sm text-korecha-muted">
          Expected documents by type: association — organization registration; transit company — customs
          broker license; licensed operator — vehicle and business registration.
        </p>
      )}

      <TableWrapper>
        <Table>
          <TableHead>
            <tr>
              <Th>Fleet name</Th>
              <Th>Contact</Th>
              {isMultimodal ? <Th>Multimodal license no.</Th> : <Th>Provider type</Th>}
              <Th>Documents</Th>
              <Th>Actions</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={colSpan} message="Loading..." />
            ) : rows.length === 0 ? (
              <TableEmpty
                colSpan={colSpan}
                message={`No ${status === 'ALL' ? '' : `${status.toLowerCase()} `}${isMultimodal ? 'multimodal' : 'unimodal'} fleet manager applications`}
              />
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <Td className="font-semibold">{row.fleetName}</Td>
                  <Td>
                    <div>{row.user?.fullName || '—'}</div>
                    {row.user?.email ? (
                      <div className="text-xs text-slate-500">{row.user.email}</div>
                    ) : null}
                  </Td>
                  {isMultimodal ? (
                    <Td>{row.multimodalLicenseNo || '—'}</Td>
                  ) : (
                    <Td>
                      {row.providerType ? PROVIDER_TYPE_LABELS[row.providerType] ?? row.providerType : '—'}
                    </Td>
                  )}
                  <Td className="space-x-3">
                    {!row.documents || row.documents.length === 0
                      ? '—'
                      : row.documents.map((doc) => (
                          <a
                            key={doc.key}
                            href={fileUrl(doc.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-korecha-primary hover:underline"
                          >
                            {doc.label}
                          </a>
                        ))}
                  </Td>
                  <Td>
                    {row.status === 'PENDING' ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setApproving(row)}>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setRejecting(row)
                            setRejectionReason(row.rejectionReason || '')
                            setError('')
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">
                        {row.rejectionReason || 'Reviewed'}
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
        <Modal title="Approve fleet manager" onClose={() => setApproving(null)}>
          <p className="text-sm text-slate-600">
            Approve <span className="font-semibold text-slate-900">{approving.fleetName}</span>? They will
            be marked verified and can continue in the fleet portal.
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
        <Modal title="Reject fleet manager application" onClose={() => setRejecting(null)}>
          <form onSubmit={reject} className="space-y-4">
            {!rejectionReason.trim() && (
              <Alert>A rejection reason is required before you can reject this application.</Alert>
            )}
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
