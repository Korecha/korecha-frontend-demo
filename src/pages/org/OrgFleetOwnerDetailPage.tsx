import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getFleetOwnerSummary, listFleetOwnerShipments } from '../../api/org'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Loading } from '../../components/ui/Loading'
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
import type { FleetOwnerShipment, FleetOwnerSummary, Job } from '../../types'
import { formatDate, formatEtb } from '../../utils/format'

const SHIPMENTS_PAGE_SIZE = 20

/** jobId is a partial Job (see FleetOwnerShipment) — assignedDriverId/assignedTruckId are only
 * populated with fullName/plateNumber, not full User/Truck docs. */
function driverName(value: Job['assignedDriverId']): string {
  if (value && typeof value === 'object' && 'fullName' in value) return value.fullName
  return '—'
}

function truckPlate(value: Job['assignedTruckId']): string {
  if (value && typeof value === 'object' && 'plateNumber' in value) return value.plateNumber
  return '—'
}

/** KAN-98: drill-in view for one fleet owner — summary stats plus paginated shipment history. */
export function OrgFleetOwnerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [summary, setSummary] = useState<FleetOwnerSummary | null>(null)
  const [shipments, setShipments] = useState<FleetOwnerShipment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Guard registered before any early return, per the react-hooks/set-state-in-effect rule —
    // setLoading(true) is never called synchronously in the effect body; loading starts true and
    // the "cancelled" flag prevents a stale response (e.g. from a fast page click) from
    // clobbering a newer one once it resolves.
    let cancelled = false
    if (!id)
      return () => {
        cancelled = true
      }
    Promise.all([
      getFleetOwnerSummary(id),
      listFleetOwnerShipments(id, { page, limit: SHIPMENTS_PAGE_SIZE }),
    ])
      .then(([summaryRes, shipmentsRes]) => {
        if (cancelled) return
        setSummary(summaryRes.data)
        setShipments(shipmentsRes.data)
        setTotal(shipmentsRes.pagination.total)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load fleet owner')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, page])

  if (loading && !summary) return <Loading />
  if (error) return <Alert>{error}</Alert>
  if (!summary) return <Alert>Fleet owner not found</Alert>

  const pageCount = Math.max(1, Math.ceil(total / SHIPMENTS_PAGE_SIZE))

  return (
    <div className="space-y-6">
      <PageHeader
        title={summary.fleetName}
        description="Fleet owner monitoring — shipment history, earnings, and ratings"
      />
      <Link
        to="/org/fleet-owners"
        className="text-sm font-medium text-korecha-primary hover:underline"
      >
        ← Back to Fleet Owners
      </Link>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-korecha-muted">Status</p>
          <div className="mt-2">
            <Badge status={summary.status} />
          </div>
        </Card>
        <Card>
          <p className="text-sm text-korecha-muted">Trucks / Drivers</p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {summary.activeTruckCount} / {summary.activeDriverCount}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-korecha-muted">Completion Rate</p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {summary.completionRate == null ? '—' : `${summary.completionRate}%`}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {summary.completedShipments} of {summary.totalShipments} shipments
          </p>
        </Card>
        <Card>
          <p className="text-sm text-korecha-muted">Net Earnings</p>
          <p className="mt-2 text-xl font-bold text-korecha-primary">
            {formatEtb(summary.netEarningsEtb)}
          </p>
        </Card>
      </div>

      <Card>
        <p className="text-sm text-korecha-muted">Average Driver Rating</p>
        <p className="mt-2 text-xl font-bold text-slate-900">
          {summary.averageRating == null
            ? 'No ratings yet'
            : `${summary.averageRating} ★ (${summary.ratingCount} rating${summary.ratingCount === 1 ? '' : 's'})`}
        </p>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Shipment History</h2>
        <TableWrapper>
          <Table>
            <TableHead>
              <tr>
                <Th>Route</Th>
                <Th>Driver</Th>
                <Th>Truck</Th>
                <Th>Status</Th>
                <Th>Amount</Th>
                <Th>Delivered</Th>
              </tr>
            </TableHead>
            <tbody>
              {loading ? (
                <TableEmpty colSpan={6} message="Loading..." />
              ) : shipments.length === 0 ? (
                <TableEmpty colSpan={6} message="No shipments yet." />
              ) : (
                shipments.map((s) => (
                  <TableRow key={s.id}>
                    <Td>
                      {s.jobId?.pickup?.label || '—'} → {s.jobId?.delivery?.label || '—'}
                    </Td>
                    <Td>{driverName(s.jobId?.assignedDriverId)}</Td>
                    <Td>{truckPlate(s.jobId?.assignedTruckId)}</Td>
                    <Td>
                      <Badge status={s.status} />
                    </Td>
                    <Td>
                      {s.jobId?.pricingQuote ? formatEtb(s.jobId.pricingQuote.totalEtb) : '—'}
                    </Td>
                    <Td>{formatDate(s.jobId?.deliveredAt)}</Td>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </TableWrapper>
        {pageCount > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-korecha-muted">
              Page {page} of {pageCount} ({total} shipments)
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={page >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
