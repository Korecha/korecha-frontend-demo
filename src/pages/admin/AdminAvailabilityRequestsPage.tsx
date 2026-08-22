import { useEffect, useState, type FormEvent } from 'react'
import { listAvailabilityRequests, reviewAvailabilityRequest } from '../../api/admin'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, Textarea } from '../../components/ui/Input'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import {
  Table,
  TableEmpty,
  TableHead,
  TableRow,
  TableWrapper,
  Td,
  Th,
} from '../../components/ui/Table'
import type { TruckOwnerProfile } from '../../types'

export function AdminAvailabilityRequestsPage() {
  const [owners, setOwners] = useState<TruckOwnerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approving, setApproving] = useState<TruckOwnerProfile | null>(null)
  const [rejecting, setRejecting] = useState<TruckOwnerProfile | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    listAvailabilityRequests('PENDING')
      .then((res) => setOwners(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load requests'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let active = true
    void Promise.resolve()
      .then(() => {
        setLoading(true)
        return listAvailabilityRequests('PENDING')
      })
      .then((res) => {
        if (active) setOwners(res.data)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load requests')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const approve = async () => {
    if (!approving) return
    setSubmitting(true)
    setError('')
    try {
      await reviewAvailabilityRequest(approving.id, { status: 'APPROVED' })
      setApproving(null)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve request')
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
      await reviewAvailabilityRequest(rejecting.id, {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
      })
      setRejecting(null)
      setRejectionReason('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Availability Requests"
        description="Truck owner requests to be granted Unimodal availability posting (admin only)"
      />
      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <TableWrapper>
        <Table>
          <TableHead>
            <tr>
              <Th>Owner</Th>
              <Th>Contact</Th>
              <Th>Requested</Th>
              <Th>Actions</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={4} message="Loading..." />
            ) : owners.length === 0 ? (
              <TableEmpty colSpan={4} message="No pending availability requests" />
            ) : (
              owners.map((owner) => (
                <TableRow key={owner.id}>
                  <Td className="font-semibold">
                    {owner.displayName || owner.user?.fullName || '—'}
                  </Td>
                  <Td>
                    <div>{owner.user?.fullName}</div>
                    <div className="text-xs text-slate-500">{owner.user?.email}</div>
                  </Td>
                  <Td>
                    {owner.availabilityRequestedAt
                      ? new Date(owner.availabilityRequestedAt).toLocaleDateString()
                      : '—'}
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setApproving(owner)}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setRejecting(owner)
                          setRejectionReason('')
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  </Td>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </TableWrapper>

      {approving && (
        <Modal title="Approve availability request" onClose={() => setApproving(null)}>
          <p className="text-sm text-slate-600">
            Grant availability posting to{' '}
            <span className="font-semibold text-slate-900">
              {approving.displayName || approving.user?.fullName}
            </span>
            ?
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
        <Modal title="Reject availability request" onClose={() => setRejecting(null)}>
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
