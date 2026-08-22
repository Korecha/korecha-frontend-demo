import { useEffect, useState } from 'react'
import { getTruckOwnerEarnings } from '../../api/truckOwner'
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
import { formatEtb } from '../../utils/format'
import type { Payment } from '../../types'

const STATUS_ORDER: Array<'HELD' | 'RELEASED' | 'DISPUTED'> = ['HELD', 'RELEASED', 'DISPUTED']

export function TruckOwnerEarningsPage() {
  const { memberProfile } = useAuth()
  const [totals, setTotals] = useState<{ HELD: number; RELEASED: number; DISPUTED: number }>({
    HELD: 0,
    RELEASED: 0,
    DISPUTED: 0,
  })
  const [payments, setPayments] = useState<Payment[]>([])
  const approved = isApproved(memberProfile)
  const [loading, setLoading] = useState(approved)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    if (!approved) return
    getTruckOwnerEarnings()
      .then((r) => {
        if (cancelled) return
        setTotals(r.data.totals)
        setPayments(r.data.payments)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load earnings')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [approved])

  if (!approved) {
    return (
      <div>
        <PageHeader title="Earnings" description="Payments earned by your trucks" />
        <Alert variant="warning" className="mt-6">
          Available after your truck owner account is approved.
        </Alert>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Earnings"
        description="Payments earned by your trucks, broken out by status"
      />

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATUS_ORDER.map((status) => (
          <div
            key={status}
            className="rounded-2xl border border-korecha-border bg-white p-5 shadow-sm"
          >
            <div className="mb-2">
              <Badge status={status} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatEtb(totals[status] || 0)}</p>
          </div>
        ))}
      </div>

      <TableWrapper>
        <Table>
          <TableHead>
            <tr>
              <Th>Shipment</Th>
              <Th>Gross</Th>
              <Th>Commission</Th>
              <Th>Net</Th>
              <Th>Status</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={5} message="Loading..." />
            ) : payments.length === 0 ? (
              <TableEmpty colSpan={5} message="No payments yet." />
            ) : (
              payments.map((p) => (
                <TableRow key={p.id}>
                  <Td className="font-mono text-xs">
                    {typeof p.shipmentId === 'object' ? p.shipmentId.id : p.shipmentId}
                  </Td>
                  <Td>{formatEtb(p.grossAmountEtb)}</Td>
                  <Td>{formatEtb(p.commissionAmountEtb)}</Td>
                  <Td className="font-semibold">{formatEtb(p.netAmountEtb)}</Td>
                  <Td>
                    <Badge status={p.status} />
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
