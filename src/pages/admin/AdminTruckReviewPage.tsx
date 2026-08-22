import { useEffect, useState, type FormEvent } from 'react'
import { listPendingTrucks, reviewTruck } from '../../api/admin'
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
import { refName } from '../../utils/format'
import type { Truck } from '../../types'

export function AdminTruckReviewPage() {
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approving, setApproving] = useState<Truck | null>(null)
  const [rejecting, setRejecting] = useState<Truck | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    listPendingTrucks()
      .then((res) => setTrucks(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load trucks'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let active = true
    void Promise.resolve()
      .then(() => {
        setLoading(true)
        return listPendingTrucks()
      })
      .then((res) => {
        if (active) setTrucks(res.data)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load trucks')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const ownerLabel = (truck: Truck) => {
    if (!truck.truckOwnerId) return '—'
    if (typeof truck.truckOwnerId === 'string') return truck.truckOwnerId
    return truck.truckOwnerId.displayName || '—'
  }

  const approve = async () => {
    if (!approving) return
    setSubmitting(true)
    setError('')
    try {
      await reviewTruck(approving.id, { status: 'APPROVED' })
      setApproving(null)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve truck')
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
      await reviewTruck(rejecting.id, {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
      })
      setRejecting(null)
      setRejectionReason('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject truck')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Truck Review"
        description="Approve or reject trucks registered by independent truck owners (admin only)"
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
              <Th>Plate</Th>
              <Th>Type</Th>
              <Th>Owner</Th>
              <Th>Registered</Th>
              <Th>Actions</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={5} message="Loading..." />
            ) : trucks.length === 0 ? (
              <TableEmpty colSpan={5} message="No pending trucks to review" />
            ) : (
              trucks.map((truck) => (
                <TableRow key={truck.id}>
                  <Td className="font-semibold">{truck.plateNumber}</Td>
                  <Td>{refName(truck.truckTypeId)}</Td>
                  <Td>{ownerLabel(truck)}</Td>
                  <Td>{truck.createdAt ? new Date(truck.createdAt).toLocaleDateString() : '—'}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setApproving(truck)}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setRejecting(truck)
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
        <Modal title="Approve truck" onClose={() => setApproving(null)}>
          <p className="text-sm text-slate-600">
            Approve truck{' '}
            <span className="font-semibold text-slate-900">{approving.plateNumber}</span>?
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
        <Modal title="Reject truck" onClose={() => setRejecting(null)}>
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
