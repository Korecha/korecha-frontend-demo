import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getContainer } from '../../api/admin'
import { PodPhotos } from '../../components/jobs/PodPhotos'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Loading } from '../../components/ui/Loading'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import type { Container } from '../../types'
import { formatDate, refName, SIZE_LABELS, TYPE_LABELS } from '../../utils/format'

export function ContainerDetailPage() {
    const { id } = useParams<{ id: string }>()
    const [container, setContainer] = useState<Container | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!id) return
        getContainer(id)
            .then((res) => {
                setContainer(res.data)
            })
            .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load container'))
            .finally(() => setLoading(false))
    }, [id])

    if (loading) return <Loading />
    if (error) return <Alert>{error}</Alert>
    if (!container) return <Alert>Container not found</Alert>

    const shipment = container.linkedShipment
    const legs = shipment?.legs ? [...shipment.legs].sort((a, b) => a.sequenceNo - b.sequenceNo) : []

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Container ${container.containerNumber}`}
                description="Container details and linked shipment"
            />

            {/* Container Summary */}
            <Card>
                <h2 className="mb-4 text-lg font-bold text-slate-900">Container Information</h2>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <dt className="text-sm font-medium text-slate-500">Container Number</dt>
                        <dd className="mt-1 font-mono text-base font-semibold text-slate-900">{container.containerNumber}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-slate-500">Size</dt>
                        <dd className="mt-1 text-base text-slate-900">{SIZE_LABELS[container.size] || container.size}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-slate-500">Type</dt>
                        <dd className="mt-1 text-base text-slate-900">{container.type}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-slate-500">Status</dt>
                        <dd className="mt-1">
                            <Badge status={container.status} />
                        </dd>
                    </div>
                    {container.organization && (
                        <div>
                            <dt className="text-sm font-medium text-slate-500">Owner Organization</dt>
                            <dd className="mt-1 text-base text-slate-900">
                                {container.organization.name}
                                {container.organization.type && (
                                    <span className="ml-2 text-sm text-slate-500">
                                        ({TYPE_LABELS[container.organization.type] || container.organization.type})
                                    </span>
                                )}
                            </dd>
                        </div>
                    )}
                    {container.location?.label && (
                        <div>
                            <dt className="text-sm font-medium text-slate-500">Location</dt>
                            <dd className="mt-1 text-base text-slate-900">{container.location.label}</dd>
                        </div>
                    )}
                    {container.shippingLineCode && (
                        <div>
                            <dt className="text-sm font-medium text-slate-500">Shipping Line Code</dt>
                            <dd className="mt-1 font-mono text-base text-slate-900">{container.shippingLineCode}</dd>
                        </div>
                    )}
                    {container.sealNumber && (
                        <div>
                            <dt className="text-sm font-medium text-slate-500">Seal Number</dt>
                            <dd className="mt-1 font-mono text-base text-slate-900">{container.sealNumber}</dd>
                        </div>
                    )}
                    {container.lastFreeDay && (
                        <div>
                            <dt className="text-sm font-medium text-slate-500">Last Free Day</dt>
                            <dd className="mt-1 text-base text-slate-900">{formatDate(container.lastFreeDay)}</dd>
                        </div>
                    )}
                    {container.emptyReadyAt && (
                        <div>
                            <dt className="text-sm font-medium text-slate-500">Empty Ready At</dt>
                            <dd className="mt-1 text-base text-slate-900">{formatDate(container.emptyReadyAt)}</dd>
                        </div>
                    )}
                    {container.notes && (
                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-slate-500">Notes</dt>
                            <dd className="mt-1 text-base text-slate-900">{container.notes}</dd>
                        </div>
                    )}
                </dl>
            </Card>

            {/* Linked Shipment Section */}
            {shipment ? (
                <>
                    <Card>
                        <h2 className="mb-4 text-lg font-bold text-slate-900">Linked Shipment</h2>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-slate-500">Shipment Status</dt>
                                <dd className="mt-1">
                                    <Badge status={shipment.status} />
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-slate-500">Mode</dt>
                                <dd className="mt-1 text-base text-slate-900">{shipment.mode}</dd>
                            </div>
                            {shipment.job && (
                                <>
                                    <div className="sm:col-span-2">
                                        <dt className="text-sm font-medium text-slate-500">Route</dt>
                                        <dd className="mt-1 text-base font-semibold text-slate-900">
                                            {shipment.job.pickup.label} → {shipment.job.delivery.label}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500">Item Type</dt>
                                        <dd className="mt-1 text-base text-slate-900">
                                            {refName(shipment.job.itemTypeId)}
                                            {typeof shipment.job.itemTypeId === 'object' && shipment.job.itemTypeId?.unit && (
                                                <span className="ml-1 text-slate-500">({shipment.job.itemTypeId.unit})</span>
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-slate-500">Quantity</dt>
                                        <dd className="mt-1 text-base text-slate-900">{shipment.job.quantity}</dd>
                                    </div>
                                </>
                            )}
                            {shipment.completedAt && (
                                <div>
                                    <dt className="text-sm font-medium text-slate-500">Completed At</dt>
                                    <dd className="mt-1 text-base text-slate-900">{formatDate(shipment.completedAt)}</dd>
                                </div>
                            )}
                        </dl>
                    </Card>

                    {/* Legs Table */}
                    {legs.length > 0 && (
                        <Card>
                            <h3 className="mb-4 text-lg font-bold text-slate-900">Shipment Legs</h3>
                            <TableWrapper>
                                <Table>
                                    <TableHead>
                                        <tr>
                                            <Th>Leg</Th>
                                            <Th>Route</Th>
                                            <Th>Status</Th>
                                            <Th>Driver</Th>
                                            <Th>Truck</Th>
                                        </tr>
                                    </TableHead>
                                    <tbody>
                                        {legs.map((leg) => (
                                            <TableRow key={leg.id}>
                                                <Td className="font-semibold">Leg {leg.sequenceNo}</Td>
                                                <Td>
                                                    {refName(leg.fromLocationId as string | { name?: string } | null | undefined)} →{' '}
                                                    {refName(leg.toLocationId as string | { name?: string } | null | undefined)}
                                                </Td>
                                                <Td>
                                                    <Badge status={leg.status} />
                                                </Td>
                                                <Td>{refName(leg.driverId as string | { name?: string } | null | undefined)}</Td>
                                                <Td>{refName(leg.truckId as string | { name?: string } | null | undefined)}</Td>
                                            </TableRow>
                                        ))}
                                    </tbody>
                                </Table>
                            </TableWrapper>
                        </Card>
                    )}

                    {/* POD Photos */}
                    <PodPhotos legs={legs} />
                </>
            ) : (
                <Card>
                    <p className="text-slate-600">No shipment is currently linked to this container.</p>
                </Card>
            )}
        </div>
    )
}
