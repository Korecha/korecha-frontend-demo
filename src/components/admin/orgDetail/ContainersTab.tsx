import { useEffect, useState } from 'react'
import { listContainers } from '../../../api/admin'
import { Alert } from '../../ui/Alert'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import {
  Table,
  TableEmpty,
  TableHead,
  TableRow,
  TableWrapper,
  Td,
  Th,
} from '../../ui/Table'
import type { Container } from '../../../types'
import { formatDate, isDemurrageRisk, SIZE_LABELS } from '../../../utils/format'

export function ContainersTab({ orgId }: { orgId: string }) {
  const [rows, setRows] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(20)

  useEffect(() => {
    let active = true
    void Promise.resolve()
      .then(() => {
        setLoading(true)
        return listContainers({ orgId, page })
      })
      .then((res) => {
        if (!active) return
        setRows(res.data)
        setTotal(res.meta.total)
        setLimit(res.meta.limit)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load containers')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [orgId, page])

  const totalPages = Math.max(1, Math.ceil(total / (limit || 1)))

  return (
    <div className="mt-6">
      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}
      <TableWrapper>
        <Table>
          <TableHead>
            <tr>
              <Th>Number</Th>
              <Th>Size</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Location</Th>
              <Th>Last Free Day</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={6} message="Loading..." />
            ) : rows.length === 0 ? (
              <TableEmpty colSpan={6} message="No containers found" />
            ) : (
              rows.map((c) => (
                <TableRow key={c.id}>
                  <Td className="font-mono font-semibold text-slate-900">{c.containerNumber}</Td>
                  <Td>{SIZE_LABELS[c.size] || c.size}</Td>
                  <Td>{c.type}</Td>
                  <Td>
                    <Badge status={c.status} />
                  </Td>
                  <Td>{c.location?.label ?? '—'}</Td>
                  <Td className={isDemurrageRisk(c.lastFreeDay) ? 'font-semibold text-amber-600' : ''}>
                    {formatDate(c.lastFreeDay)}
                  </Td>
                </TableRow>
              ))
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
