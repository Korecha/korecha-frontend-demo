import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createLoadPosting,
  listImporterGateEntrances,
  listImporterItemTypes,
  listImporterLocations,
  previewJobPricing,
} from '../../api/importer'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { JobPricingCard } from '../../components/importer/JobPricingCard'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Input'
import { LocationAutocomplete } from '../../components/ui/LocationAutocomplete'
import type { GateEntrance, ItemType, Location, MatchingMode, ShipmentMode } from '../../types'

function deriveShipmentModePreview(fxFinanced: boolean, bankPermitNo: string): ShipmentMode {
  if (fxFinanced && bankPermitNo.trim().length > 0) return 'MULTIMODAL'
  return 'UNIMODAL'
}

function linkedJobIdOf(linked: string | { id: string } | null | undefined): string | null {
  if (!linked) return null
  return typeof linked === 'string' ? linked : linked.id
}

export function ImporterNewJobPage() {
  const navigate = useNavigate()
  const { memberProfile, organization } = useAuth()
  const approved = isApproved(memberProfile)
  const canUseJobs = approved && Boolean(organization)
  const [itemTypes, setItemTypes] = useState<ItemType[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [gates, setGates] = useState<GateEntrance[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    pickupLocationId: '',
    deliveryLocationId: '',
    pickupGateId: '',
    deliveryGateId: '',
    itemTypeId: '',
    quantity: 1,
    notes: '',
    matchingMode: 'MANUAL_REQUEST' as MatchingMode,
    fxFinanced: false,
    bankPermitNo: '',
  })
  const [priceQuote, setPriceQuote] = useState<import('../../types').JobPricingQuote | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)

  useEffect(() => {
    if (!canUseJobs) return
    listImporterItemTypes().then((r) => setItemTypes(r.data)).catch(() => {})
    listImporterLocations().then((r) => setLocations(r.data)).catch(() => {})
    listImporterGateEntrances().then((r) => setGates(r.data)).catch(() => {})
  }, [canUseJobs])

  const pickupLocation = locations.find((loc) => loc.id === form.pickupLocationId)
  const deliveryLocation = locations.find((loc) => loc.id === form.deliveryLocationId)
  const pickupGates = gates.filter((gate) => {
    const locId = typeof gate.locationId === 'object' ? gate.locationId?.id : gate.locationId
    return !locId || locId === form.pickupLocationId
  })
  const deliveryGates = gates.filter((gate) => {
    const locId = typeof gate.locationId === 'object' ? gate.locationId?.id : gate.locationId
    return !locId || locId === form.deliveryLocationId
  })

  const canPreview =
    form.pickupLocationId &&
    form.deliveryLocationId &&
    form.pickupGateId &&
    form.deliveryGateId &&
    form.quantity >= 1

  const modePreview = deriveShipmentModePreview(form.fxFinanced, form.bankPermitNo)

  useEffect(() => {
    if (!canPreview) {
      void Promise.resolve().then(() => setPriceQuote(null))
      return
    }
    const timer = setTimeout(() => {
      setPriceLoading(true)
      previewJobPricing({
        itemTypeId: form.itemTypeId || undefined,
        quantity: form.quantity,
        pickup: { locationId: form.pickupLocationId },
        delivery: { locationId: form.deliveryLocationId },
        pickupGateId: form.pickupGateId,
        deliveryGateId: form.deliveryGateId,
      })
        .then((r) => setPriceQuote(r.data))
        .catch(() => setPriceQuote(null))
        .finally(() => setPriceLoading(false))
    }, 400)
    return () => clearTimeout(timer)
  }, [
    canPreview,
    form.pickupLocationId,
    form.deliveryLocationId,
    form.pickupGateId,
    form.deliveryGateId,
    form.quantity,
    form.itemTypeId,
  ])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!pickupLocation || !deliveryLocation) {
      setError('Select valid pickup and delivery locations')
      return
    }
    if (!form.pickupGateId || !form.deliveryGateId) {
      setError('Select gate entrances for pickup and delivery')
      return
    }
    if (form.fxFinanced && !form.bankPermitNo.trim()) {
      setError('Bank permit number is required for FX-financed loads')
      return
    }
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const res = await createLoadPosting({
        itemTypeId: form.itemTypeId,
        quantity: form.quantity,
        notes: form.notes || undefined,
        pickup: { locationId: form.pickupLocationId },
        delivery: { locationId: form.deliveryLocationId },
        pickupGateId: form.pickupGateId,
        deliveryGateId: form.deliveryGateId,
        fxFinanced: form.fxFinanced,
        bankPermitNo: form.fxFinanced ? form.bankPermitNo.trim() : undefined,
        matchingMode: form.matchingMode,
      })
      const posting = res.data
      if (posting.matchingMode === 'MANUAL_REQUEST') {
        const jobId = linkedJobIdOf(posting.linkedJobId)
        navigate(jobId ? `/importer/jobs/${jobId}` : `/importer/load-postings/${posting.id}`)
        return
      }
      setSuccess(`Load posted and broadcast (${posting.mode}).`)
      navigate(`/importer/load-postings/${posting.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create load posting')
    } finally {
      setSubmitting(false)
    }
  }

  if (!approved) {
    return (
      <Alert variant="warning">
        Post jobs after your account is approved.
      </Alert>
    )
  }

  if (!organization) {
    return (
      <Alert variant="warning">
        Your account is approved. Contact the platform admin to be linked to an organization before posting jobs.
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <Link to="/importer/jobs" className="inline-flex items-center gap-1 text-sm font-medium text-korecha-primary hover:underline">
        ← Back to jobs
      </Link>

      <div className="rounded-3xl border border-korecha-border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Post a haul job</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose matching style, pickup and delivery, then set cargo details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-korecha-border bg-white p-5 shadow-sm">
        {error && <Alert>{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">How should fleets find this load?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                {
                  value: 'MANUAL_REQUEST' as MatchingMode,
                  title: 'Manual request',
                  desc: 'Browse nearby trucks and request drivers yourself',
                },
                {
                  value: 'BROADCAST' as MatchingMode,
                  title: 'Broadcast',
                  desc: 'Send match offers to eligible fleet managers',
                },
              ] as const
            ).map((opt) => {
              const active = form.matchingMode === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, matchingMode: opt.value })}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    active
                      ? 'border-korecha-primary bg-blue-50 ring-2 ring-korecha-primary/20'
                      : 'border-korecha-border bg-white hover:bg-slate-50'
                  }`}
                >
                  <p className="font-semibold text-slate-900">{opt.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{opt.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-korecha-border bg-slate-50/80 px-4 py-3">
          <input
            type="checkbox"
            checked={form.fxFinanced}
            onChange={(e) =>
              setForm({
                ...form,
                fxFinanced: e.target.checked,
                bankPermitNo: e.target.checked ? form.bankPermitNo : '',
              })
            }
            className="mt-1 h-4 w-4 rounded border-slate-300 text-korecha-primary focus:ring-korecha-primary"
          />
          <span>
            <span className="block text-sm font-medium text-slate-800">FX financed cargo</span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Shipment mode is derived automatically from FX + bank permit (not selectable)
            </span>
          </span>
        </label>

        {form.fxFinanced && (
          <Field label="Bank permit number">
            <Input
              value={form.bankPermitNo}
              onChange={(e) => setForm({ ...form, bankPermitNo: e.target.value })}
              placeholder="Required for FX-financed loads"
              required
            />
          </Field>
        )}

        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-korecha-border">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Derived mode</span>
          <Badge status={modePreview} />
          <span className="text-xs text-slate-500">
            {modePreview === 'MULTIMODAL'
              ? 'FX financed with bank permit → multimodal fleets (MTO)'
              : 'Unimodal matching'}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <LocationAutocomplete
            label="Pickup location"
            value={form.pickupLocationId}
            locations={locations}
            onChange={(pickupLocationId) =>
              setForm({ ...form, pickupLocationId, pickupGateId: '' })
            }
            required
          />
          <LocationAutocomplete
            label="Delivery location"
            value={form.deliveryLocationId}
            locations={locations}
            onChange={(deliveryLocationId) =>
              setForm({ ...form, deliveryLocationId, deliveryGateId: '' })
            }
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pickup gate entrance">
            <Select
              value={form.pickupGateId}
              onChange={(e) => setForm({ ...form, pickupGateId: e.target.value })}
              required
              disabled={!form.pickupLocationId}
            >
              <option value="">
                {form.pickupLocationId
                  ? pickupGates.length
                    ? 'Select pickup gate'
                    : 'No gates for this location'
                  : 'Select pickup location first'}
              </option>
              {pickupGates.map((gate) => (
                <option key={gate.id} value={gate.id}>
                  {gate.name} (ETB {gate.feeEtb.toLocaleString()})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Delivery gate entrance">
            <Select
              value={form.deliveryGateId}
              onChange={(e) => setForm({ ...form, deliveryGateId: e.target.value })}
              required
              disabled={!form.deliveryLocationId}
            >
              <option value="">
                {form.deliveryLocationId
                  ? deliveryGates.length
                    ? 'Select delivery gate'
                    : 'No gates for this location'
                  : 'Select delivery location first'}
              </option>
              {deliveryGates.map((gate) => (
                <option key={gate.id} value={gate.id}>
                  {gate.name} (ETB {gate.feeEtb.toLocaleString()})
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {(pickupLocation || deliveryLocation) && (
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm ring-1 ring-blue-100">
              <p className="text-[10px] font-bold uppercase tracking-wide text-korecha-primary">Pickup</p>
              <p className="mt-0.5 font-medium text-slate-800">{pickupLocation?.name || 'Not set'}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm ring-1 ring-amber-100">
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">Delivery</p>
              <p className="mt-0.5 font-medium text-slate-800">{deliveryLocation?.name || 'Not set'}</p>
            </div>
          </div>
        )}

        <Field label="Cargo type">
          <Select value={form.itemTypeId} onChange={(e) => setForm({ ...form, itemTypeId: e.target.value })} required>
            <option value="">Select item type</option>
            {itemTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.unit})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Quantity">
          <Input
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
            required
          />
        </Field>
        <Field label="Notes (optional)">
          <Input
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Special handling, timing..."
          />
        </Field>

        {priceLoading && canPreview && (
          <p className="text-center text-sm text-slate-500">Calculating estimate...</p>
        )}
        {priceQuote && !priceLoading && <JobPricingCard quote={priceQuote} />}

        <Button
          type="submit"
          disabled={submitting || !canPreview || !form.itemTypeId}
          className="w-full py-3.5 shadow-lg shadow-blue-900/10"
        >
          {submitting
            ? 'Posting...'
            : form.matchingMode === 'BROADCAST'
              ? 'Broadcast load to fleets'
              : 'Post job & find trucks'}
        </Button>
      </form>
    </div>
  )
}
