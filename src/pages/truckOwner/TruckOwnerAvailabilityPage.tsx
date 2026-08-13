import { useEffect, useState, type FormEvent } from 'react'
import {
  createTruckOwnerAvailabilityPosting,
  listTruckOwnerAvailabilityPostings,
  listTruckOwnerLocations,
} from '../../api/truckOwner'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field } from '../../components/ui/Input'
import { LocationAutocomplete } from '../../components/ui/LocationAutocomplete'
import { PageHeader } from '../../components/ui/PageHeader'
import { refName } from '../../utils/format'
import { toDatetimeLocalValue } from '../../utils/datetime'
import type { AvailabilityPosting, Location, TruckOwnerProfile } from '../../types'

export function TruckOwnerAvailabilityPage() {
  const { memberProfile } = useAuth()
  const approved = isApproved(memberProfile)
  const profile =
    memberProfile?.type === 'truckOwner' ? (memberProfile.profile as TruckOwnerProfile) : null
  const canPost = approved && Boolean(profile?.canPostAvailability)

  const [postings, setPostings] = useState<AvailabilityPosting[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ originLocationId: '', availableFrom: '', availableTo: '' })

  useEffect(() => {
    if (!canPost) {
      setLoading(false)
      return
    }
    setLoading(true)
    Promise.all([listTruckOwnerAvailabilityPostings(), listTruckOwnerLocations()])
      .then(([postingsRes, locationsRes]) => {
        setPostings(postingsRes.data)
        setLocations(locationsRes.data)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load availability postings'))
      .finally(() => setLoading(false))
  }, [canPost])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.originLocationId || !form.availableFrom || !form.availableTo) {
      setError('Fill in origin location and the availability window')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await createTruckOwnerAvailabilityPosting({
        originLocationId: form.originLocationId,
        availableFrom: new Date(form.availableFrom).toISOString(),
        availableTo: new Date(form.availableTo).toISOString(),
      })
      setPostings((prev) => [res.data, ...prev])
      setForm({ originLocationId: '', availableFrom: '', availableTo: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post availability')
    } finally {
      setSubmitting(false)
    }
  }

  if (!approved) {
    return (
      <div>
        <PageHeader title="Availability" description="Post when and where your truck is free" />
        <Alert variant="warning">Available after your account is approved.</Alert>
      </div>
    )
  }

  if (!canPost) {
    return (
      <div>
        <PageHeader title="Availability" description="Post when and where your truck is free" />
        <Alert variant="warning">
          Availability posting has not been granted for this account yet. Ask a platform admin to enable it.
        </Alert>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Availability" description="Post when and where your truck is free" />

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
          <div />
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
            Post a window above so importers and fleet managers can see you're free.
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
              </div>
              <Badge status={posting.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
