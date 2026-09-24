import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  listOrgTruckOwnerMembers,
  listOrgTruckOwners,
  reviewAvailabilityRequest,
  reviewTruck,
  reviewTruckOwner,
  setTruckOwnerCanPostAvailability,
} from '../../../api/admin'
import { ApiRequestError } from '../../../api/client'
import { Alert } from '../../ui/Alert'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Field, Textarea } from '../../ui/Input'
import { Modal, ModalFooter } from '../../ui/Modal'
import { ChipTabs } from '../../ui/Tabs'
import {
  Table,
  TableEmpty,
  TableHead,
  TableWrapper,
  Td,
  Th,
} from '../../ui/Table'
import type {
  AdminOrgFleetMembers,
  AdminOrgFleetRow,
  ApprovalStatus,
  DriverProfile,
  Truck,
} from '../../../types'
import {
  formatDate,
  PROVIDER_TYPE_LABELS,
  refName,
  TRUCK_OWNER_TYPE_LABELS,
} from '../../../utils/format'

type StatusFilter = ApprovalStatus | 'ALL'

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'ALL', label: 'All' },
]

function parseExpand(raw: string | null): Set<string> {
  if (!raw) return new Set()
  return new Set(raw.split(',').map((id) => id.trim()).filter(Boolean))
}

function rowName(row: AdminOrgFleetRow) {
  return row.fleetName || row.user?.fullName || '—'
}

function subTypeLabel(row: AdminOrgFleetRow) {
  const parts: string[] = []
  if (row.providerType) parts.push(PROVIDER_TYPE_LABELS[row.providerType] || row.providerType)
  if (row.ownerType) parts.push(TRUCK_OWNER_TYPE_LABELS[row.ownerType] || row.ownerType)
  return parts.length ? parts.join(' / ') : '—'
}

function affiliationLabel(row: AdminOrgFleetRow) {
  if (row.parentFleetName) return row.parentFleetName
  if (row.kind === 'OWN_FLEET') return 'Organization fleet'
  return 'Independent'
}

export function TruckOwnersTab({ orgId }: { orgId: string }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [ownFleet, setOwnFleet] = useState<AdminOrgFleetRow[]>([])
  const [truckOwners, setTruckOwners] = useState<AdminOrgFleetRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<StatusFilter>('ALL')
  const expanded = useMemo(() => parseExpand(searchParams.get('expand')), [searchParams])
  const [membersCache, setMembersCache] = useState<Record<string, AdminOrgFleetMembers>>({})
  const [membersError, setMembersError] = useState<Record<string, string>>({})
  const [membersLoading, setMembersLoading] = useState<Record<string, boolean>>({})
  const [approvingOwner, setApprovingOwner] = useState<AdminOrgFleetRow | null>(null)
  const [rejectingOwner, setRejectingOwner] = useState<AdminOrgFleetRow | null>(null)
  const [approvingAvailability, setApprovingAvailability] = useState<AdminOrgFleetRow | null>(null)
  const [rejectingAvailability, setRejectingAvailability] = useState<AdminOrgFleetRow | null>(null)
  const [approvingTruck, setApprovingTruck] = useState<{ truck: Truck; managerId: string } | null>(
    null,
  )
  const [rejectingTruck, setRejectingTruck] = useState<{ truck: Truck; managerId: string } | null>(
    null,
  )
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const requestedMembers = useRef<Set<string>>(new Set())

  const highlightId = searchParams.get('highlight')

  const load = () => {
    setLoading(true)
    listOrgTruckOwners(orgId)
      .then((res) => {
        setOwnFleet(res.data.ownFleet)
        setTruckOwners(res.data.truckOwners)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load fleet'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    requestedMembers.current = new Set()
  }, [orgId])

  useEffect(() => {
    let active = true
    void Promise.resolve()
      .then(() => {
        setLoading(true)
        setMembersCache({})
        setMembersError({})
        setMembersLoading({})
        return listOrgTruckOwners(orgId)
      })
      .then((res) => {
        if (!active) return
        setOwnFleet(res.data.ownFleet)
        setTruckOwners(res.data.truckOwners)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load fleet')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [orgId])

  const filteredTruckOwners = useMemo(() => {
    if (status === 'ALL') return truckOwners
    return truckOwners.filter((row) => row.status === status)
  }, [truckOwners, status])

  const syncExpandUrl = (next: Set<string>) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        const ids = Array.from(next)
        if (ids.length) params.set('expand', ids.join(','))
        else params.delete('expand')
        return params
      },
      { replace: true },
    )
  }

  const toggleExpand = (id: string) => {
    const next = new Set(expanded)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    syncExpandUrl(next)
  }

  const dropMemberCache = (id: string) => {
    requestedMembers.current.delete(id)
    setMembersCache((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setMembersError((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setMembersLoading((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  useEffect(() => {
    if (loading) return
    Array.from(expanded).forEach((id) => {
      if (requestedMembers.current.has(id)) return
      requestedMembers.current.add(id)
      void Promise.resolve()
        .then(() => {
          setMembersLoading((prev) => ({ ...prev, [id]: true }))
          return listOrgTruckOwnerMembers(orgId, id)
        })
        .then((res) => {
          setMembersCache((prev) => ({ ...prev, [id]: res.data }))
          setMembersError((prev) => {
            const next = { ...prev }
            delete next[id]
            return next
          })
        })
        .catch((err) => {
          const notInOrg =
            (err instanceof ApiRequestError && err.status === 404) ||
            (err instanceof Error &&
              err.message.includes('Fleet manager not found for this organization'))
          setMembersError((prev) => ({
            ...prev,
            [id]: notInOrg
              ? 'Not in this organization'
              : err instanceof Error
                ? err.message
                : 'Failed to load members',
          }))
        })
        .finally(() => {
          setMembersLoading((prev) => {
            const next = { ...prev }
            delete next[id]
            return next
          })
        })
    })
  }, [expanded, orgId, loading])

  const afterMutation = (managerId?: string) => {
    if (managerId) dropMemberCache(managerId)
    load()
  }

  const approveOwner = async () => {
    if (!approvingOwner) return
    setSubmitting(true)
    setError('')
    try {
      await reviewTruckOwner(approvingOwner.id, { status: 'APPROVED' })
      setApprovingOwner(null)
      afterMutation(approvingOwner.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  const rejectOwner = async (e: FormEvent) => {
    e.preventDefault()
    if (!rejectingOwner) return
    if (!rejectionReason.trim()) {
      setError('Add a rejection reason before rejecting')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await reviewTruckOwner(rejectingOwner.id, {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
      })
      setRejectingOwner(null)
      setRejectionReason('')
      afterMutation(rejectingOwner.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleAvailability = async (row: AdminOrgFleetRow, e: MouseEvent) => {
    e.stopPropagation()
    setTogglingId(row.id)
    setError('')
    try {
      await setTruckOwnerCanPostAvailability(row.id, !row.canPostAvailability)
      afterMutation(row.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update availability flag')
    } finally {
      setTogglingId(null)
    }
  }

  const approveAvailability = async () => {
    if (!approvingAvailability) return
    setSubmitting(true)
    setError('')
    try {
      await reviewAvailabilityRequest(approvingAvailability.id, { status: 'APPROVED' })
      setApprovingAvailability(null)
      afterMutation(approvingAvailability.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve request')
    } finally {
      setSubmitting(false)
    }
  }

  const rejectAvailability = async (e: FormEvent) => {
    e.preventDefault()
    if (!rejectingAvailability) return
    if (!rejectionReason.trim()) {
      setError('Add a rejection reason before rejecting')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await reviewAvailabilityRequest(rejectingAvailability.id, {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
      })
      setRejectingAvailability(null)
      setRejectionReason('')
      afterMutation(rejectingAvailability.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject request')
    } finally {
      setSubmitting(false)
    }
  }

  const approveTruck = async () => {
    if (!approvingTruck) return
    setSubmitting(true)
    setError('')
    try {
      await reviewTruck(approvingTruck.truck.id, { status: 'APPROVED' })
      const managerId = approvingTruck.managerId
      setApprovingTruck(null)
      afterMutation(managerId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve truck')
    } finally {
      setSubmitting(false)
    }
  }

  const rejectTruck = async (e: FormEvent) => {
    e.preventDefault()
    if (!rejectingTruck) return
    if (!rejectionReason.trim()) {
      setError('Add a rejection reason before rejecting')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await reviewTruck(rejectingTruck.truck.id, {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
      })
      const managerId = rejectingTruck.managerId
      setRejectingTruck(null)
      setRejectionReason('')
      afterMutation(managerId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject truck')
    } finally {
      setSubmitting(false)
    }
  }

  const renderSection = (title: string, rows: AdminOrgFleetRow[]) => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <TableWrapper>
        <Table>
          <TableHead>
            <tr>
              <Th>▸</Th>
              <Th>Name</Th>
              <Th>Sub-type / Owner type</Th>
              <Th>Contact</Th>
              <Th>Affiliation</Th>
              <Th>Mode</Th>
              <Th>Status</Th>
              <Th>Can post availability</Th>
              <Th>Drivers</Th>
              <Th>Trucks</Th>
              <Th>Actions</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={11} message="Loading..." />
            ) : rows.length === 0 ? (
              <TableEmpty colSpan={11} message="No fleet entities in this section" />
            ) : (
              rows.map((row) => {
                const isOpen = expanded.has(row.id)
                return (
                  <Fragment key={row.id}>
                    <tr
                      className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-blue-50/30"
                      onClick={() => toggleExpand(row.id)}
                    >
                      <Td className="font-semibold text-slate-500">{isOpen ? '▾' : '▸'}</Td>
                      <Td className="font-semibold text-slate-900">{rowName(row)}</Td>
                      <Td>{subTypeLabel(row)}</Td>
                      <Td>
                        <div>{row.user?.fullName || '—'}</div>
                        <div className="text-xs text-slate-500">{row.user?.email || '—'}</div>
                      </Td>
                      <Td>{affiliationLabel(row)}</Td>
                      <Td>{row.modeScope ? <Badge status={row.modeScope} /> : '—'}</Td>
                      <Td>
                        <Badge status={row.status} />
                      </Td>
                      <Td>
                        <div className="flex flex-col items-start gap-2" onClick={(e) => e.stopPropagation()}>
                          {row.status === 'APPROVED' ? (
                            <Button
                              size="sm"
                              variant={row.canPostAvailability ? 'secondary' : 'primary'}
                              disabled={togglingId === row.id}
                              onClick={(e) => toggleAvailability(row, e)}
                            >
                              {togglingId === row.id
                                ? 'Updating...'
                                : row.canPostAvailability
                                  ? 'Revoke'
                                  : 'Grant'}
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-500">
                              {row.canPostAvailability ? 'Yes' : 'No (default)'}
                            </span>
                          )}
                          {row.availabilityRequestStatus === 'PENDING' && (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                                Requested {formatDate(row.availabilityRequestedAt)}
                              </span>
                              <Button
                                size="sm"
                                onClick={() => setApprovingAvailability(row)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setRejectingAvailability(row)
                                  setRejectionReason('')
                                }}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </Td>
                      <Td>{row.driverCount}</Td>
                      <Td>
                        {row.truckCount}
                        {row.pendingTruckCount > 0 ? (
                          <span className="ml-1 text-xs text-amber-700">({row.pendingTruckCount} pending)</span>
                        ) : null}
                      </Td>
                      <Td>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          {row.status === 'PENDING' ? (
                            <>
                              <Button size="sm" onClick={() => setApprovingOwner(row)}>
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setRejectingOwner(row)
                                  setRejectionReason(row.rejectionReason || '')
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500">
                              {row.status === 'REJECTED'
                                ? row.rejectionReason || 'Rejected'
                                : 'Reviewed'}
                            </span>
                          )}
                        </div>
                      </Td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-slate-100 bg-slate-50/60">
                        <td colSpan={11} className="px-5 py-4">
                          <TruckOwnerMembersPanel
                            members={membersCache[row.id]}
                            loading={Boolean(membersLoading[row.id])}
                            error={membersError[row.id]}
                            highlightId={highlightId}
                            managerId={row.id}
                            onApproveTruck={(truck) => setApprovingTruck({ truck, managerId: row.id })}
                            onRejectTruck={(truck) => {
                              setRejectingTruck({ truck, managerId: row.id })
                              setRejectionReason('')
                            }}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </Table>
      </TableWrapper>
    </div>
  )

  return (
    <div className="mt-6 space-y-8">
      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}
      {renderSection('Organization fleet', ownFleet)}
      <div className="space-y-3">
        <ChipTabs items={STATUS_FILTERS} active={status} onChange={setStatus} />
        {renderSection('Affiliated truck owners', filteredTruckOwners)}
      </div>

      {approvingOwner && (
        <Modal title="Approve truck owner" onClose={() => setApprovingOwner(null)}>
          <p className="text-sm text-slate-600">
            Approve{' '}
            <span className="font-semibold text-slate-900">{rowName(approvingOwner)}</span>?
            Availability posting stays off until you explicitly grant it.
          </p>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setApprovingOwner(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={approveOwner} disabled={submitting}>
              {submitting ? 'Approving...' : 'Approve'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {rejectingOwner && (
        <Modal title="Reject truck owner" onClose={() => setRejectingOwner(null)}>
          <form onSubmit={rejectOwner} className="space-y-4">
            <Field label="Rejection reason">
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                required
              />
            </Field>
            <ModalFooter>
              <Button
                variant="secondary"
                onClick={() => setRejectingOwner(null)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="danger" disabled={submitting}>
                {submitting ? 'Rejecting...' : 'Reject'}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {approvingAvailability && (
        <Modal title="Approve availability request" onClose={() => setApprovingAvailability(null)}>
          <p className="text-sm text-slate-600">
            Grant availability posting to{' '}
            <span className="font-semibold text-slate-900">{rowName(approvingAvailability)}</span>?
          </p>
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => setApprovingAvailability(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={approveAvailability} disabled={submitting}>
              {submitting ? 'Approving...' : 'Approve'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {rejectingAvailability && (
        <Modal title="Reject availability request" onClose={() => setRejectingAvailability(null)}>
          <form onSubmit={rejectAvailability} className="space-y-4">
            <Field label="Rejection reason">
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                required
              />
            </Field>
            <ModalFooter>
              <Button
                variant="secondary"
                onClick={() => setRejectingAvailability(null)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="danger" disabled={submitting}>
                {submitting ? 'Rejecting...' : 'Reject'}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {approvingTruck && (
        <Modal title="Approve truck" onClose={() => setApprovingTruck(null)}>
          <p className="text-sm text-slate-600">
            Approve truck{' '}
            <span className="font-semibold text-slate-900">{approvingTruck.truck.plateNumber}</span>?
          </p>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setApprovingTruck(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={approveTruck} disabled={submitting}>
              {submitting ? 'Approving...' : 'Approve'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {rejectingTruck && (
        <Modal title="Reject truck" onClose={() => setRejectingTruck(null)}>
          <form onSubmit={rejectTruck} className="space-y-4">
            <Field label="Rejection reason">
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                required
              />
            </Field>
            <ModalFooter>
              <Button
                variant="secondary"
                onClick={() => setRejectingTruck(null)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="danger" disabled={submitting}>
                {submitting ? 'Rejecting...' : 'Reject'}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  )
}

function TruckOwnerMembersPanel({
  members,
  loading,
  error,
  highlightId,
  managerId,
  onApproveTruck,
  onRejectTruck,
}: {
  members?: AdminOrgFleetMembers
  loading: boolean
  error?: string
  highlightId: string | null
  managerId: string
  onApproveTruck: (truck: Truck) => void
  onRejectTruck: (truck: Truck) => void
}) {
  const [ringId, setRingId] = useState<string | null>(null)

  useEffect(() => {
    if (!highlightId || !members) return
    const found = members.drivers.some((d) => d.id === highlightId)
    if (!found) return
    const el = document.getElementById(`admin-driver-${managerId}-${highlightId}`)
    el?.scrollIntoView({ block: 'center' })
    const start = window.setTimeout(() => setRingId(highlightId), 0)
    const timer = window.setTimeout(() => setRingId(null), 3000)
    return () => {
      window.clearTimeout(start)
      window.clearTimeout(timer)
    }
  }, [highlightId, members, managerId])

  if (loading) return <p className="text-sm text-slate-500">Loading members...</p>
  if (error) return <p className="text-sm text-slate-500">{error}</p>
  if (!members) return <p className="text-sm text-slate-500">Loading members...</p>

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Drivers</h4>
        <div className="overflow-hidden rounded-xl border border-korecha-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-korecha-border bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-xs font-semibold uppercase text-slate-500">Name</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase text-slate-500">Phone</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {members.drivers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-sm text-slate-400">
                    No drivers
                  </td>
                </tr>
              ) : (
                members.drivers.map((driver: DriverProfile) => (
                  <tr
                    key={driver.id}
                    id={`admin-driver-${managerId}-${driver.id}`}
                    className={`border-b border-slate-100 last:border-0 ${ringId === driver.id ? 'ring-2 ring-korecha-primary' : ''
                      }`}
                  >
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {driver.user?.fullName || '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{driver.user?.phone || '—'}</td>
                    <td className="px-3 py-2">
                      <Badge status={driver.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Trucks</h4>
        <div className="overflow-hidden rounded-xl border border-korecha-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-korecha-border bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-xs font-semibold uppercase text-slate-500">Plate</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase text-slate-500">Type</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase text-slate-500">Status</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.trucks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-400">
                    No trucks
                  </td>
                </tr>
              ) : (
                members.trucks.map((truck) => (
                  <tr key={truck.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 font-semibold text-slate-800">
                      {truck.plateNumber}
                      {truck.trailerPlateNumber ? (
                        <span className="block text-xs font-normal text-slate-500">
                          Trailer: {truck.trailerPlateNumber}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">{refName(truck.truckTypeId)}</td>
                    <td className="px-3 py-2">
                      <Badge status={truck.status} />
                    </td>
                    <td className="px-3 py-2">
                      {truck.status === 'PENDING' && !truck.fleetOwnerId ? (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => onApproveTruck(truck)}>
                            Approve
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => onRejectTruck(truck)}>
                            Reject
                          </Button>
                        </div>
                      ) : truck.status === 'PENDING' && truck.fleetOwnerId ? (
                        <span className="text-xs text-slate-500">Reviewed in fleet portal</span>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
