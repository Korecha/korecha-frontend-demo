import { useEffect, useState } from 'react'
import { listOrgLoadPostings } from '../../../api/admin'
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
import type { LoadPosting } from '../../../types'
import { formatDate, refName } from '../../../utils/format'

function linkedJobLabel(posting: LoadPosting) {
  const linked = posting.linkedJobId
  if (!linked) return '—'
  if (typeof linked === 'string') return linked
  return linked.id
}

export function LoadPostingsTab({ orgId }: { orgId: string }) {
  const [rows, setRows] = useState<LoadPosting[]>([])
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
        return listOrgLoadPostings(orgId, { page })
      })
      .then((res) => {
        if (!active) return
        setRows(res.data)
        setTotal(res.meta.total)
        setLimit(res.meta.limit)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load postings')
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
              <Th>Created</Th>
              <Th>Item</Th>
              <Th>Qty</Th>
              <Th>Pickup → Delivery</Th>
              <Th>Mode</Th>
              <Th>Matching</Th>
              <Th>Status</Th>
              <Th>Linked job</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={8} message="Loading..." />
            ) : rows.length === 0 ? (
              <TableEmpty colSpan={8} message="No load postings found" />
            ) : (
              rows.map((posting) => (
                <TableRow key={posting.id}>
                  <Td>{formatDate(posting.createdAt)}</Td>
                  <Td>{refName(posting.itemTypeId)}</Td>
                  <Td>{posting.quantity}</Td>
                  <Td>
                    {posting.pickup?.label || '—'} → {posting.delivery?.label || '—'}
                  </Td>
                  <Td>
                    <Badge status={posting.mode} />
                  </Td>
                  <Td>
                    <Badge status={posting.matchingMode} />
                  </Td>
                  <Td>
                    <Badge status={posting.status} />
                  </Td>
                  <Td className="font-mono text-xs">{linkedJobLabel(posting)}</Td>
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
