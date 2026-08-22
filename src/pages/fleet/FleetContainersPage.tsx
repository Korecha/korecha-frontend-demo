import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listFleetContainerStatus } from '../../api/fleet'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
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
import type { Job, Shipment } from '../../types'

function jobOf(shipment: Shipment): Job | null {
  if (shipment.job && typeof shipment.job === 'object') return shipment.job
  if (typeof shipment.jobId === 'object' && shipment.jobId) return shipment.jobId
  return null
}

// KAN-43/71: view-only tab — no create/edit/delete controls, per ticket requirement.
export function FleetContainersPage() {
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
    listFleetContainerStatus()
      .then((r) => setShipments(r.data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load container status'),
      )
      .finally(() => setLoading(false))
  }, [approved])

  if (!approved) {
    return (
      <div>
        <PageHeader title="Container Status" />
        <Alert variant="warning" className="mt-6">
          Available after your fleet account is approved.
        </Alert>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Container Status"
        description="View-only status of containers you are currently trucking for your linked shipping line."
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
              <Th>Container</Th>
              <Th>Container status</Th>
              <Th>Shipment</Th>
              <Th>Legs</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={4} message="Loading..." />
            ) : shipments.length === 0 ? (
              <TableEmpty colSpan={4} message="No containers currently linked to your shipments." />
            ) : (
              shipments.map((shipment) => {
                const job = jobOf(shipment)
                return (
                  <TableRow key={shipment.id}>
                    <Td className="font-semibold">{shipment.container?.containerNumber || '—'}</Td>
                    <Td>
                      {shipment.container ? <Badge status={shipment.container.status} /> : '—'}
                    </Td>
                    <Td>
                      <Link
                        to={`/fleet/shipments/${shipment.id}`}
                        className="text-sm font-semibold text-korecha-primary hover:underline"
                      >
                        {job ? `${refName(job.itemTypeId)} × ${job.quantity}` : 'Shipment'}
                      </Link>
                      <p className="text-xs text-slate-500">
                        <Badge status={shipment.status} />
                      </p>
                    </Td>
                    <Td>{shipment.legs?.length || 0}</Td>
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
