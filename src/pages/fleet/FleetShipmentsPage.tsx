import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listFleetShipments } from '../../api/fleet'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import { refName } from '../../utils/format'
import type { Job, Shipment } from '../../types'

function jobOf(shipment: Shipment): Job | null {
  if (shipment.job && typeof shipment.job === 'object') return shipment.job
  if (typeof shipment.jobId === 'object' && shipment.jobId) return shipment.jobId
  return null
}

export function FleetShipmentsPage() {
  const { memberProfile } = useAuth()
  const approved = isApproved(memberProfile)
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!approved) {
      setLoading(false)
      return
    }
    listFleetShipments()
      .then((r) => setShipments(r.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load shipments'))
      .finally(() => setLoading(false))
  }, [approved])

  if (!approved) {
    return (
      <div>
        <PageHeader title="Shipments" />
        <Alert variant="warning" className="mt-6">Available after your fleet account is approved.</Alert>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Shipments" description="Assigned loads. Add extra legs after assignment." />
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      <TableWrapper>
        <Table>
          <TableHead>
            <tr>
              <Th>Cargo</Th>
              <Th>Legs</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={4} message="Loading..." />
            ) : shipments.length === 0 ? (
              <TableEmpty colSpan={4} message="No assigned shipments yet." />
            ) : (
              shipments.map((shipment) => {
                const job = jobOf(shipment)
                return (
                  <TableRow key={shipment.id}>
                    <Td>
                      {job ? `${refName(job.itemTypeId)} × ${job.quantity}` : 'Shipment'}
                      {job && (
                        <p className="text-xs text-slate-500">
                          {job.pickup.label} → {job.delivery.label}
                        </p>
                      )}
                    </Td>
                    <Td>{shipment.legs?.length || 1}</Td>
                    <Td><Badge status={shipment.status} /></Td>
                    <Td>
                      <Link to={`/fleet/shipments/${shipment.id}`} className="text-sm font-semibold text-korecha-primary hover:underline">
                        Manage
                      </Link>
                    </Td>
                  </TableRow>
                )
              })
            )}
          </tbody>
        </Table>
      </TableWrapper>
    </div>
  )
}
