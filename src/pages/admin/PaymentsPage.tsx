import { useCallback, useEffect, useState } from 'react'
import {
  listPaymentDisputes,
  listPayments,
  raiseDispute,
  recordManualPayment,
  resolveDispute,
  updatePaymentStatus,
} from '../../api/admin'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Loading } from '../../components/ui/Loading'
import { PageHeader } from '../../components/ui/PageHeader'
import { Field, Input, Select, Textarea } from '../../components/ui/Input'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import {
  TableWrapper,
  Table,
  TableHead,
  TableRow,
  Th,
  Td,
  TableEmpty,
} from '../../components/ui/Table'
import { ChipTabs, PillTabs } from '../../components/ui/Tabs'
import {
  formatEtb,
  formatDate,
  PAYMENT_PROVIDER_LABELS,
  SHIPMENT_MODE_LABELS,
  RELEASE_METHOD_LABELS,
  DISPUTE_REASON_LABELS,
} from '../../utils/format'
import type {
  DisputeReasonCode,
  DisputeResolution,
  Payment,
  PaymentDispute,
  PaymentProvider,
  PaymentReleaseMethod,
} from '../../types'

const PAYMENT_PROVIDER_OPTIONS = Object.keys(PAYMENT_PROVIDER_LABELS) as PaymentProvider[]
const RELEASE_METHODS = Object.keys(RELEASE_METHOD_LABELS) as PaymentReleaseMethod[]
const DISPUTE_REASONS = Object.keys(DISPUTE_REASON_LABELS) as DisputeReasonCode[]

type TopTab = 'payments' | 'disputes'
type DisputeFilter = 'OPEN' | 'RESOLVED' | 'ALL'

const TOP_TABS: { key: TopTab; label: string }[] = [
  { key: 'payments', label: 'Payments' },
  { key: 'disputes', label: 'Disputes' },
]

const DISPUTE_TABS: { key: DisputeFilter; label: string }[] = [
  { key: 'OPEN', label: 'Open' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'ALL', label: 'All' },
]

function verificationMark(value: boolean | null | undefined) {
  if (value === true) return '✓'
  if (value === false) return '✗'
  return 'Not evaluated'
}

function payeeLabel(payment: Payment) {
  if (!payment.payee) return 'Not assigned'
  return payment.payee.organizationName
    ? `${payment.payee.fleetName} · ${payment.payee.organizationName}`
    : payment.payee.fleetName
}

function personName(value: PaymentDispute['raisedBy']) {
  if (!value) return '—'
  if (typeof value === 'string') return value.slice(0, 8)
  return value.fullName
}

function paymentRef(value: PaymentDispute['paymentId']) {
  if (!value) return '—'
  if (typeof value === 'string') return value.slice(0, 8)
  return value.id.slice(0, 8)
}

export default function PaymentsPage() {
  const [topTab, setTopTab] = useState<TopTab>('payments')
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 50
  const totalPages = Math.ceil(total / limit)
  const [updating, setUpdating] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [recordingFor, setRecordingFor] = useState<Payment | null>(null)
  const [recordProvider, setRecordProvider] = useState<PaymentProvider>('MANUAL')
  const [recordReference, setRecordReference] = useState('')
  const [recordSaving, setRecordSaving] = useState(false)
  const [recordError, setRecordError] = useState('')
  const [releasing, setReleasing] = useState<Payment | null>(null)
  const [releaseMethod, setReleaseMethod] = useState<PaymentReleaseMethod | ''>('')
  const [geofencePassed, setGeofencePassed] = useState(false)
  const [travelTimePlausible, setTravelTimePlausible] = useState(false)
  const [releaseSaving, setReleaseSaving] = useState(false)
  const [releaseError, setReleaseError] = useState('')
  const [disputing, setDisputing] = useState<Payment | null>(null)
  const [disputeReasonCode, setDisputeReasonCode] = useState<DisputeReasonCode>('OTHER')
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeSaving, setDisputeSaving] = useState(false)
  const [disputeError, setDisputeError] = useState('')
  const [disputes, setDisputes] = useState<PaymentDispute[]>([])
  const [disputesLoading, setDisputesLoading] = useState(false)
  const [disputesError, setDisputesError] = useState('')
  const [disputeFilter, setDisputeFilter] = useState<DisputeFilter>('OPEN')
  const [disputePage, setDisputePage] = useState(1)
  const [disputeTotal, setDisputeTotal] = useState(0)
  const disputePages = Math.ceil(disputeTotal / limit)
  const [resolving, setResolving] = useState<PaymentDispute | null>(null)
  const [resolution, setResolution] = useState<DisputeResolution>('RELEASE')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [resolveSaving, setResolveSaving] = useState(false)
  const [resolveError, setResolveError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    listPayments({ page, limit: 50, status: statusFilter || undefined })
      .then((r) => {
        setPayments(r.data)
        setTotal(r.pagination.total)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load payments'))
      .finally(() => setLoading(false))
  }, [page, statusFilter])

  const loadDisputes = useCallback(() => {
    setDisputesLoading(true)
    setDisputesError('')
    listPaymentDisputes({ page: disputePage, limit: 50, status: disputeFilter })
      .then((r) => {
        setDisputes(r.data)
        setDisputeTotal(r.pagination.total)
      })
      .catch((err) => setDisputesError(err instanceof Error ? err.message : 'Failed to load disputes'))
      .finally(() => setDisputesLoading(false))
  }, [disputePage, disputeFilter])

  useEffect(() => {
    void Promise.resolve().then(load)
  }, [load])

  useEffect(() => {
    if (topTab === 'disputes') void Promise.resolve().then(loadDisputes)
  }, [topTab, loadDisputes])

  const openRecordModal = (payment: Payment) => {
    setRecordingFor(payment)
    setRecordProvider(payment.provider)
    setRecordReference(payment.providerReference || '')
    setRecordError('')
  }

  const closeRecordModal = () => {
    setRecordingFor(null)
    setRecordError('')
  }

  const handleRecordPayment = async () => {
    if (!recordingFor) return
    setRecordSaving(true)
    setRecordError('')
    try {
      const result = await recordManualPayment(recordingFor.id, {
        provider: recordProvider,
        providerReference: recordReference.trim() || undefined,
      })
      setPayments((prev) => prev.map((p) => (p.id === recordingFor.id ? result.data : p)))
      setRecordingFor(null)
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : 'Failed to record payment')
    } finally {
      setRecordSaving(false)
    }
  }

  const openReleaseModal = (payment: Payment) => {
    setReleasing(payment)
    setReleaseMethod('')
    setGeofencePassed(false)
    setTravelTimePlausible(false)
    setReleaseError('')
  }

  const handleRelease = async () => {
    if (!releasing || !releaseMethod) return
    setReleaseSaving(true)
    setReleaseError('')
    setUpdating(releasing.id)
    try {
      const result = await updatePaymentStatus(releasing.id, {
        status: 'RELEASED',
        releaseMethod,
        geofencePassed,
        travelTimePlausible,
      })
      setPayments((prev) => prev.map((p) => (p.id === releasing.id ? result.data : p)))
      setReleasing(null)
    } catch (err) {
      setReleaseError(err instanceof Error ? err.message : 'Failed to release payment')
      setUpdateError(err instanceof Error ? err.message : 'Failed to release payment')
    } finally {
      setReleaseSaving(false)
      setUpdating(null)
    }
  }

  const handleRaiseDispute = async () => {
    if (!disputing || !disputeReason.trim()) return
    setDisputeSaving(true)
    setDisputeError('')
    setUpdating(disputing.id)
    try {
      await raiseDispute(disputing.id, {
        reasonCode: disputeReasonCode,
        reason: disputeReason.trim(),
      })
      setDisputing(null)
      setDisputeReason('')
      load()
      if (topTab === 'disputes') loadDisputes()
    } catch (err) {
      setDisputeError(err instanceof Error ? err.message : 'Failed to raise dispute')
    } finally {
      setDisputeSaving(false)
      setUpdating(null)
    }
  }

  const handleResolve = async () => {
    if (!resolving) return
    setResolveSaving(true)
    setResolveError('')
    try {
      await resolveDispute(resolving.id, {
        resolution,
        resolutionNotes: resolutionNotes.trim() || undefined,
      })
      setResolving(null)
      setResolutionNotes('')
      loadDisputes()
      load()
    } catch (err) {
      setResolveError(err instanceof Error ? err.message : 'Failed to resolve dispute')
    } finally {
      setResolveSaving(false)
    }
  }

  function shipmentLabel(shipmentId: Payment['shipmentId']): string {
    if (typeof shipmentId === 'string') return shipmentId.slice(0, 8)
    return `${SHIPMENT_MODE_LABELS[shipmentId.mode]} · ${shipmentId.customerType}`
  }

  if (loading && payments.length === 0 && topTab === 'payments') return <Loading />
  if (error && payments.length === 0 && topTab === 'payments') return <Alert variant="error">{error}</Alert>

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Manage payment releases and disputes for completed shipments"
      />

      <PillTabs items={TOP_TABS} active={topTab} onChange={setTopTab} />

      {topTab === 'payments' ? (
        <div className="rounded-xl bg-white p-4 shadow">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Filter by status
              </label>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All statuses</option>
                <option value="HELD">Held</option>
                <option value="RELEASED">Released</option>
                <option value="DISPUTED">Disputed</option>
                <option value="REVERSED">Reversed</option>
              </Select>
            </div>
          </div>

          {updateError && (
            <Alert variant="error" className="mb-4">
              {updateError}
            </Alert>
          )}

          <TableWrapper>
            <Table>
              <TableHead>
                <TableRow>
                  <Th>Payment ID</Th>
                  <Th>Shipment</Th>
                  <Th>Payee</Th>
                  <Th>Gross</Th>
                  <Th>Commission</Th>
                  <Th>Net</Th>
                  <Th>Provider</Th>
                  <Th>Verification</Th>
                  <Th>Release method</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                  <Th>Actions</Th>
                </TableRow>
              </TableHead>
              <tbody>
                {payments.length === 0 ? (
                  <TableEmpty
                    colSpan={12}
                    message={
                      statusFilter ? `No payments with status "${statusFilter}"` : 'No payments yet'
                    }
                  />
                ) : (
                  payments.map((payment) => {
                    const isHeld = payment.status === 'HELD'
                    const canUpdate = isHeld && updating !== payment.id
                    return (
                      <TableRow key={payment.id}>
                        <Td className="font-mono text-xs">{payment.id.slice(0, 8)}</Td>
                        <Td className="text-sm">{shipmentLabel(payment.shipmentId)}</Td>
                        <Td className="text-sm">{payeeLabel(payment)}</Td>
                        <Td className="font-medium">{formatEtb(payment.grossAmountEtb)}</Td>
                        <Td className="text-sm text-slate-600">
                          {payment.commissionPctSnapshot}% · {formatEtb(payment.commissionAmountEtb)}
                        </Td>
                        <Td className="font-semibold text-emerald-700">
                          {formatEtb(payment.netAmountEtb)}
                        </Td>
                        <Td className="text-sm">
                          <div>{PAYMENT_PROVIDER_LABELS[payment.provider] || payment.provider}</div>
                          {payment.providerReference && (
                            <div className="text-xs text-slate-500">{payment.providerReference}</div>
                          )}
                          <button
                            type="button"
                            onClick={() => openRecordModal(payment)}
                            className="mt-1 text-xs font-medium text-korecha-primary hover:underline"
                          >
                            {payment.providerReference || payment.provider !== 'MANUAL'
                              ? 'Edit'
                              : 'Record payment'}
                          </button>
                        </Td>
                        <Td className="text-xs text-slate-600">
                          <div>Geofence: {verificationMark(payment.geofencePassed)}</div>
                          <div>Travel time: {verificationMark(payment.travelTimePlausible)}</div>
                        </Td>
                        <Td className="text-sm">
                          {payment.releaseMethod
                            ? RELEASE_METHOD_LABELS[payment.releaseMethod]
                            : '—'}
                        </Td>
                        <Td>
                          <Badge status={payment.status} />
                        </Td>
                        <Td className="text-sm text-slate-600">{formatDate(payment.createdAt)}</Td>
                        <Td>
                          {isHeld ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                disabled={!canUpdate}
                                onClick={() => openReleaseModal(payment)}
                              >
                                {updating === payment.id ? '...' : 'Release'}
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={!canUpdate}
                                onClick={() => {
                                  setDisputing(payment)
                                  setDisputeReasonCode('OTHER')
                                  setDisputeReason('')
                                  setDisputeError('')
                                }}
                              >
                                Raise dispute
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </Td>
                      </TableRow>
                    )
                  })
                )}
              </tbody>
            </Table>
          </TableWrapper>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-white p-4 shadow">
          <ChipTabs
            items={DISPUTE_TABS}
            active={disputeFilter}
            onChange={(key) => {
              setDisputeFilter(key)
              setDisputePage(1)
            }}
          />
          {disputesError && (
            <Alert variant="error" className="mb-4">
              {disputesError}
            </Alert>
          )}
          {disputesLoading && disputes.length === 0 ? (
            <Loading />
          ) : (
            <TableWrapper>
              <Table>
                <TableHead>
                  <TableRow>
                    <Th>Payment</Th>
                    <Th>Reason</Th>
                    <Th>Raised by</Th>
                    <Th>Status</Th>
                    <Th>Created</Th>
                    <Th>Actions</Th>
                  </TableRow>
                </TableHead>
                <tbody>
                  {disputes.length === 0 ? (
                    <TableEmpty colSpan={6} message="No disputes in this filter" />
                  ) : (
                    disputes.map((dispute) => (
                      <TableRow key={dispute.id}>
                        <Td className="font-mono text-xs">{paymentRef(dispute.paymentId)}</Td>
                        <Td>
                          <p className="font-medium">
                            {DISPUTE_REASON_LABELS[dispute.reasonCode] || dispute.reasonCode}
                          </p>
                          <p className="text-xs text-slate-500">{dispute.reason}</p>
                        </Td>
                        <Td className="text-sm">{personName(dispute.raisedBy)}</Td>
                        <Td>
                          <Badge status={dispute.status} />
                        </Td>
                        <Td className="text-sm text-slate-600">{formatDate(dispute.createdAt)}</Td>
                        <Td>
                          {dispute.status === 'OPEN' ? (
                            <Button
                              size="sm"
                              onClick={() => {
                                setResolving(dispute)
                                setResolution('RELEASE')
                                setResolutionNotes('')
                                setResolveError('')
                              }}
                            >
                              Resolve
                            </Button>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </Td>
                      </TableRow>
                    ))
                  )}
                </tbody>
              </Table>
            </TableWrapper>
          )}
          {disputePages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <Button
                variant="secondary"
                size="sm"
                disabled={disputePage === 1}
                onClick={() => setDisputePage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-600">
                Page {disputePage} of {disputePages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={disputePage === disputePages}
                onClick={() => setDisputePage((p) => Math.min(disputePages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {recordingFor && (
        <Modal title="Record payment" onClose={closeRecordModal}>
          <p className="text-sm text-slate-600">
            Record a payment that happened out-of-band (no gateway integration). This updates the
            existing payment for this shipment — it never creates a duplicate.
          </p>
          {recordError && (
            <div className="mt-4">
              <Alert variant="error">{recordError}</Alert>
            </div>
          )}
          <div className="mt-4 space-y-4">
            <Field label="Provider">
              <Select
                value={recordProvider}
                onChange={(e) => setRecordProvider(e.target.value as PaymentProvider)}
              >
                {PAYMENT_PROVIDER_OPTIONS.map((provider) => (
                  <option key={provider} value={provider}>
                    {PAYMENT_PROVIDER_LABELS[provider]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Reference (optional)">
              <Input
                value={recordReference}
                onChange={(e) => setRecordReference(e.target.value)}
                placeholder="Transaction reference"
              />
            </Field>
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={closeRecordModal} disabled={recordSaving}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={recordSaving}>
              {recordSaving ? 'Saving...' : 'Save'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {releasing && (
        <Modal title="Release payment" onClose={() => setReleasing(null)}>
          <p className="text-sm text-slate-600">
            Choose how this escrow is being released. Verification flags are optional.
          </p>
          {releaseError && (
            <div className="mt-4">
              <Alert variant="error">{releaseError}</Alert>
            </div>
          )}
          <div className="mt-4 space-y-4">
            <Field label="Release method">
              <Select
                value={releaseMethod}
                onChange={(e) => setReleaseMethod(e.target.value as PaymentReleaseMethod | '')}
                required
              >
                <option value="">Select method</option>
                {RELEASE_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {RELEASE_METHOD_LABELS[method]}
                  </option>
                ))}
              </Select>
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={geofencePassed}
                onChange={(e) => setGeofencePassed(e.target.checked)}
              />
              Geofence passed
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={travelTimePlausible}
                onChange={(e) => setTravelTimePlausible(e.target.checked)}
              />
              Travel time plausible
            </label>
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setReleasing(null)} disabled={releaseSaving}>
              Cancel
            </Button>
            <Button onClick={handleRelease} disabled={releaseSaving || !releaseMethod}>
              {releaseSaving ? 'Releasing...' : 'Release'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {disputing && (
        <Modal title="Raise dispute" onClose={() => setDisputing(null)}>
          {disputeError && (
            <div className="mb-4">
              <Alert variant="error">{disputeError}</Alert>
            </div>
          )}
          <div className="space-y-4">
            <Field label="Reason code">
              <Select
                value={disputeReasonCode}
                onChange={(e) => setDisputeReasonCode(e.target.value as DisputeReasonCode)}
              >
                {DISPUTE_REASONS.map((code) => (
                  <option key={code} value={code}>
                    {DISPUTE_REASON_LABELS[code]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Reason">
              <Textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                required
                rows={3}
              />
            </Field>
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setDisputing(null)} disabled={disputeSaving}>
              Cancel
            </Button>
            <Button onClick={handleRaiseDispute} disabled={disputeSaving || !disputeReason.trim()}>
              {disputeSaving ? 'Submitting...' : 'Raise dispute'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {resolving && (
        <Modal title="Resolve dispute" onClose={() => setResolving(null)}>
          {resolveError && (
            <div className="mb-4">
              <Alert variant="error">{resolveError}</Alert>
            </div>
          )}
          <div className="space-y-4">
            <Field label="Resolution">
              <Select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as DisputeResolution)}
              >
                <option value="RELEASE">Release</option>
                <option value="REVERSE">Reverse</option>
              </Select>
            </Field>
            <Field label="Notes (optional)">
              <Textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3}
              />
            </Field>
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setResolving(null)} disabled={resolveSaving}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={resolveSaving}>
              {resolveSaving ? 'Resolving...' : 'Resolve'}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  )
}
