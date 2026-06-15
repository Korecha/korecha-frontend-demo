import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createJob, listImporterItemTypes, listImporterLocations, previewJobPricing } from '../../api/importer'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { JobLocationPicker, type MapPoint } from '../../components/importer/JobLocationPicker'
import { JobPricingCard } from '../../components/importer/JobPricingCard'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Input'
import type { ItemType, Location } from '../../types'

export function ImporterNewJobPage() {
  const navigate = useNavigate()
  const { memberProfile } = useAuth()
  const approved = isApproved(memberProfile)
  const [itemTypes, setItemTypes] = useState<ItemType[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [mapMode, setMapMode] = useState<'pickup' | 'delivery'>('pickup')
  const [pickup, setPickup] = useState<MapPoint | null>(null)
  const [delivery, setDelivery] = useState<MapPoint | null>(null)
  const [form, setForm] = useState({
    itemTypeId: '',
    quantity: 1,
    notes: '',
  })
  const [priceQuote, setPriceQuote] = useState<import('../../types').JobPricingQuote | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)

  useEffect(() => {
    listImporterItemTypes().then((r) => setItemTypes(r.data)).catch(() => {})
    listImporterLocations().then((r) => setLocations(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!pickup || !delivery || form.quantity < 1) {
      setPriceQuote(null)
      return
    }
    setPriceLoading(true)
    const timer = setTimeout(() => {
      previewJobPricing({
        quantity: form.quantity,
        pickup: { coordinates: pickup.coordinates },
        delivery: { coordinates: delivery.coordinates },
      })
        .then((r) => setPriceQuote(r.data))
        .catch(() => setPriceQuote(null))
        .finally(() => setPriceLoading(false))
    }, 400)
    return () => clearTimeout(timer)
  }, [pickup, delivery, form.quantity])

  const handlePointSet = (mode: 'pickup' | 'delivery', point: MapPoint) => {
    if (mode === 'pickup') {
      setPickup(point)
      if (!delivery) setMapMode('delivery')
    } else {
      setDelivery(point)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!pickup || !delivery) {
      setError('Set both pickup and delivery on the map')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await createJob({
        itemTypeId: form.itemTypeId,
        quantity: form.quantity,
        notes: form.notes || undefined,
        pickup,
        delivery,
      })
      navigate(`/importer/jobs/${res.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job')
    } finally {
      setSubmitting(false)
    }
  }

  if (!approved) {
    return (
      <Alert variant="warning">
        Post jobs after your account is approved by your organization admin.
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
          Set pickup and delivery on the map, then choose your cargo type
        </p>
      </div>

      <JobLocationPicker
        pickup={pickup}
        delivery={delivery}
        activeMode={mapMode}
        onModeChange={setMapMode}
        onPointSet={handlePointSet}
        presetLocations={locations}
      />

      {(pickup || delivery) && (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className={`rounded-2xl px-4 py-3 text-sm ${pickup ? 'bg-blue-50 ring-1 ring-blue-100' : 'bg-slate-50'}`}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-korecha-primary">Pickup</p>
            <p className="mt-0.5 font-medium text-slate-800">{pickup?.label || 'Not set'}</p>
          </div>
          <div className={`rounded-2xl px-4 py-3 text-sm ${delivery ? 'bg-amber-50 ring-1 ring-amber-100' : 'bg-slate-50'}`}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">Delivery</p>
            <p className="mt-0.5 font-medium text-slate-800">{delivery?.label || 'Not set'}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-korecha-border bg-white p-5 shadow-sm">
        {error && <Alert>{error}</Alert>}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Pickup label">
            <Input
              value={pickup?.label || ''}
              onChange={(e) => pickup && setPickup({ ...pickup, label: e.target.value })}
              placeholder="Tap map to set pickup"
              disabled={!pickup}
              required={!!pickup}
            />
          </Field>
          <Field label="Delivery label">
            <Input
              value={delivery?.label || ''}
              onChange={(e) => delivery && setDelivery({ ...delivery, label: e.target.value })}
              placeholder="Tap map to set delivery"
              disabled={!delivery}
              required={!!delivery}
            />
          </Field>
        </div>

        <Field label="Cargo type">
          <Select value={form.itemTypeId} onChange={(e) => setForm({ ...form, itemTypeId: e.target.value })} required>
            <option value="">Select item type</option>
            {itemTypes.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.unit})</option>)}
          </Select>
        </Field>
        <Field label="Quantity">
          <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} required />
        </Field>
        <Field label="Notes (optional)">
          <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Special handling, timing..." />
        </Field>

        {priceLoading && pickup && delivery && (
          <p className="text-center text-sm text-slate-500">Calculating estimate...</p>
        )}
        {priceQuote && !priceLoading && <JobPricingCard quote={priceQuote} />}

        <Button
          type="submit"
          disabled={submitting || !pickup || !delivery}
          className="w-full py-3.5 shadow-lg shadow-blue-900/10"
        >
          {submitting ? 'Posting...' : 'Post job & find trucks'}
        </Button>
      </form>
    </div>
  )
}
