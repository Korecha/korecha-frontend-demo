import { useEffect, useState, type FormEvent } from 'react'
import { listTradeCustomerApplications, reviewTradeCustomerApplication } from '../../../api/admin'
import { Alert } from '../../ui/Alert'
import { Button } from '../../ui/Button'
import { Field, Select, Textarea } from '../../ui/Input'
import { Modal, ModalFooter } from '../../ui/Modal'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../ui/Table'
import { fileUrl } from '../../../utils/fileUrl'
import { CORPORATE_TIER_LABELS, FX_FINANCING_LABELS, IMPORTER_TIER_LABELS } from '../../../utils/format'
import type { ApprovalStatus, TradeCustomerApplication } from '../../../types'

const COL_SPAN = 7

function tierOptions(row: TradeCustomerApplication): Record<string, string> {
  return row.tierVocabulary === 'CORPORATE' ? CORPORATE_TIER_LABELS : IMPORTER_TIER_LABELS
}

function seedTier(row: TradeCustomerApplication): string {
  const options = tierOptions(row)
  if (row.tier && options[row.tier]) return row.tier
  return Object.keys(options)[0] ?? ''
}

export function TradeCustomerQueue({ status }: { status: ApprovalStatus | 'ALL' }) {
  const [rows, setRows] = useState<TradeCustomerApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approving, setApproving] = useState<TradeCustomerApplication | null>(null)
  const [rejecting, setRejecting] = useState<TradeCustomerApplication | null>(null)
  const [tier, setTier] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    listTradeCustomerApplications(status)
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
        return listTradeCustomerApplications(status)
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
  }, [status])

  const openApprove = (row: TradeCustomerApplication) => {
    setError('')
    setApproving(row)
    setTier(seedTier(row))
  }

  const approve = async (e: FormEvent) => {
    e.preventDefault()
    if (!approving) return
    setSubmitting(true)
    setError('')
    try {
      await reviewTradeCustomerApplication(approving.id, {
        source: approving.source,
        status: 'APPROVED',
        tier,
      })
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
      await reviewTradeCustomerApplication(rejecting.id, {
        source: rejecting.source,
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

      <TableWrapper>
        <Table>
          <TableHead>
            <tr>
              <Th>Company</Th>
              <Th>Contact</Th>
              <Th>Trade side</Th>
              <Th>Tier</Th>
              <Th>FX Financed</Th>
              <Th>Documents</Th>
              <Th>Actions</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={COL_SPAN} message="Loading..." />
            ) : rows.length === 0 ? (
              <TableEmpty
                colSpan={COL_SPAN}
                message={`No ${status === 'ALL' ? '' : `${status.toLowerCase()} `}trade customer applications`}
              />
            ) : (
              rows.map((row) => (
                <TableRow key={`${row.source}-${row.id}`}>
                  <Td>
                    <div className="font-semibold">{row.companyName}</div>
                    {row.tinNumber ? (
                      <div className="text-xs text-slate-500">TIN: {row.tinNumber}</div>
                    ) : null}
                  </Td>
                  <Td>
                    <div>{row.contact?.fullName || '—'}</div>
                    {row.contact?.email ? (
                      <div className="text-xs text-slate-500">{row.contact.email}</div>
                    ) : null}
                  </Td>
                  <Td>{row.tradeSide ?? 'Corporate'}</Td>
                  <Td>{row.tierLabel ?? '—'}</Td>
                  <Td>
                    {row.fxFinancingDeclared
                      ? FX_FINANCING_LABELS[row.fxFinancingDeclared] ?? row.fxFinancingDeclared
                      : '—'}
                  </Td>
                  <Td className="space-x-3">
                    {row.documents.length === 0
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
                        <Button size="sm" onClick={() => openApprove(row)}>
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
        <Modal title="Approve application" onClose={() => setApproving(null)}>
          <form onSubmit={approve} className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <p className="text-sm font-semibold text-slate-900">{approving.companyName}</p>
              <p className="mt-1 text-xs text-slate-600">
                Tier is a matching-priority attribute. Mode is derived per load from FX financing — it is
                never chosen here.
              </p>
            </div>
            <Field label="Tier">
              <Select value={tier} onChange={(e) => setTier(e.target.value)}>
                {Object.entries(tierOptions(approving)).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setApproving(null)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Approving...' : 'Approve'}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {rejecting && (
        <Modal title="Reject application" onClose={() => setRejecting(null)}>
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
