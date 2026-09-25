import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  createCommissionSetting,
  getCommissionMatrix,
  getSettings,
  updateSettings,
} from '../../api/admin'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Input } from '../../components/ui/Input'
import { Loading } from '../../components/ui/Loading'
import { PageHeader } from '../../components/ui/PageHeader'
import { formatDate } from '../../utils/format'
import type {
  CommissionMatrix,
  CommissionMatrixCell,
  ImporterTier,
  IntegrationFeed,
  PlatformSettings,
  ShipmentMode,
} from '../../types'

const MATRIX_MODES: ShipmentMode[] = ['UNIMODAL', 'MULTIMODAL']
const MATRIX_TIERS: ImporterTier[] = ['NORMAL', 'PREMIUM']

function matrixSourceLabel(cell: CommissionMatrixCell) {
  if (cell.source.type === 'FALLBACK' || !cell.source.setting) return 'fallback'
  if (cell.source.setting.scopeType === 'MODE_TIER') return 'MODE_TIER'
  return 'inherited'
}

function IntegrationRow({
  name,
  feed,
}: {
  name: string
  feed?: IntegrationFeed
}) {
  const lastSync = feed?.lastSyncAt ? formatDate(feed.lastSyncAt) : 'Never'
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-korecha-border py-3 last:border-0">
      <div>
        <p className="font-medium text-slate-800">{name}</p>
        <p className="text-xs text-slate-500">Last sync: {lastSync}</p>
        <p className="mt-1 text-xs text-slate-400">Placeholder — not yet integrated</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge status={feed?.status ?? 'DISCONNECTED'} />
        <Button size="sm" disabled>
          Connect
        </Button>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [form, setForm] = useState({
    defaultBasePricePerKm: 28,
    minTripPriceEtb: 5000,
    platformCommissionPercent: 0,
    demurrageAlertHours: 48,
    autoReleaseTimeoutHours: 72,
    corridorDistanceKm: 780,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [matrix, setMatrix] = useState<CommissionMatrix | null>(null)
  const [matrixError, setMatrixError] = useState('')
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [cellRate, setCellRate] = useState('')
  const [cellSaving, setCellSaving] = useState(false)

  const loadMatrix = useCallback(() => {
    getCommissionMatrix()
      .then((res) => {
        setMatrix(res.data)
        setMatrixError('')
      })
      .catch((err) => setMatrixError(err instanceof Error ? err.message : 'Failed to load matrix'))
  }, [])

  useEffect(() => {
    getSettings()
      .then((res) => {
        setSettings(res.data)
        setForm({
          defaultBasePricePerKm: res.data.defaultBasePricePerKm,
          minTripPriceEtb: res.data.minTripPriceEtb,
          platformCommissionPercent: res.data.platformCommissionPercent,
          demurrageAlertHours: res.data.demurrageAlertHours,
          autoReleaseTimeoutHours: res.data.autoReleaseTimeoutHours ?? 72,
          corridorDistanceKm: res.data.corridorDistanceKm?.djibouti_to_addis ?? 780,
        })
      })
      .catch((err) => setError(err.message))
    loadMatrix()
  }, [loadMatrix])

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
        autoReleaseTimeoutHours: form.autoReleaseTimeoutHours,
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
          <Field label="Auto-release timeout (hours)">
            <Input type="number" min={0} value={form.autoReleaseTimeoutHours}
              onChange={(e) => setForm({ ...form, autoReleaseTimeoutHours: Number(e.target.value) })} />
            <p className="mt-1 text-xs text-slate-500">
              Configuration only; automatic release is not yet scheduled.
            </p>
          </Field>
          <Field label="Djibouti → Addis corridor distance (km)">
            <Input type="number" min={0} value={form.corridorDistanceKm}
              onChange={(e) => setForm({ ...form, corridorDistanceKm: Number(e.target.value) })} />
          </Field>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
        </form>
      </Card>

      <Card className="mt-6 max-w-lg">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-800">Commission matrix</h2>
          <Link
            to="/admin/commission-settings"
            className="text-sm font-medium text-korecha-primary hover:underline"
          >
            View full rate history →
          </Link>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Importer rates by shipment mode and tier. Click a cell to set a MODE_TIER override.
        </p>
        {matrixError && (
          <div className="mb-3">
            <Alert>{matrixError}</Alert>
          </div>
        )}
        {matrix ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                    Mode
                  </th>
                  {MATRIX_TIERS.map((tier) => (
                    <th
                      key={tier}
                      className="px-2 py-2 text-left text-xs font-semibold uppercase text-slate-500"
                    >
                      {tier === 'NORMAL' ? 'Normal' : 'Premium'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX_MODES.map((mode) => (
                  <tr key={mode} className="border-t border-korecha-border">
                    <td className="px-2 py-3 font-medium text-slate-700">{mode}</td>
                    {MATRIX_TIERS.map((tier) => {
                      const key = `${mode}:${tier}`
                      const cell = matrix.cells.find((c) => c.mode === mode && c.tier === tier)
                      if (!cell) {
                        return (
                          <td key={key} className="px-2 py-3 text-slate-400">
                            —
                          </td>
                        )
                      }
                      const source = matrixSourceLabel(cell)
                      return (
                        <td key={key} className="px-2 py-3 align-top">
                          {editingCell === key ? (
                            <form
                              className="space-y-2"
                              onSubmit={async (e) => {
                                e.preventDefault()
                                setCellSaving(true)
                                setMatrixError('')
                                try {
                                  await createCommissionSetting({
                                    ratePct: Number(cellRate),
                                    scopeType: 'MODE_TIER',
                                    scopeValue: key,
                                    effectiveFrom: new Date().toISOString(),
                                  })
                                  setEditingCell(null)
                                  setCellRate('')
                                  loadMatrix()
                                } catch (err) {
                                  setMatrixError(
                                    err instanceof Error ? err.message : 'Failed to save cell',
                                  )
                                } finally {
                                  setCellSaving(false)
                                }
                              }}
                            >
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                step={0.01}
                                value={cellRate}
                                onChange={(e) => setCellRate(e.target.value)}
                                required
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button type="submit" size="sm" disabled={cellSaving}>
                                  {cellSaving ? 'Saving...' : 'Save'}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setEditingCell(null)
                                    setCellRate('')
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          ) : (
                            <button
                              type="button"
                              className="w-full rounded-lg border border-transparent px-2 py-1 text-left hover:border-korecha-border hover:bg-slate-50"
                              onClick={() => {
                                setEditingCell(key)
                                setCellRate(String(cell.ratePct))
                              }}
                            >
                              <p className="font-semibold text-slate-900">{cell.ratePct}%</p>
                              <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                                {source}
                              </p>
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !matrixError && <p className="text-sm text-slate-500">Loading matrix…</p>
        )}
      </Card>

      <Card className="mt-6 max-w-lg">
        <h2 className="mb-2 text-base font-semibold text-slate-800">Pricing precedence</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
          <li>Organization-owned item type uses its own pricing (overrides are ignored)</li>
          <li>Organization item-type override</li>
          <li>Item-type per-mode price</li>
          <li>Item-type default price</li>
          <li>Platform default</li>
        </ol>
      </Card>

      <Card className="mt-6 max-w-lg">
        <h2 className="mb-2 text-base font-semibold text-slate-800">External integrations</h2>
        <IntegrationRow name="ESL GPS feed" feed={settings?.externalIntegrations?.eslGpsFeed} />
        <IntegrationRow name="Vessel ETA feed" feed={settings?.externalIntegrations?.vesselEtaFeed} />
      </Card>
    </div>
  )
}
