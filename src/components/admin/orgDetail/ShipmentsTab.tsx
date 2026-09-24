import { useEffect, useState } from 'react'
import { listOrgShipments } from '../../../api/admin'
import { Alert } from '../../ui/Alert'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { ChipTabs } from '../../ui/Tabs'
import {
  Table,
  TableEmpty,
  TableHead,
  TableRow,
  TableWrapper,
  Td,
  Th,
} from '../../ui/Table'
import type { Job, Shipment, ShipmentStatus } from '../../../types'
import { formatDate } from '../../../utils/format'

type StatusFilter = 'ALL' | ShipmentStatus

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ASSIGNED', label: 'ASSIGNED' },
  { key: 'IN_TRANSIT', label: 'IN_TRANSIT' },
  { key: 'PENDING_APPROVAL', label: 'PENDING_APPROVAL' },
  { key: 'COMPLETED', label: 'COMPLETED' },
  { key: 'CANCELLED', label: 'CANCELLED' },
]

function jobOf(shipment: Shipment): Job | null {
  if (shipment.job && typeof shipment.job === 'object') return shipment.job
  if (typeof shipment.jobId === 'object' && shipment.jobId) return shipment.jobId
  return null
}

export function ShipmentsTab({ orgId }: { orgId: string }) {
  const [rows, setRows] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(20)
  const [status, setStatus] = useState<StatusFilter>('ALL')

  useEffect(() => {
    let active = true
    void Promise.resolve()
      .then(() => {
        setLoading(true)
        return listOrgShipments(orgId, {
          page,
          status: status === 'ALL' ? undefined : status,
        })
      })
      .then((res) => {
        if (!active) return
        setRows(res.data)
        setTotal(res.meta.total)
        setLimit(res.meta.limit)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load shipments')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [orgId, page, status])

  const totalPages = Math.max(1, Math.ceil(total / (limit || 1)))

  return (
    <div className="mt-6">
      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}
      <ChipTabs
        items={STATUS_FILTERS}
        active={status}
        onChange={(key) => {
          setStatus(key)
          setPage(1)
        }}
      />
      <TableWrapper>
        <Table>
          <TableHead>
            <tr>
              <Th>Created</Th>
              <Th>Job</Th>
              <Th>Mode</Th>
              <Th>Container</Th>
              <Th>Legs</Th>
              <Th>Status</Th>
              <Th>Completed</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={7} message="Loading..." />
            ) : rows.length === 0 ? (
              <TableEmpty colSpan={7} message="No shipments found" />
            ) : (
              rows.map((shipment) => {
                const job = jobOf(shipment)
                return (
                  <TableRow key={shipment.id}>
                    <Td>{formatDate(shipment.createdAt)}</Td>
                    <Td>
                      {job ? `${job.pickup?.label || '—'} → ${job.delivery?.label || '—'}` : '—'}
                    </Td>
                    <Td>
                      <Badge status={shipment.mode} />
                    </Td>
                    <Td className="font-mono text-xs">
                      {shipment.container?.containerNumber || '—'}
                    </Td>
                    <Td>{shipment.legs?.length ?? 0}</Td>
                    <Td>
                      <Badge status={shipment.status} />
                    </Td>
                    <Td>{formatDate(shipment.completedAt)}</Td>
                  </TableRow>
                )
              })
            )}
          </tbody>
        </Table>
      </TableWrapper>
      {total > limit && (
        <div className="mt-4 flex items-center justify-between">
          <Button variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Prev
          </Button>
          <span className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
