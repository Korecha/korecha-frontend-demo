import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getLoadPosting } from '../../api/importer'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { JobPricingCard } from '../../components/importer/JobPricingCard'
import { PodPhotos } from '../../components/jobs/PodPhotos'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { formatDate, refName } from '../../utils/format'
import type { LoadMatchOffer, LoadPosting, ShipmentLeg } from '../../types'

function linkedJobIdOf(linked: string | { id: string } | null | undefined): string | null {
  if (!linked) return null
  return typeof linked === 'string' ? linked : linked.id
}

export function ImporterLoadPostingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { memberProfile, organization } = useAuth()
  const approved = isApproved(memberProfile)
  const canUse = approved && Boolean(organization)
  const [posting, setPosting] = useState<LoadPosting | null>(null)
  const [offers, setOffers] = useState<LoadMatchOffer[]>([])
  const [legs, setLegs] = useState<ShipmentLeg[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!canUse || !id) return
    setLoading(true)
    getLoadPosting(id)
      .then((r) => {
        setPosting({ ...r.data.loadPosting, offersSummary: r.data.offersSummary })
        setOffers(r.data.offers || [])
        setLegs(r.data.legs || [])
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load posting'))
      .finally(() => setLoading(false))
  }, [canUse, id])

  if (!approved) {
    return <Alert variant="warning">Load postings are available after your account is approved.</Alert>
  }

  if (!organization) {
    return (
      <Alert variant="warning">
        Contact the platform admin to be linked to an organization before viewing load postings.
      </Alert>
    )
  }

  if (loading) return <p className="text-sm text-slate-500">Loading load posting...</p>
  if (error) return <Alert>{error}</Alert>
  if (!posting) return <Alert>Load posting not found</Alert>

  const jobId = linkedJobIdOf(posting.linkedJobId)

  return (
    <div className="space-y-4">
      <Link to="/importer/jobs" className="inline-flex items-center gap-1 text-sm font-medium text-korecha-primary hover:underline">
        ← Back to loads
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {refName(posting.itemTypeId)} · {posting.quantity}
              {typeof posting.itemTypeId === 'object' ? ` ${posting.itemTypeId.unit}` : ''}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              <span className="font-medium text-korecha-primary">{posting.pickup.label}</span>
              {' → '}
              <span className="font-medium text-amber-600">{posting.delivery.label}</span>
            </p>
            <p className="mt-2 text-xs text-slate-500">Posted {formatDate(posting.createdAt)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge status={posting.status} />
            <Badge status={posting.matchingMode} />
            <Badge status={posting.mode} />
          </div>
        </div>

        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Matching</dt>
            <dd className="mt-1 font-medium text-slate-800">{posting.matchingMode.replace(/_/g, ' ')}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Shipment mode</dt>
            <dd className="mt-1 font-medium text-slate-800">{posting.mode}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">FX financed</dt>
            <dd className="mt-1 font-medium text-slate-800">{posting.fxFinanced ? 'Yes' : 'No'}</dd>
          </div>
          {posting.fxFinanced && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bank permit</dt>
              <dd className="mt-1 font-medium text-slate-800">{posting.bankPermitNo || '—'}</dd>
            </div>
          )}
        </dl>

        {posting.notes && (
          <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{posting.notes}</p>
        )}

        {jobId && (
          <div className="mt-5">
            <Link to={`/importer/jobs/${jobId}`}>
              <Button variant="secondary">Open linked job (nearby trucks)</Button>
            </Link>
          </div>
        )}
      </Card>

      <PodPhotos legs={legs} />

      {posting.pricingQuote && <JobPricingCard quote={posting.pricingQuote} />}

      {posting.matchingMode === 'BROADCAST' && (
        <Card>
          <h3 className="font-bold text-slate-900">Match offers</h3>
          {posting.offersSummary && (
            <p className="mt-1 text-sm text-slate-500">
              {posting.offersSummary.total} offer{posting.offersSummary.total !== 1 ? 's' : ''} sent to fleets
            </p>
          )}
          {offers.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No offer details yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {offers.map((offer) => (
                <li
                  key={offer.id}
                  className="flex items-center justify-between rounded-xl border border-korecha-border px-3 py-2 text-sm"
                >
                  <span className="text-slate-700">
                    Needs {offer.trucksNeededCount} truck{offer.trucksNeededCount !== 1 ? 's' : ''}
                  </span>
                  <Badge status={offer.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  )
}
