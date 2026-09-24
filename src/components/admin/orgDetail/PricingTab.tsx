import { useEffect, useState, type FormEvent } from 'react'
import { listLocations, previewPricing, updatePricing } from '../../../api/admin'
import { Alert } from '../../ui/Alert'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Field, Input, Select } from '../../ui/Input'
import type { ContainerSize, Location, Organization, QuotePreview } from '../../../types'
import { formatEtb } from '../../../utils/format'

export function PricingTab({
  orgId,
  org,
  onRefresh,
}: {
  orgId: string
  org: Organization
  onRefresh: () => void
}) {
  const [locations, setLocations] = useState<Location[]>([])
  const [error, setError] = useState('')
  const [pricingForm, setPricingForm] = useState({
    basePricePerKm: org.pricing?.basePricePerKm ?? 28,
    roundTripDiscountPercent: org.pricing?.roundTripDiscountPercent ?? 15,
    minTripPriceEtb: org.pricing?.minTripPriceEtb ?? 5000,
    reeferPremiumEtb: org.pricing?.surcharges?.reeferPremiumEtb ?? 3000,
    weekendPremiumPercent: org.pricing?.surcharges?.weekendPremiumPercent ?? 10,
    detentionPerHourEtb: org.pricing?.surcharges?.detentionPerHourEtb ?? 500,
  })
  const [previewForm, setPreviewForm] = useState({
    originLocationId: '',
    destinationLocationId: '',
    containerSize: 'FORTY_FT' as ContainerSize,
    isRoundTrip: false,
  })
  const [quote, setQuote] = useState<QuotePreview | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listLocations().then((res) => {
      setLocations(res.data)
      const djibouti = res.data.find((l) => l.name.includes('Djibouti'))
      const addis = res.data.find((l) => l.name.includes('Addis'))
      if (djibouti && addis) {
        setPreviewForm((f) => ({
          ...f,
          originLocationId: djibouti.id,
          destinationLocationId: addis.id,
        }))
      }
    })
  }, [])

  const handleSavePricing = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updatePricing(orgId, {
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
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pricing')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async () => {
    if (!previewForm.originLocationId || !previewForm.destinationLocationId) return
    try {
      const res = await previewPricing(orgId, previewForm)
      setQuote(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed')
    }
  }

  const originName = locations.find((l) => l.id === previewForm.originLocationId)?.name
  const destName = locations.find((l) => l.id === previewForm.destinationLocationId)?.name

  return (
    <>
      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="font-bold text-slate-900">ETB Pricing Rules</h3>
          <form onSubmit={handleSavePricing} className="mt-5 space-y-4">
            <Field label="Base price per km (ETB)">
              <Input
                type="number"
                min={0}
                value={pricingForm.basePricePerKm}
                onChange={(e) =>
                  setPricingForm({ ...pricingForm, basePricePerKm: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Round-trip discount (%)">
              <Input
                type="number"
                min={0}
                max={100}
                value={pricingForm.roundTripDiscountPercent}
                onChange={(e) =>
                  setPricingForm({
                    ...pricingForm,
                    roundTripDiscountPercent: Number(e.target.value),
                  })
                }
              />
            </Field>
            <Field label="Min trip price (ETB)">
              <Input
                type="number"
                min={0}
                value={pricingForm.minTripPriceEtb}
                onChange={(e) =>
                  setPricingForm({ ...pricingForm, minTripPriceEtb: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Reefer premium (ETB)">
              <Input
                type="number"
                min={0}
                value={pricingForm.reeferPremiumEtb}
                onChange={(e) =>
                  setPricingForm({ ...pricingForm, reeferPremiumEtb: Number(e.target.value) })
                }
              />
            </Field>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Pricing'}
            </Button>
          </form>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50/50 to-white">
          <h3 className="font-bold text-slate-900">Quote Preview</h3>
          <div className="mt-5 space-y-3">
            <Select
              value={previewForm.originLocationId}
              onChange={(e) =>
                setPreviewForm({ ...previewForm, originLocationId: e.target.value })
              }
            >
              <option value="">Origin</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
            <Select
              value={previewForm.destinationLocationId}
              onChange={(e) =>
                setPreviewForm({ ...previewForm, destinationLocationId: e.target.value })
              }
            >
              <option value="">Destination</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
            <Select
              value={previewForm.containerSize}
              onChange={(e) =>
                setPreviewForm({ ...previewForm, containerSize: e.target.value as ContainerSize })
              }
            >
              <option value="TWENTY_FT">20ft</option>
              <option value="FORTY_FT">40ft</option>
              <option value="FORTY_FT_HC">40ft HC</option>
            </Select>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={previewForm.isRoundTrip}
                onChange={(e) =>
                  setPreviewForm({ ...previewForm, isRoundTrip: e.target.checked })
                }
                className="rounded border-slate-300 text-korecha-primary focus:ring-korecha-ring"
              />
              Round trip
            </label>
            <Button type="button" variant="secondary" onClick={handlePreview} className="w-full">
              Calculate Quote
            </Button>
          </div>
          {quote && (
            <div className="mt-6 rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-korecha-muted">
                {originName} → {destName}
                {previewForm.isRoundTrip ? ' (round trip)' : ''}
              </p>
              <p className="mt-2 text-3xl font-bold text-korecha-primary">
                {formatEtb(quote.totalEtb)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {quote.distanceKm} km · base {formatEtb(quote.breakdown.base)}
              </p>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
