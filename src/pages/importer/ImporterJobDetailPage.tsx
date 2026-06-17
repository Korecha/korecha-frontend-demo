import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getJob, getNearbyTrucks, requestTruck, approveJob } from '../../api/importer'
import { DriverMap } from '../../components/driver/DriverMap'
import { JobPricingCard } from '../../components/importer/JobPricingCard'
import { JobStatusTimeline } from '../../components/importer/JobStatusTimeline'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { refName, formatDate } from '../../utils/format'
import { jobRouteLocations } from '../../utils/jobMap'
import type { Job, JobRequest, NearbyTruck } from '../../types'

function TruckRequestCard({
  truck,
  extended = false,
  requesting,
  onRequest,
}: {
  truck: NearbyTruck
  extended?: boolean
  requesting: boolean
  onRequest: () => void
}) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm ${
      extended ? 'border-amber-200 bg-gradient-to-r from-amber-50/50 to-white' : 'border-korecha-border'
    }`}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-korecha-primary">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M5 11h14l-1.5-5H6.5L5 11zm2.5 6a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-slate-900">{truck.truck.plateNumber}</p>
        <p className="text-sm text-slate-600">
          {truck.driver.fullName}
          {' · '}
          <span className={extended ? 'font-semibold text-amber-700' : 'font-medium text-korecha-primary'}>
            {truck.distanceKm} km away
          </span>
        </p>
        <p className="text-xs text-slate-400">
          {refName(truck.truck.truckTypeId)}
          {truck.organization?.name && (
            <>
              {' · '}
              <span className="font-medium text-slate-500">{truck.organization.name}</span>
            </>
          )}
        </p>
        {extended && (
          <p className="mt-1 text-xs font-medium text-amber-700">
            Outside {80} km range — still available to request
          </p>
        )}
      </div>
      <Button size="sm" disabled={requesting} onClick={onRequest}>
        {requesting ? '...' : 'Request'}
      </Button>
    </div>
  )
}

export function ImporterJobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [requests, setRequests] = useState<JobRequest[]>([])
  const [nearby, setNearby] = useState<NearbyTruck[]>([])
  const [extended, setExtended] = useState<NearbyTruck[]>([])
  const [nearbyRadiusKm, setNearbyRadiusKm] = useState(80)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requesting, setRequesting] = useState<string | null>(null)
  const [approving, setApproving] = useState(false)

  const load = () => {
    if (!id) return
    setLoading(true)
    getJob(id)
      .then((r) => {
        setJob(r.data.job)
        setRequests(r.data.requests)
        if (['OPEN', 'REQUESTED'].includes(r.data.job.status)) {
          getNearbyTrucks(id).then((t) => {
            setNearby(t.data.nearby)
            setExtended(t.data.extended)
            setNearbyRadiusKm(t.data.radiusKm)
          }).catch(() => {})
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const handleRequest = async (truck: NearbyTruck) => {
    if (!id) return
    setRequesting(truck.truck.id)
    setError('')
    try {
      await requestTruck(id, { driverId: truck.driver.id, truckId: truck.truck.id })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setRequesting(null)
    }
  }

  const handleApprove = async () => {
    if (!id) return
    setApproving(true)
    setError('')
    try {
      await approveJob(id)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed')
    } finally {
      setApproving(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading job...</p>
  if (!job) return <Alert>Job not found</Alert>

  const canRequest = ['OPEN', 'REQUESTED'].includes(job.status)
  const awaitingApproval = job.status === 'PENDING_APPROVAL'
  const showPricing = job.pricingQuote && !['ASSIGNED', 'IN_TRANSIT', 'PENDING_APPROVAL', 'COMPLETED'].includes(job.status)
  const pickupGate = typeof job.pickupGateId === 'object' ? job.pickupGateId : null
  const deliveryGate = typeof job.deliveryGateId === 'object' ? job.deliveryGateId : null
  const driver = typeof job.assignedDriverId === 'object' ? job.assignedDriverId : null
  const truck = typeof job.assignedTruckId === 'object' ? job.assignedTruckId : null

  return (
    <div className="space-y-4">
      <Link to="/importer/jobs" className="inline-flex items-center gap-1 text-sm font-medium text-korecha-primary hover:underline">
        ← Back to jobs
      </Link>

      {/* Map hero */}
      <div className="relative overflow-hidden rounded-3xl border border-white/60 shadow-xl shadow-blue-900/10">
        <DriverMap className="h-[36vh] min-h-[220px]" routeLocations={jobRouteLocations(job)} interactive />
        <div className="absolute left-4 top-4 rounded-2xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
          <Badge status={job.status} />
        </div>
      </div>

      {/* Job info */}
      <div className="rounded-3xl border border-korecha-border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          {refName(job.itemTypeId)} × {job.quantity}
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-blue-50 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-korecha-primary">Pickup</p>
            <p className="text-sm font-medium text-slate-800">{job.pickup.label}</p>
            {pickupGate && <p className="mt-1 text-xs text-slate-500">Gate: {pickupGate.name}</p>}
          </div>
          <div className="rounded-xl bg-amber-50 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">Delivery</p>
            <p className="text-sm font-medium text-slate-800">{job.delivery.label}</p>
            {deliveryGate && <p className="mt-1 text-xs text-slate-500">Gate: {deliveryGate.name}</p>}
          </div>
        </div>
        {job.notes && (
          <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{job.notes}</p>
        )}
        <div className="mt-4">
          <JobStatusTimeline status={job.status} />
        </div>
        {driver && (
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-blue-50 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-korecha-primary">Assigned driver</p>
              <p className="font-semibold text-slate-900">{driver.fullName}</p>
              {truck && <p className="text-sm text-slate-600">Truck {truck.plateNumber}</p>}
            </div>
            {driver.phone && (
              <a
                href={`tel:${driver.phone}`}
                className="rounded-xl bg-korecha-primary px-3 py-2 text-xs font-bold text-white shadow-sm"
              >
                Call
              </a>
            )}
          </div>
        )}
      </div>

      {error && <Alert>{error}</Alert>}

      {awaitingApproval && (
        <div className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm">
          <h3 className="font-bold text-orange-900">Driver marked delivery complete</h3>
          <p className="mt-1 text-sm text-orange-800">
            Review the job and approve to finalize. The driver delivered on {formatDate(job.deliveredAt)}.
          </p>
          <Button className="mt-4 w-full py-3" disabled={approving} onClick={handleApprove}>
            {approving ? 'Approving...' : 'Approve delivery & close job'}
          </Button>
        </div>
      )}

      {showPricing && job.pricingQuote && (
        <JobPricingCard quote={job.pricingQuote} />
      )}

      {canRequest && (
        <div className="rounded-3xl border border-korecha-border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-korecha-primary text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Find trucks</h3>
              <p className="text-xs text-slate-500">Live drivers from all organizations within ~{nearbyRadiusKm} km</p>
            </div>
          </div>

          {nearby.length === 0 && extended.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <p className="font-semibold text-slate-700">No live trucks right now</p>
              <p className="mt-1 text-sm text-slate-500">Drivers appear when they go live and set availability</p>
            </div>
          ) : nearby.length > 0 ? (
            <div className="mt-4 space-y-3">
              {nearby.map((t) => (
                <TruckRequestCard
                  key={t.truck.id}
                  truck={t}
                  requesting={requesting === t.truck.id}
                  onRequest={() => handleRequest(t)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">No trucks within {nearbyRadiusKm} km</p>
                <p className="mt-1 text-sm text-amber-800">
                  Available trucks farther away — you can still request and they may accept.
                </p>
              </div>
              {extended.map((t) => (
                <TruckRequestCard
                  key={t.truck.id}
                  truck={t}
                  extended
                  requesting={requesting === t.truck.id}
                  onRequest={() => handleRequest(t)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {requests.length > 0 && (
        <div className="rounded-3xl border border-korecha-border bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-900">Requests sent</h3>
          <ul className="mt-3 space-y-2">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
                <span className="font-medium text-slate-700">
                  {typeof r.driverId === 'object' ? r.driverId.fullName : 'Driver'}
                </span>
                <Badge status={r.status} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
