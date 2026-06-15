import { useEffect, useState, type FormEvent } from 'react'
import { getSettings, updateSettings } from '../../api/admin'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Input } from '../../components/ui/Input'
import { Loading } from '../../components/ui/Loading'
import { PageHeader } from '../../components/ui/PageHeader'
import type { PlatformSettings } from '../../types'

export function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [form, setForm] = useState({
    defaultBasePricePerKm: 28,
    minTripPriceEtb: 5000,
    platformCommissionPercent: 0,
    demurrageAlertHours: 48,
    corridorDistanceKm: 780,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getSettings()
      .then((res) => {
        setSettings(res.data)
        setForm({
          defaultBasePricePerKm: res.data.defaultBasePricePerKm,
          minTripPriceEtb: res.data.minTripPriceEtb,
          platformCommissionPercent: res.data.platformCommissionPercent,
          demurrageAlertHours: res.data.demurrageAlertHours,
          corridorDistanceKm: res.data.corridorDistanceKm?.djibouti_to_addis ?? 780,
        })
      })
      .catch((err) => setError(err.message))
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const res = await updateSettings({
        defaultBasePricePerKm: form.defaultBasePricePerKm,
        minTripPriceEtb: form.minTripPriceEtb,
        platformCommissionPercent: form.platformCommissionPercent,
        demurrageAlertHours: form.demurrageAlertHours,
        corridorDistanceKm: { djibouti_to_addis: form.corridorDistanceKm },
      })
      setSettings(res.data)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!settings && !error) return <Loading />
  if (error && !settings) return <Alert>{error}</Alert>

  return (
    <div>
      <PageHeader
        title="Platform Settings"
        description="Global ETB defaults and corridor configuration"
      />

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {saved && <div className="mb-4"><Alert variant="success">Settings saved successfully</Alert></div>}

      <Card className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Default base price per km (ETB)">
            <Input type="number" min={0} value={form.defaultBasePricePerKm}
              onChange={(e) => setForm({ ...form, defaultBasePricePerKm: Number(e.target.value) })} />
          </Field>
          <Field label="Minimum trip price (ETB)">
            <Input type="number" min={0} value={form.minTripPriceEtb}
              onChange={(e) => setForm({ ...form, minTripPriceEtb: Number(e.target.value) })} />
          </Field>
          <Field label="Platform commission (%)">
            <Input type="number" min={0} max={100} value={form.platformCommissionPercent}
              onChange={(e) => setForm({ ...form, platformCommissionPercent: Number(e.target.value) })} />
          </Field>
          <Field label="Demurrage alert (hours before last free day)">
            <Input type="number" min={0} value={form.demurrageAlertHours}
              onChange={(e) => setForm({ ...form, demurrageAlertHours: Number(e.target.value) })} />
          </Field>
          <Field label="Djibouti → Addis corridor distance (km)">
            <Input type="number" min={0} value={form.corridorDistanceKm}
              onChange={(e) => setForm({ ...form, corridorDistanceKm: Number(e.target.value) })} />
          </Field>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
        </form>
      </Card>
    </div>
  )
}
