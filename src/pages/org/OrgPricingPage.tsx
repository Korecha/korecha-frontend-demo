import { useEffect, useState, type FormEvent } from 'react'
import { listOrgLocations, previewOrgPricing, updateOrgPricing, getOrgPricing } from '../../api/org'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Input, Select } from '../../components/ui/Input'
import { Loading } from '../../components/ui/Loading'
import { PageHeader } from '../../components/ui/PageHeader'
import type { ContainerSize, Location, QuotePreview } from '../../types'
import { formatEtb } from '../../utils/format'

export function OrgPricingPage() {
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [locations, setLocations] = useState<Location[]>([])
  const [pricingForm, setPricingForm] = useState({
    basePricePerKm: 28,
    roundTripDiscountPercent: 15,
    minTripPriceEtb: 5000,
    reeferPremiumEtb: 3000,
    weekendPremiumPercent: 10,
    detentionPerHourEtb: 500,
  })
  const [previewForm, setPreviewForm] = useState({
    originLocationId: '',
    destinationLocationId: '',
    containerSize: 'FORTY_FT' as ContainerSize,
    isRoundTrip: false,
  })
  const [quote, setQuote] = useState<QuotePreview | null>(null)

  useEffect(() => {
    Promise.all([getOrgPricing(), listOrgLocations()])
      .then(([pricingRes, locRes]) => {
        const p = pricingRes.data
        setPricingForm({
          basePricePerKm: p.basePricePerKm,
          roundTripDiscountPercent: p.roundTripDiscountPercent,
          minTripPriceEtb: p.minTripPriceEtb,
          reeferPremiumEtb: p.surcharges?.reeferPremiumEtb ?? 3000,
          weekendPremiumPercent: p.surcharges?.weekendPremiumPercent ?? 10,
          detentionPerHourEtb: p.surcharges?.detentionPerHourEtb ?? 500,
        })
        setLocations(locRes.data)
        const djibouti = locRes.data.find((l) => l.name.includes('Djibouti'))
        const addis = locRes.data.find((l) => l.name.includes('Addis'))
        if (djibouti && addis) {
          setPreviewForm((f) => ({ ...f, originLocationId: djibouti.id, destinationLocationId: addis.id }))
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      await updateOrgPricing({
        basePricePerKm: pricingForm.basePricePerKm,
        roundTripDiscountPercent: pricingForm.roundTripDiscountPercent,
        minTripPriceEtb: pricingForm.minTripPriceEtb,
        surcharges: {
          reeferPremiumEtb: pricingForm.reeferPremiumEtb,
          hazardousPremiumEtb: 0,
          weekendPremiumPercent: pricingForm.weekendPremiumPercent,
          detentionPerHourEtb: pricingForm.detentionPerHourEtb,
        },
      })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async () => {
    if (!previewForm.originLocationId || !previewForm.destinationLocationId) return
    try {
      const res = await previewOrgPricing(previewForm)
      setQuote(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed')
    }
  }

  if (loading) return <Loading />

  const originName = locations.find((l) => l.id === previewForm.originLocationId)?.name
  const destName = locations.find((l) => l.id === previewForm.destinationLocationId)?.name

  return (
    <div>
      <PageHeader
        title="Pricing Settings"
        description="Configure your organization's ETB rates for the Djibouti–Addis corridor"
      />

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {saved && <div className="mb-4"><Alert variant="success">Pricing saved successfully</Alert></div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="font-bold text-slate-900">ETB Pricing Rules</h3>
          <form onSubmit={handleSave} className="mt-5 space-y-4">
            <Field label="Base price per km (ETB)">
              <Input type="number" min={0} value={pricingForm.basePricePerKm}
                onChange={(e) => setPricingForm({ ...pricingForm, basePricePerKm: Number(e.target.value) })} />
            </Field>
            <Field label="Round-trip discount (%)">
              <Input type="number" min={0} max={100} value={pricingForm.roundTripDiscountPercent}
                onChange={(e) => setPricingForm({ ...pricingForm, roundTripDiscountPercent: Number(e.target.value) })} />
            </Field>
            <Field label="Min trip price (ETB)">
              <Input type="number" min={0} value={pricingForm.minTripPriceEtb}
                onChange={(e) => setPricingForm({ ...pricingForm, minTripPriceEtb: Number(e.target.value) })} />
            </Field>
            <Field label="Reefer premium (ETB)">
              <Input type="number" min={0} value={pricingForm.reeferPremiumEtb}
                onChange={(e) => setPricingForm({ ...pricingForm, reeferPremiumEtb: Number(e.target.value) })} />
            </Field>
            <Field label="Weekend premium (%)">
              <Input type="number" min={0} value={pricingForm.weekendPremiumPercent}
                onChange={(e) => setPricingForm({ ...pricingForm, weekendPremiumPercent: Number(e.target.value) })} />
            </Field>
            <Field label="Detention per hour (ETB)">
              <Input type="number" min={0} value={pricingForm.detentionPerHourEtb}
                onChange={(e) => setPricingForm({ ...pricingForm, detentionPerHourEtb: Number(e.target.value) })} />
            </Field>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Pricing'}</Button>
          </form>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50/50 to-white">
          <h3 className="font-bold text-slate-900">Quote Preview</h3>
          <div className="mt-5 space-y-3">
            <Select value={previewForm.originLocationId}
              onChange={(e) => setPreviewForm({ ...previewForm, originLocationId: e.target.value })}>
              <option value="">Origin</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>
            <Select value={previewForm.destinationLocationId}
              onChange={(e) => setPreviewForm({ ...previewForm, destinationLocationId: e.target.value })}>
              <option value="">Destination</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>
            <Select value={previewForm.containerSize}
              onChange={(e) => setPreviewForm({ ...previewForm, containerSize: e.target.value as ContainerSize })}>
              <option value="TWENTY_FT">20ft</option>
              <option value="FORTY_FT">40ft</option>
              <option value="FORTY_FT_HC">40ft HC</option>
            </Select>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={previewForm.isRoundTrip}
                onChange={(e) => setPreviewForm({ ...previewForm, isRoundTrip: e.target.checked })}
                className="rounded border-slate-300 text-korecha-primary" />
              Round trip
            </label>
            <Button type="button" variant="secondary" onClick={handlePreview} className="w-full">
              Calculate Quote
            </Button>
          </div>
          {quote && (
            <div className="mt-6 rounded-xl border border-blue-200 bg-white p-5">
              <p className="text-sm text-korecha-muted">{originName} → {destName}</p>
              <p className="mt-2 text-3xl font-bold text-korecha-primary">{formatEtb(quote.totalEtb)}</p>
              <p className="mt-1 text-xs text-slate-400">{quote.distanceKm} km</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
