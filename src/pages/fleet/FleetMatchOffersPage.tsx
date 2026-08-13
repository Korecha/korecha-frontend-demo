import { useEffect, useMemo, useState } from 'react'
import {
  assignMatchOffer,
  declineMatchOffer,
  listFleetDrivers,
  listFleetTrucks,
  listMatchOffers,
  viewMatchOffer,
} from '../../api/fleet'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Select } from '../../components/ui/Input'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { refName } from '../../utils/format'
import type { DriverProfile, LoadMatchOffer, LoadMatchOfferStatus, LoadPosting, Truck, User } from '../../types'

type Filter = 'active' | 'all' | LoadMatchOfferStatus

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'all', label: 'All' },
  { key: 'SENT', label: 'New' },
  { key: 'VIEWED', label: 'Viewed' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'DECLINED', label: 'Declined' },
]

function postingOf(offer: LoadMatchOffer): LoadPosting | null {
  if (offer.loadPosting) return offer.loadPosting
  if (typeof offer.loadPostingId === 'object' && offer.loadPostingId) return offer.loadPostingId
  return null
}

export function FleetMatchOffersPage() {
  const { memberProfile } = useAuth()
  const approved = isApproved(memberProfile)
  const [offers, setOffers] = useState<LoadMatchOffer[]>([])
  const [drivers, setDrivers] = useState<(DriverProfile & { user: User })[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [filter, setFilter] = useState<Filter>('active')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [assignOffer, setAssignOffer] = useState<LoadMatchOffer | null>(null)
  const [truckId, setTruckId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [assigning, setAssigning] = useState(false)

  const load = () => {
    if (!approved) {
      setLoading(false)
      return
    }
    setLoading(true)
    listMatchOffers()
      .then((r) => setOffers(r.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load offers'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    if (!approved) return
    listFleetDrivers().then((r) => setDrivers(r.data)).catch(() => {})
    listFleetTrucks().then((r) => setTrucks(r.data)).catch(() => {})
  }, [approved])

  const approvedTrucks = useMemo(() => trucks.filter((t) => t.status === 'APPROVED'), [trucks])
  const approvedDrivers = useMemo(
    () => drivers.filter((d) => d.status === 'APPROVED' && d.user),
    [drivers]
  )

  const filtered = useMemo(() => {
    if (filter === 'all') return offers
    if (filter === 'active') return offers.filter((o) => o.status === 'SENT' || o.status === 'VIEWED')
    return offers.filter((o) => o.status === filter)
  }, [offers, filter])

  const openAssign = (offer: LoadMatchOffer) => {
    setAssignOffer(offer)
    setTruckId('')
    setDriverId('')
    setError('')
  }

  const handleView = async (offer: LoadMatchOffer) => {
    setBusyId(offer.id)
    setError('')
    try {
      const res = await viewMatchOffer(offer.id)
      setOffers((prev) => prev.map((o) => (o.id === offer.id ? res.data : o)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark viewed')
    } finally {
      setBusyId('')
    }
  }

  const handleDecline = async (offer: LoadMatchOffer) => {
    setBusyId(offer.id)
    setError('')
    try {
      const res = await declineMatchOffer(offer.id)
      setOffers((prev) => prev.map((o) => (o.id === offer.id ? res.data : o)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline offer')
    } finally {
      setBusyId('')
    }
  }

  const handleAssign = async () => {
    if (!assignOffer || !truckId || !driverId) return
    setAssigning(true)
    setError('')
    try {
      const res = await assignMatchOffer(assignOffer.id, { truckId, driverId })
      setOffers((prev) => prev.map((o) => (o.id === assignOffer.id ? res.data : o)))
      setAssignOffer(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign truck')
    } finally {
      setAssigning(false)
    }
  }

  if (!approved) {
    return (
      <div>
        <PageHeader title="Match offers" description="Loads broadcast to your fleet" />
        <Alert variant="warning" className="mt-6">
          Available after your fleet account is approved.
        </Alert>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Match offers"
        description="Review broadcast loads, decline, or assign a truck and driver"
      />

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === f.key
                ? 'bg-korecha-primary text-white shadow-sm'
                : 'bg-white text-slate-600 ring-1 ring-korecha-border hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading match offers...</p>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="font-semibold text-slate-900">No match offers</p>
          <p className="mt-1 text-sm text-slate-500">
            When importers broadcast loads, they will appear here as trucks needed.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((offer) => {
            const posting = postingOf(offer)
            const actionable = offer.status === 'SENT' || offer.status === 'VIEWED'
            return (
              <Card key={offer.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">
                      {posting ? (
                        <>
                          {refName(posting.itemTypeId)} · {posting.quantity}
                          {typeof posting.itemTypeId === 'object' ? ` ${posting.itemTypeId.unit}` : ''}
                        </>
                      ) : (
                        'Load match offer'
                      )}
                    </p>
                    {posting && (
                      <p className="mt-1 text-sm text-slate-600">
                        <span className="font-medium text-korecha-primary">{posting.pickup.label}</span>
                        {' → '}
                        <span className="font-medium text-amber-600">{posting.delivery.label}</span>
                      </p>
                    )}
                    <p className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">{offer.trucksNeededCount}</span> truck
                      {offer.trucksNeededCount !== 1 ? 's' : ''} needed
                    </p>
                    {posting && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge status={posting.mode} />
                        {posting.fxFinanced && (
                          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                            FX financed
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <Badge status={offer.status} />
                </div>

                {actionable && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {offer.status === 'SENT' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === offer.id}
                        onClick={() => handleView(offer)}
                      >
                        Mark viewed
                      </Button>
                    )}
                    <Button size="sm" disabled={busyId === offer.id} onClick={() => openAssign(offer)}>
                      Assign truck
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busyId === offer.id}
                      onClick={() => handleDecline(offer)}
                    >
                      Decline
                    </Button>
                  </div>
                )}

                {offer.status === 'ASSIGNED' && (
                  <p className="mt-3 text-xs text-slate-500">
                    Assigned
                    {typeof offer.assignedTruckId === 'object' && offer.assignedTruckId
                      ? ` · ${offer.assignedTruckId.plateNumber}`
                      : ''}
                    {typeof offer.assignedDriverId === 'object' && offer.assignedDriverId
                      ? ` · ${offer.assignedDriverId.fullName}`
                      : ''}
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {assignOffer && (
        <Modal title="Assign truck & driver" onClose={() => setAssignOffer(null)}>
          <p className="mb-4 text-sm text-slate-600">
            Needs {assignOffer.trucksNeededCount} truck{assignOffer.trucksNeededCount !== 1 ? 's' : ''}.
            Select an approved truck and driver from your fleet.
          </p>
          <div className="space-y-4">
            <Field label="Truck">
              <Select value={truckId} onChange={(e) => setTruckId(e.target.value)} required>
                <option value="">Select truck</option>
                {approvedTrucks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.plateNumber} · {refName(t.truckTypeId)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Driver">
              <Select value={driverId} onChange={(e) => setDriverId(e.target.value)} required>
                <option value="">Select driver</option>
                {approvedDrivers.map((d) => (
                  <option key={d.id} value={d.user.id}>
                    {d.user.fullName}
                    {d.availability ? ` (${d.availability})` : ''}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setAssignOffer(null)}>
              Cancel
            </Button>
            <Button disabled={assigning || !truckId || !driverId} onClick={handleAssign}>
              {assigning ? 'Assigning...' : 'Confirm assign'}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  )
}
