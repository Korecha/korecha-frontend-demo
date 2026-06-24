import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { createOrgCredentials, getOrganization, listLocations, previewPricing, updatePricing } from '../../api/admin'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Input, Select } from '../../components/ui/Input'
import { Loading } from '../../components/ui/Loading'
import type { ContainerSize, Location, Organization, QuotePreview } from '../../types'
import { formatEtb, TYPE_LABELS } from '../../utils/format'

type Tab = 'profile' | 'pricing'

export function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [org, setOrg] = useState<Organization | null>(null)
  const [tab, setTab] = useState<Tab>('profile')
  const [locations, setLocations] = useState<Location[]>([])
  const [error, setError] = useState('')
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
  const [saving, setSaving] = useState(false)
  const [credForm, setCredForm] = useState({ adminFullName: '', adminEmail: '', adminPassword: '' })
  const [creatingCreds, setCreatingCreds] = useState(false)

  useEffect(() => {
    if (!id) return
    getOrganization(id)
      .then((res) => {
        setOrg(res.data)
        if (res.data.pricing) {
          setPricingForm({
            basePricePerKm: res.data.pricing.basePricePerKm,
            roundTripDiscountPercent: res.data.pricing.roundTripDiscountPercent,
            minTripPriceEtb: res.data.pricing.minTripPriceEtb,
            reeferPremiumEtb: res.data.pricing.surcharges?.reeferPremiumEtb ?? 3000,
            weekendPremiumPercent: res.data.pricing.surcharges?.weekendPremiumPercent ?? 10,
            detentionPerHourEtb: res.data.pricing.surcharges?.detentionPerHourEtb ?? 500,
          })
        }
      })
      .catch((err) => setError(err.message))

    listLocations().then((res) => {
      setLocations(res.data)
      const djibouti = res.data.find((l) => l.name.includes('Djibouti'))
      const addis = res.data.find((l) => l.name.includes('Addis'))
      if (djibouti && addis) {
        setPreviewForm((f) => ({ ...f, originLocationId: djibouti.id, destinationLocationId: addis.id }))
      }
    })
  }, [id])

  const handleSavePricing = async (e: FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    try {
      await updatePricing(id, {
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
      const res = await getOrganization(id)
      setOrg(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pricing')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async () => {
    if (!id || !previewForm.originLocationId || !previewForm.destinationLocationId) return
    try {
      const res = await previewPricing(id, previewForm)
      setQuote(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed')
    }
  }

  const handleCreateCredentials = async (e: FormEvent) => {
    e.preventDefault()
    if (!id) return
    setCreatingCreds(true)
    setError('')
    try {
      await createOrgCredentials(id, credForm)
      const res = await getOrganization(id)
      setOrg(res.data)
      setCredForm({ adminFullName: '', adminEmail: '', adminPassword: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create credentials')
    } finally {
      setCreatingCreds(false)
    }
  }

  if (error && !org) return <Alert>{error}</Alert>
  if (!org) return <Loading />

  const originName = locations.find((l) => l.id === previewForm.originLocationId)?.name
  const destName = locations.find((l) => l.id === previewForm.destinationLocationId)?.name

  return (
    <div>
      <Link to="/admin/organizations" className="inline-flex items-center gap-1 text-sm font-medium text-korecha-primary hover:underline">
        ← Back to Organizations
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{org.name}</h1>
        <Badge status={org.status} />
      </div>
      <p className="mt-1 text-sm text-korecha-muted">
        {org.containerCount ?? 0} containers
      </p>

      <div className="mt-6 flex gap-1 rounded-xl bg-blue-50/80 p-1">
        {(['profile', 'pricing'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-all ${
              tab === t ? 'bg-white text-korecha-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      {tab === 'profile' && (
        <Card className="mt-6 max-w-lg">
          <div className="space-y-4">
            {[
              ['Type', org.type ? TYPE_LABELS[org.type] : 'Unassigned'],
              ['Org Admin', org.orgAdmin?.email || 'Not set'],
              ['Email', org.contactEmail || '—'],
              ['Phone', org.phone || '—'],
              ['Address', org.address || '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <span className="text-sm text-korecha-muted">{label}</span>
                <span className="text-sm font-medium text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'profile' && !org.orgAdmin && (
        <Card className="mt-6 max-w-lg">
          <h3 className="font-bold text-slate-900">Create Organization Login</h3>
          <p className="mt-1 text-sm text-korecha-muted">This organization has no login yet. Create credentials for the org admin.</p>
          <form onSubmit={handleCreateCredentials} className="mt-4 space-y-4">
            <Field label="Admin Full Name">
              <Input value={credForm.adminFullName} onChange={(e) => setCredForm({ ...credForm, adminFullName: e.target.value })} required />
            </Field>
            <Field label="Admin Email">
              <Input type="email" value={credForm.adminEmail} onChange={(e) => setCredForm({ ...credForm, adminEmail: e.target.value })} required />
            </Field>
            <Field label="Admin Password">
              <Input type="password" value={credForm.adminPassword} onChange={(e) => setCredForm({ ...credForm, adminPassword: e.target.value })} minLength={6} required />
            </Field>
            <Button type="submit" disabled={creatingCreds}>{creatingCreds ? 'Creating...' : 'Create Login'}</Button>
          </form>
        </Card>
      )}

      {tab === 'pricing' && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="font-bold text-slate-900">ETB Pricing Rules</h3>
            <form onSubmit={handleSavePricing} className="mt-5 space-y-4">
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
                  className="rounded border-slate-300 text-korecha-primary focus:ring-korecha-ring" />
                Round trip
              </label>
              <Button type="button" variant="secondary" onClick={handlePreview} className="w-full">
                Calculate Quote
              </Button>
            </div>
            {quote && (
              <div className="mt-6 rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-korecha-muted">
                  {originName} → {destName}{previewForm.isRoundTrip ? ' (round trip)' : ''}
                </p>
                <p className="mt-2 text-3xl font-bold text-korecha-primary">{formatEtb(quote.totalEtb)}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {quote.distanceKm} km · base {formatEtb(quote.breakdown.base)}
                </p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
