import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  addFleetShipmentLeg,
  getFleetShipment,
  getShipmentLegTracking,
  listFleetDrivers,
  listFleetLocations,
  listFleetTrucks,
  updateShipmentContainer,
} from '../../api/fleet'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { DriverMap } from '../../components/driver/DriverMap'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Field, Select } from '../../components/ui/Input'
import { LocationAutocomplete } from '../../components/ui/LocationAutocomplete'
import { PageHeader } from '../../components/ui/PageHeader'
import { refName } from '../../utils/format'
import { jobRouteLocations, trackingPath } from '../../utils/jobMap'
import type {
  DriverProfile,
  FleetProfile,
  Job,
  Location,
  Shipment,
  ShipmentLeg,
  Truck,
  User,
} from '../../types'

function locName(value: ShipmentLeg['fromLocationId']): string {
  return refName(value as string | { name?: string } | null | undefined)
}

function jobOf(shipment: Shipment): Job | null {
  if (shipment.job && typeof shipment.job === 'object') return shipment.job
  if (typeof shipment.jobId === 'object' && shipment.jobId) return shipment.jobId
  return null
}

export function FleetShipmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { memberProfile } = useAuth()
  const approved = isApproved(memberProfile)
  const fleetProfile =
    memberProfile?.type === 'fleet' ? (memberProfile.profile as FleetProfile) : null
  const canAssign = !fleetProfile?.staff || fleetProfile.staff.canAssignJobs
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [drivers, setDrivers] = useState<(DriverProfile & { user: User })[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fromLocationId, setFromLocationId] = useState('')
  const [toLocationId, setToLocationId] = useState('')
  const [truckId, setTruckId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [track, setTrack] = useState<{ lat: number; lng: number }[]>([])
  const [containerInput, setContainerInput] = useState('')
  const [containerError, setContainerError] = useState('')
  const [linkingSaving, setLinkingSaving] = useState(false)

  const load = () => {
    if (!id || !approved) {
      setLoading(false)
      return
    }
    setLoading(true)
    getFleetShipment(id)
      .then((r) => setShipment(r.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load shipment'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    if (!approved) return
    listFleetLocations()
      .then((r) => setLocations(r.data))
      .catch(() => {})
    listFleetDrivers()
      .then((r) => setDrivers(r.data))
      .catch(() => {})
    listFleetTrucks()
      .then((r) => setTrucks(r.data))
      .catch(() => {})
  }, [id, approved])

  useEffect(() => {
    if (!id || !shipment) {
      setTrack([])
      return
    }
    const shipmentLegs = shipment.legs || []
    if (shipmentLegs.length === 0) {
      setTrack([])
      return
    }
    let cancelled = false
    Promise.all(
      shipmentLegs.map((leg) =>
        getShipmentLegTracking(id, leg.id)
          .then((r) => r.data.events ?? [])
          .catch(() => leg.tracking ?? []),
      ),
    ).then((all) => {
      if (!cancelled) setTrack(trackingPath(all.flat()))
    })
    return () => {
      cancelled = true
    }
  }, [id, shipment])

  const approvedTrucks = useMemo(() => trucks.filter((t) => t.status === 'APPROVED'), [trucks])
  const approvedDrivers = useMemo(
    () => drivers.filter((d) => d.status === 'APPROVED' && d.user),
    [drivers],
  )
  const canAdd = shipment && ['ASSIGNED', 'IN_TRANSIT'].includes(shipment.status)

  const handleAdd = async () => {
    if (!id || !toLocationId || !truckId || !driverId) return
    setSaving(true)
    setError('')
    try {
      const r = await addFleetShipmentLeg(id, {
        fromLocationId: fromLocationId || undefined,
        toLocationId,
        truckId,
        driverId,
      })
      setShipment(r.data.shipment)
      setFromLocationId('')
      setToLocationId('')
      setTruckId('')
      setDriverId('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add leg')
    } finally {
      setSaving(false)
    }
  }

  const handleLinkContainer = async () => {
    if (!id || !containerInput.trim()) return
    setLinkingSaving(true)
    setContainerError('')
    try {
      const r = await updateShipmentContainer(id, { containerId: containerInput.trim() })
      setShipment(r.data)
      setContainerInput('')
    } catch (err) {
      setContainerError(err instanceof Error ? err.message : 'Failed to link container')
    } finally {
      setLinkingSaving(false)
    }
  }

  const handleUnlinkContainer = async () => {
    if (!id) return
    setLinkingSaving(true)
    setContainerError('')
    try {
      const r = await updateShipmentContainer(id, { containerId: null })
      setShipment(r.data)
    } catch (err) {
      setContainerError(err instanceof Error ? err.message : 'Failed to unlink container')
    } finally {
      setLinkingSaving(false)
    }
  }

  if (!approved) {
    return (
      <div>
        <PageHeader title="Shipment" />
        <Alert variant="warning" className="mt-6">
          Available after your fleet account is approved.
        </Alert>
      </div>
    )
  }

  if (loading) return <p className="text-sm text-slate-500">Loading shipment...</p>
  if (!shipment) return <Alert>Shipment not found</Alert>

  const job = jobOf(shipment)
  const legs = (shipment.legs || []).slice().sort((a, b) => a.sequenceNo - b.sequenceNo)

  return (
    <div>
      <Link
        to="/fleet/shipments"
        className="mb-4 inline-flex text-sm font-medium text-korecha-primary hover:underline"
      >
        ← Back to shipments
      </Link>
      <PageHeader
        title={job ? `${refName(job.itemTypeId)} × ${job.quantity}` : 'Shipment'}
        description={job ? `${job.pickup.label} → ${job.delivery.label}` : undefined}
        action={<Badge status={shipment.status} />}
      />
      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="relative mb-6 overflow-hidden rounded-3xl border border-white/60 shadow-xl shadow-blue-900/10">
        <DriverMap
          className="h-[36vh] min-h-[220px]"
          routeLocations={job ? jobRouteLocations(job) : []}
          track={track}
          interactive
        />
      </div>

      <div className="rounded-2xl border border-korecha-border bg-white p-5 shadow-sm">
        <h3 className="font-bold text-slate-900">Legs</h3>
        <ol className="mt-3 space-y-2">
          {legs.map((leg) => (
            <li
              key={leg.id}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {leg.sequenceNo}. {locName(leg.fromLocationId)} → {locName(leg.toLocationId)}
                </p>
                <p className="text-xs text-slate-500">
                  {typeof leg.driverId === 'object' && leg.driverId?.fullName
                    ? leg.driverId.fullName
                    : 'Driver'}
                  {typeof leg.truckId === 'object' && leg.truckId?.plateNumber
                    ? ` · ${leg.truckId.plateNumber}`
                    : ''}
                </p>
              </div>
              <Badge status={leg.status} />
            </li>
          ))}
        </ol>
      </div>

      {!['COMPLETED', 'CANCELLED'].includes(shipment.status) && (
        <div className="mt-6 rounded-2xl border border-korecha-border bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-900">Container</h3>
          {containerError && <Alert className="mt-3">{containerError}</Alert>}
          {shipment.containerId ? (
            <div className="mt-3">
              <p className="text-sm text-slate-500">Currently linked container:</p>
              <p className="mt-1 font-mono text-base font-semibold text-slate-900">
                {shipment.containerId}
              </p>
              <Button
                className="mt-3"
                variant="secondary"
                disabled={linkingSaving}
                onClick={handleUnlinkContainer}
              >
                {linkingSaving ? 'Unlinking...' : 'Unlink container'}
              </Button>
            </div>
          ) : (
            <div className="mt-3">
              <p className="mb-3 text-sm text-slate-500">
                Link a container to this shipment (optional).
              </p>
              <Field label="Container ID">
                <input
                  type="text"
                  value={containerInput}
                  onChange={(e) => setContainerInput(e.target.value)}
                  placeholder="Enter container ID"
                  className="w-full rounded-lg border border-korecha-border bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:border-korecha-primary focus:outline-none focus:ring-2 focus:ring-korecha-primary/20"
                />
              </Field>
              <Button
                className="mt-3"
                disabled={linkingSaving || !containerInput.trim()}
                onClick={handleLinkContainer}
              >
                {linkingSaving ? 'Linking...' : 'Link container'}
              </Button>
            </div>
          )}
        </div>
      )}

      {canAdd && canAssign && (
        <div className="mt-6 rounded-2xl border border-korecha-border bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-900">Add a leg</h3>
          <p className="mt-1 text-sm text-slate-500">
            Add extra legs while the shipment is assigned or in transit, before the last open leg is
            completed. After that the shipment waits for importer POD approval and no more legs can
            be added.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <LocationAutocomplete
              label="From (optional — defaults to previous destination)"
              value={fromLocationId}
              locations={locations}
              onChange={setFromLocationId}
            />
            <LocationAutocomplete
              label="To"
              value={toLocationId}
              locations={locations}
              onChange={setToLocationId}
              required
            />
            <Field label="Truck">
              <Select value={truckId} onChange={(e) => setTruckId(e.target.value)} required>
                <option value="">Select truck</option>
                {approvedTrucks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.plateNumber}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Driver">
              <Select value={driverId} onChange={(e) => setDriverId(e.target.value)} required>
                <option value="">Select driver</option>
                {approvedDrivers.map((d) => (
                  <option key={d.user.id} value={d.user.id}>
                    {d.user.fullName}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Button
            className="mt-4"
            disabled={saving || !toLocationId || !truckId || !driverId}
            onClick={handleAdd}
          >
            {saving ? 'Adding...' : 'Add leg'}
          </Button>
        </div>
      )}
    </div>
  )
}
