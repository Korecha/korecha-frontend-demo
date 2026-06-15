import { useEffect, useState } from 'react'
import { getDriverProfile, listDriverLocations, updateDriverRoutes } from '../../api/driver'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { DriverMap } from '../../components/driver/DriverMap'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { refName } from '../../utils/format'
import type { Location } from '../../types'

export function DriverRoutesPage() {
  const { memberProfile } = useAuth()
  const approved = isApproved(memberProfile)
  const [locations, setLocations] = useState<Location[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([listDriverLocations(), getDriverProfile()])
      .then(([locRes, profileRes]) => {
        setLocations(locRes.data)
        const ids = (profileRes.data.profile.preferredRouteIds || []).map((r) =>
          typeof r === 'string' ? r : r.id
        )
        setSelected(ids)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
    setSaved(false)
  }

  const filtered = locations.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.region.toLowerCase().includes(search.toLowerCase())
  )

  const selectedLocations = locations.filter((l) => selected.includes(l.id))

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await updateDriverRoutes(selected)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!approved) {
    return (
      <Alert variant="warning">Route preferences can be edited after your account is approved.</Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Route preferences</h2>
        <p className="mt-1 text-sm text-korecha-muted">
          Select corridor locations you prefer to haul between. Importers will match you by area.
        </p>
      </div>

      <DriverMap
        className="h-[32vh] min-h-[200px]"
        routeLocations={selectedLocations}
        interactive
      />

      <Input
        type="search"
        placeholder="Search locations..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="rounded-2xl"
      />

      {error && <Alert>{error}</Alert>}
      {saved && <Alert variant="success">Route preferences saved</Alert>}

      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-korecha-muted">Loading locations...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-korecha-muted">No locations found</p>
        ) : (
          filtered.map((loc) => {
            const active = selected.includes(loc.id)
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => toggle(loc.id)}
                className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                  active
                    ? 'border-korecha-primary bg-blue-50/60 shadow-sm'
                    : 'border-korecha-border bg-white hover:border-blue-200'
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                    active ? 'bg-korecha-primary text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {active ? '✓' : '○'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{loc.name}</p>
                  <p className="text-xs text-korecha-muted">{loc.region} · {loc.type.replace(/_/g, ' ')}</p>
                </div>
              </button>
            )
          })
        )}
      </div>

      {selected.length > 0 && (
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-korecha-muted">Selected ({selected.length})</p>
          <p className="mt-2 text-sm text-slate-700">
            {selectedLocations.map((l) => refName(l, '')).join(' · ')}
          </p>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full py-3.5 text-base">
        {saving ? 'Saving...' : 'Save preferences'}
      </Button>
    </div>
  )
}
