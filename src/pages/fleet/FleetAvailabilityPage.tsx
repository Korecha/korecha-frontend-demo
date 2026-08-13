import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createAvailabilityPosting, listAvailabilityPostings, listFleetLocations, listFleetTrucks } from '../../api/fleet'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Select } from '../../components/ui/Input'
import { LocationAutocomplete } from '../../components/ui/LocationAutocomplete'
import { PageHeader } from '../../components/ui/PageHeader'
import { refName } from '../../utils/format'
import type { AvailabilityPosting, Location, Truck } from '../../types'
import { toDatetimeLocalValue } from '../../utils/datetime'

export function FleetAvailabilityPage() {
  const { memberProfile } = useAuth()
  const approved = isApproved(memberProfile)
  const [postings, setPostings] = useState<AvailabilityPosting[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    originLocationId: '',
    truckId: '',
    availableFrom: '',
    availableTo: '',
  })

  const load = () => {
    if (!approved) {
      setLoading(false)
      return
    }
    setLoading(true)
    listAvailabilityPostings()
      .then((r) => setPostings(r.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load availability postings'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    if (!approved) return
    listFleetLocations().then((r) => setLocations(r.data)).catch(() => {})
    listFleetTrucks().then((r) => setTrucks(r.data)).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approved])

  const approvedTrucks = useMemo(() => trucks.filter((t) => t.status === 'APPROVED'), [trucks])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.originLocationId || !form.availableFrom || !form.availableTo) {
      setError('Fill in origin location and the availability window')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await createAvailabilityPosting({
        originLocationId: form.originLocationId,
        truckId: form.truckId || undefined,
        availableFrom: new Date(form.availableFrom).toISOString(),
        availableTo: new Date(form.availableTo).toISOString(),
      })
      setPostings((prev) => [res.data, ...prev])
      setForm({ originLocationId: '', truckId: '', availableFrom: '', availableTo: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post availability')
    } finally {
      setSubmitting(false)
    }
  }

  if (!approved) {
    return (
      <div>
        <PageHeader title="Availability" description="Post upcoming truck availability windows" />
        <Alert variant="warning">Available after your fleet account is approved.</Alert>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Availability"
        description="Let the matching engine and importers know where your trucks will be free"
      />

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <Card className="mb-6">
        <h3 className="font-bold text-slate-900">Post availability</h3>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <LocationAutocomplete
            label="Origin location"
            value={form.originLocationId}
            locations={locations}
            onChange={(originLocationId) => setForm({ ...form, originLocationId })}
            required
          />
          <Field label="Truck (optional)">
            <Select value={form.truckId} onChange={(e) => setForm({ ...form, truckId: e.target.value })}>
              <option value="">Any truck in the pool</option>
              {approvedTrucks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.plateNumber} · {refName(t.truckTypeId)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Available from">
            <input
              type="datetime-local"
              className="w-full rounded-xl border border-korecha-border bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-korecha-primary focus:outline-none focus:ring-4 focus:ring-korecha-ring/40"
              value={form.availableFrom}
              min={toDatetimeLocalValue(new Date())}
              onChange={(e) => setForm({ ...form, availableFrom: e.target.value })}
              required
            />
          </Field>
          <Field label="Available to">
            <input
              type="datetime-local"
              className="w-full rounded-xl border border-korecha-border bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-korecha-primary focus:outline-none focus:ring-4 focus:ring-korecha-ring/40"
              value={form.availableTo}
              min={form.availableFrom || toDatetimeLocalValue(new Date())}
              onChange={(e) => setForm({ ...form, availableTo: e.target.value })}
              required
            />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Posting...' : 'Post availability'}
            </Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <p className="text-sm text-slate-500">Loading availability postings...</p>
      ) : postings.length === 0 ? (
        <Card>
          <p className="font-semibold text-slate-900">No availability posted yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Post a window above so importers and the matching engine can see your open trucks.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {postings.map((posting) => (
            <Card key={posting.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{refName(posting.originLocationId)}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {new Date(posting.availableFrom).toLocaleString()} → {new Date(posting.availableTo).toLocaleString()}
                </p>
                {posting.truckId && (
                  <p className="mt-1 text-xs text-slate-500">
                    Truck: {typeof posting.truckId === 'object' ? posting.truckId.plateNumber : posting.truckId}
                  </p>
                )}
              </div>
              <Badge status={posting.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
