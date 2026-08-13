import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCorporateLoadPostings } from '../../api/corporate'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { refName } from '../../utils/format'
import type { LoadPosting } from '../../types'

export function CorporateLoadPostingsPage() {
  const { memberProfile, organization } = useAuth()
  const approved = isApproved(memberProfile)
  const canUse = approved && Boolean(organization)
  const [postings, setPostings] = useState<LoadPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!canUse) {
      setLoading(false)
      return
    }
    setLoading(true)
    listCorporateLoadPostings()
      .then((r) => setPostings(r.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load postings'))
      .finally(() => setLoading(false))
  }, [canUse])

  if (!approved) {
    return (
      <div>
        <PageHeader title="My loads" description="Loads posted by your corporate account" />
        <Alert variant="warning">Available after your account is approved.</Alert>
      </div>
    )
  }

  if (!organization) {
    return (
      <div>
        <PageHeader title="My loads" description="Loads posted by your corporate account" />
        <Alert variant="warning">
          Contact the platform admin to be linked to an organization before posting loads.
        </Alert>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="My loads"
        description="Loads posted by your corporate account"
        action={
          <Link to="/corporate/loads/new">
            <Button>+ Post load</Button>
          </Link>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading load postings...</p>
      ) : postings.length === 0 ? (
        <Card>
          <p className="font-semibold text-slate-900">No loads posted yet</p>
          <p className="mt-1 text-sm text-slate-500">Post a load to broadcast it to fleets or request a driver.</p>
          <Link to="/corporate/loads/new" className="mt-4 inline-block">
            <Button>Post a load</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {postings.map((posting) => (
            <Link
              key={posting.id}
              to={`/corporate/loads/${posting.id}`}
              className="block rounded-3xl border border-korecha-border bg-white p-4 shadow-sm transition hover:border-korecha-primary/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">
                    {refName(posting.itemTypeId)} · {posting.quantity}
                    {typeof posting.itemTypeId === 'object' ? ` ${posting.itemTypeId.unit}` : ''}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    <span className="font-medium text-korecha-primary">{posting.pickup.label}</span>
                    {' → '}
                    <span className="font-medium text-amber-600">{posting.delivery.label}</span>
                  </p>
                </div>
                <Badge status={posting.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge status={posting.matchingMode} />
                <Badge status={posting.mode} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
