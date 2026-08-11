import { useEffect, useState, type FormEvent } from 'react'
import {
  listCorporateCustomerApplications,
  reviewCorporateCustomerApplication,
} from '../../api/admin'
import { ApplicationQueueTabs } from '../../components/admin/ApplicationQueueTabs'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, Select, Textarea } from '../../components/ui/Input'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import { CORPORATE_TIER_LABELS } from '../../utils/format'
import { fileUrl } from '../../utils/fileUrl'
import type { ApprovalStatus, CorporateCustomerProfile, CorporateTier } from '../../types'

const STATUS_TABS: ApprovalStatus[] = ['PENDING', 'APPROVED', 'REJECTED']

export function CorporateApplicationsPage() {
  const [customers, setCustomers] = useState<CorporateCustomerProfile[]>([])
  const [status, setStatus] = useState<ApprovalStatus>('PENDING')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approving, setApproving] = useState<CorporateCustomerProfile | null>(null)
  const [rejecting, setRejecting] = useState<CorporateCustomerProfile | null>(null)
  const [tier, setTier] = useState<CorporateTier>('STANDARD')
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    listCorporateCustomerApplications(status)
      .then((res) => setCustomers(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let active = true
    void Promise.resolve()
      .then(() => {
        setLoading(true)
        return listCorporateCustomerApplications(status)
      })
      .then((res) => {
        if (active) setCustomers(res.data)
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

  const openApprove = (customer: CorporateCustomerProfile) => {
    setError('')
    setApproving(customer)
    setTier(customer.tier || 'STANDARD')
  }

  const approve = async (e: FormEvent) => {
    e.preventDefault()
    if (!approving) return
    setSubmitting(true)
    setError('')
    try {
      await reviewCorporateCustomerApplication(approving.id, {
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
      await reviewCorporateCustomerApplication(rejecting.id, {
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
        description="Corporate customer KYC queue — separate from importer/exporter approvals"
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
              <Th>TIN</Th>
              <Th>Tier</Th>
              <Th>Documents</Th>
              <Th>Actions</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={6} message="Loading..." />
            ) : customers.length === 0 ? (
              <TableEmpty colSpan={6} message={`No ${status.toLowerCase()} corporate applications`} />
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <Td className="font-semibold">{customer.companyName}</Td>
                  <Td>
                    <div>{customer.user?.fullName}</div>
                    <div className="text-xs text-slate-500">{customer.user?.email}</div>
                  </Td>
                  <Td>{customer.tinNumber || '—'}</Td>
                  <Td>{CORPORATE_TIER_LABELS[customer.tier] || customer.tier}</Td>
                  <Td>
                    {customer.businessRegistrationFile ? (
                      <a
                        href={fileUrl(customer.businessRegistrationFile)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-korecha-primary hover:underline"
                      >
                        Business registration
                      </a>
                    ) : (
                      '—'
                    )}
                  </Td>
                  <Td>
                    {status === 'PENDING' ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => openApprove(customer)}>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setRejecting(customer)
                            setRejectionReason(customer.rejectionReason || '')
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">
                        {status === 'REJECTED' ? customer.rejectionReason || 'Rejected' : 'Reviewed'}
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
        <Modal title="Approve corporate customer" onClose={() => setApproving(null)}>
          <form onSubmit={approve} className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <p className="text-sm font-semibold text-slate-900">{approving.companyName}</p>
              <p className="mt-1 text-xs text-slate-600">
                Set matching priority tier. Tier is stored for the matching engine; it does not change portal access.
              </p>
            </div>
            <Field label="Tier">
              <Select value={tier} onChange={(e) => setTier(e.target.value as CorporateTier)}>
                {(Object.keys(CORPORATE_TIER_LABELS) as CorporateTier[]).map((value) => (
                  <option key={value} value={value}>
                    {CORPORATE_TIER_LABELS[value]}
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
        <Modal title="Reject corporate application" onClose={() => setRejecting(null)}>
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
