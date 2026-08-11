import { useEffect, useState, type FormEvent } from 'react'
import {
  listTruckOwners,
  reviewTruckOwner,
  setTruckOwnerCanPostAvailability,
} from '../../api/admin'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Field, Textarea } from '../../components/ui/Input'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import { TRUCK_OWNER_TYPE_LABELS } from '../../utils/format'
import type { ApprovalStatus, TruckOwnerProfile } from '../../types'

const STATUS_TABS: Array<ApprovalStatus | 'ALL'> = ['PENDING', 'APPROVED', 'REJECTED', 'ALL']

export function TruckOwnersPage() {
  const [owners, setOwners] = useState<TruckOwnerProfile[]>([])
  const [status, setStatus] = useState<ApprovalStatus | 'ALL'>('PENDING')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approving, setApproving] = useState<TruckOwnerProfile | null>(null)
  const [rejecting, setRejecting] = useState<TruckOwnerProfile | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    listTruckOwners(status === 'ALL' ? undefined : status)
      .then((res) => setOwners(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let active = true
    void Promise.resolve()
      .then(() => {
        setLoading(true)
        return listTruckOwners(status === 'ALL' ? undefined : status)
      })
      .then((res) => {
        if (active) setOwners(res.data)
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
      await reviewTruckOwner(approving.id, { status: 'APPROVED' })
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
      await reviewTruckOwner(rejecting.id, {
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

  const toggleAvailability = async (owner: TruckOwnerProfile) => {
    setTogglingId(owner.id)
    setError('')
    try {
      await setTruckOwnerCanPostAvailability(owner.id, !owner.canPostAvailability)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update availability flag')
    } finally {
      setTogglingId(null)
    }
  }

  const fleetLabel = (owner: TruckOwnerProfile) => {
    if (!owner.fleetManagerId) return 'Independent'
    if (typeof owner.fleetManagerId === 'string') return 'Affiliated'
    return owner.fleetManagerId.fleetName || 'Affiliated'
  }

  return (
    <div>
      <PageHeader
        title="Truck Owners"
        description="Review truck owner applications and grant Unimodal availability posting (admin only)"
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
            {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <TableWrapper>
        <Table>
          <TableHead>
            <tr>
              <Th>Owner</Th>
              <Th>Type</Th>
              <Th>Contact</Th>
              <Th>Affiliation</Th>
              <Th>Status</Th>
              <Th>Can post availability</Th>
              <Th>Actions</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={7} message="Loading..." />
            ) : owners.length === 0 ? (
              <TableEmpty colSpan={7} message="No truck owners for this filter" />
            ) : (
              owners.map((owner) => (
                <TableRow key={owner.id}>
                  <Td className="font-semibold">
                    {owner.displayName || owner.user?.fullName || '—'}
                  </Td>
                  <Td>{TRUCK_OWNER_TYPE_LABELS[owner.ownerType] || owner.ownerType}</Td>
                  <Td>
                    <div>{owner.user?.fullName}</div>
                    <div className="text-xs text-slate-500">{owner.user?.email}</div>
                  </Td>
                  <Td>
                    {owner.isSelfPaired ? (
                      <div>
                        <div className="font-medium text-slate-900">Self-owned (Fleet Manager)</div>
                        <div className="text-xs text-slate-500">{fleetLabel(owner)}</div>
                      </div>
                    ) : (
                      fleetLabel(owner)
                    )}
                  </Td>
                  <Td>
                    <Badge status={owner.status} />
                  </Td>
                  <Td>
                    {owner.isSelfPaired ? (
                      <span className="text-xs text-slate-500">
                        Posts availability via its own fleet manager account
                      </span>
                    ) : owner.status === 'APPROVED' ? (
                      <Button
                        size="sm"
                        variant={owner.canPostAvailability ? 'secondary' : 'primary'}
                        disabled={togglingId === owner.id}
                        onClick={() => toggleAvailability(owner)}
                      >
                        {togglingId === owner.id
                          ? 'Updating...'
                          : owner.canPostAvailability
                            ? 'Revoke'
                            : 'Grant'}
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-500">
                        {owner.canPostAvailability ? 'Yes' : 'No (default)'}
                      </span>
                    )}
                  </Td>
                  <Td>
                    {owner.isSelfPaired ? (
                      <span className="text-xs text-slate-500">Follows fleet manager review</span>
                    ) : owner.status === 'PENDING' ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setApproving(owner)}>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setRejecting(owner)
                            setRejectionReason(owner.rejectionReason || '')
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">
                        {owner.status === 'REJECTED'
                          ? owner.rejectionReason || 'Rejected'
                          : 'Reviewed'}
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
        <Modal title="Approve truck owner" onClose={() => setApproving(null)}>
          <p className="text-sm text-slate-600">
            Approve{' '}
            <span className="font-semibold text-slate-900">
              {approving.displayName || approving.user?.fullName}
            </span>
            ? Availability posting stays off until you explicitly grant it.
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
        <Modal title="Reject truck owner" onClose={() => setRejecting(null)}>
          <form onSubmit={reject} className="space-y-4">
            <Field label="Rejection reason">
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                required
              />
            </Field>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setRejecting(null)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" disabled={submitting}>
                {submitting ? 'Rejecting...' : 'Reject'}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  )
}
