import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listFleetOwners } from '../../api/org'
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
import type { FleetOwnerSummary } from '../../types'
import { formatEtb } from '../../utils/format'

/** KAN-98: read-only monitoring of fleet owners this org has approved — no edit/suspend actions here. */
export function OrgFleetMonitoringPage() {
  const [fleetOwners, setFleetOwners] = useState<FleetOwnerSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listFleetOwners()
      .then((r) => setFleetOwners(r.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load fleet owners'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader
        title="Fleet Owner Monitoring"
        description="Track shipment activity, earnings, and ratings for fleet owners under your organization"
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
              <Th>Fleet</Th>
              <Th>Status</Th>
              <Th>Trucks</Th>
              <Th>Drivers</Th>
              <Th>Shipments</Th>
              <Th>Completion</Th>
              <Th>Net Earnings</Th>
              <Th>Rating</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={8} message="Loading..." />
            ) : fleetOwners.length === 0 ? (
              <TableEmpty
                colSpan={8}
                message="No fleet owners approved under this organization yet."
              />
            ) : (
              fleetOwners.map((f) => (
                <TableRow key={f.id}>
                  <Td className="font-semibold">
                    <Link
                      to={`/org/fleet-owners/${f.id}`}
                      className="text-korecha-primary hover:underline"
                    >
                      {f.fleetName}
                    </Link>
                  </Td>
                  <Td>
                    <Badge status={f.status} />
                  </Td>
                  <Td>{f.activeTruckCount}</Td>
                  <Td>{f.activeDriverCount}</Td>
                  <Td>
                    {f.completedShipments} / {f.totalShipments}
                  </Td>
                  <Td>{f.completionRate == null ? '—' : `${f.completionRate}%`}</Td>
                  <Td>{formatEtb(f.netEarningsEtb)}</Td>
                  <Td>
                    {f.averageRating == null ? '—' : `${f.averageRating} ★ (${f.ratingCount})`}
                  </Td>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </TableWrapper>
    </div>
  )
}
