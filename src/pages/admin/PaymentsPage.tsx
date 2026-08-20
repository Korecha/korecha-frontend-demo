import { useCallback, useEffect, useState } from 'react'
import { listPayments, updatePaymentStatus } from '../../api/admin'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Loading } from '../../components/ui/Loading'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Input'
import {
    TableWrapper,
    Table,
    TableHead,
    TableRow,
    Th,
    Td,
    TableEmpty,
} from '../../components/ui/Table'
import { formatEtb, formatDate, SHIPMENT_MODE_LABELS } from '../../utils/format'
import type { Payment, PaymentStatus } from '../../types'

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const limit = 50
    const totalPages = Math.ceil(total / limit)
    const [updating, setUpdating] = useState<string | null>(null)
    const [updateError, setUpdateError] = useState<string | null>(null)

    const load = useCallback(() => {
        setLoading(true)
        setError('')
        listPayments({ page, limit: 50, status: statusFilter || undefined })
            .then((r) => {
                setPayments(r.data)
                setTotal(r.pagination.total)
            })
            .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load payments'))
            .finally(() => setLoading(false))
    }, [page, statusFilter])

    useEffect(() => {
        void Promise.resolve().then(load)
    }, [load])

    const handleStatusUpdate = async (paymentId: string, newStatus: PaymentStatus) => {
        setUpdating(paymentId)
        setUpdateError(null)
        try {
            const result = await updatePaymentStatus(paymentId, newStatus)
            setPayments((prev) => prev.map((p) => (p.id === paymentId ? result.data : p)))
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update payment status'
            setUpdateError(message)
        } finally {
            setUpdating(null)
        }
    }

    function shipmentLabel(shipmentId: Payment['shipmentId']): string {
        if (typeof shipmentId === 'string') return shipmentId.slice(0, 8)
        return `${SHIPMENT_MODE_LABELS[shipmentId.mode]} · ${shipmentId.customerType}`
    }

    if (loading) return <Loading />
    if (error) return <Alert variant="error">{error}</Alert>

    return (
        <div className="space-y-6">
            <PageHeader
                title="Payments"
                description="Manage payment releases and disputes for completed shipments"
            />

            <div className="rounded-xl bg-white p-4 shadow">
                <div className="mb-4 flex items-center gap-4">
                    <div className="flex-1">
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Filter by status
                        </label>
                        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">All statuses</option>
                            <option value="HELD">Held</option>
                            <option value="RELEASED">Released</option>
                            <option value="DISPUTED">Disputed</option>
                        </Select>
                    </div>
                </div>

                {updateError && (
                    <Alert variant="error" className="mb-4">
                        {updateError}
                    </Alert>
                )}

                <TableWrapper>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <Th>Payment ID</Th>
                                <Th>Shipment</Th>
                                <Th>Gross</Th>
                                <Th>Commission</Th>
                                <Th>Net</Th>
                                <Th>Provider</Th>
                                <Th>Status</Th>
                                <Th>Created</Th>
                                <Th>Actions</Th>
                            </TableRow>
                        </TableHead>
                        <tbody>
                            {payments.length === 0 ? (
                                <TableEmpty
                                    colSpan={9}
                                    message={
                                        statusFilter ? `No payments with status "${statusFilter}"` : 'No payments yet'
                                    }
                                />
                            ) : (
                                payments.map((payment) => {
                                    const isHeld = payment.status === 'HELD'
                                    const canUpdate = isHeld && updating !== payment.id
                                    return (
                                        <TableRow key={payment.id}>
                                            <Td className="font-mono text-xs">{payment.id.slice(0, 8)}</Td>
                                            <Td className="text-sm">{shipmentLabel(payment.shipmentId)}</Td>
                                            <Td className="font-medium">{formatEtb(payment.grossAmountEtb)}</Td>
                                            <Td className="text-sm text-slate-600">
                                                {payment.commissionPctSnapshot}% · {formatEtb(payment.commissionAmountEtb)}
                                            </Td>
                                            <Td className="font-semibold text-emerald-700">
                                                {formatEtb(payment.netAmountEtb)}
                                            </Td>
                                            <Td className="text-sm">
                                                <div>{payment.provider.replace(/_/g, ' ')}</div>
                                                {payment.providerReference && (
                                                    <div className="text-xs text-slate-500">{payment.providerReference}</div>
                                                )}
                                            </Td>
                                            <Td>
                                                <Badge status={payment.status} />
                                            </Td>
                                            <Td className="text-sm text-slate-600">{formatDate(payment.createdAt)}</Td>
                                            <Td>
                                                {isHeld ? (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            disabled={!canUpdate}
                                                            onClick={() => handleStatusUpdate(payment.id, 'RELEASED')}
                                                        >
                                                            {updating === payment.id ? '...' : 'Release'}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            disabled={!canUpdate}
                                                            onClick={() => handleStatusUpdate(payment.id, 'DISPUTED')}
                                                        >
                                                            Dispute
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-slate-400">—</span>
                                                )}
                                            </Td>
                                        </TableRow>
                                    )
                                })
                            )}
                        </tbody>
                    </Table>
                </TableWrapper>

                {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between border-t pt-4">
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-slate-600">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={page === totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
