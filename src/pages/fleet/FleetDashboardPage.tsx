import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFleetProfile, listMatchOffers } from '../../api/fleet'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { Card, StatCard } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { fileUrl } from '../../utils/fileUrl'
import { PROVIDER_TYPE_LABELS } from '../../utils/format'
import type { FleetProfile, LoadMatchOffer } from '../../types'

export function FleetDashboardPage() {
  const { memberProfile } = useAuth()
  const [data, setData] = useState<{ profile: FleetProfile; driverCount: number; truckCount: number } | null>(null)
  const [offers, setOffers] = useState<LoadMatchOffer[]>([])
  const approved = isApproved(memberProfile)
  const sessionProfile = memberProfile?.type === 'fleet' ? (memberProfile.profile as FleetProfile) : null

  useEffect(() => {
    getFleetProfile().then((r) => setData(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!approved) return
    listMatchOffers()
      .then((r) => setOffers(r.data))
      .catch(() => setOffers([]))
  }, [approved])

  const profile = data?.profile ?? sessionProfile
  const staff = profile?.staff ?? sessionProfile?.staff
  const providerType = profile?.providerType ?? sessionProfile?.providerType

  const activeOffers = useMemo(
    () => offers.filter((o) => o.status === 'SENT' || o.status === 'VIEWED'),
    [offers]
  )
  const trucksNeeded = useMemo(
    () => activeOffers.reduce((sum, o) => sum + (o.trucksNeededCount || 0), 0),
    [activeOffers]
  )
  const newCount = useMemo(() => offers.filter((o) => o.status === 'SENT').length, [offers])

  const staffFlags = staff
    ? [
        { key: 'canAssignJobs', label: 'Assign jobs', on: staff.canAssignJobs },
        { key: 'canViewEarnings', label: 'View earnings', on: staff.canViewEarnings },
        { key: 'canManageAffiliations', label: 'Manage affiliations', on: staff.canManageAffiliations },
        {
          key: 'canToggleTruckAvailability',
          label: 'Toggle truck availability',
          on: staff.canToggleTruckAvailability,
        },
      ]
    : []

  return (
    <div>
      <PageHeader title="Fleet Overview" description={profile?.fleetName || 'Your fleet dashboard'} />
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-korecha-muted">Status</p>
          <div className="mt-2">{profile?.status && <Badge status={profile.status} />}</div>
        </Card>
        {providerType && (
          <Card>
            <p className="text-sm text-korecha-muted">Provider type</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {PROVIDER_TYPE_LABELS[providerType] || providerType}
            </p>
            <p className="mt-1 text-xs text-korecha-muted">Descriptive metadata only</p>
          </Card>
        )}
        {approved && (
          <>
            <Card>
              <p className="text-sm text-korecha-muted">Drivers</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{data?.driverCount ?? 0}</p>
            </Card>
            <Card>
              <p className="text-sm text-korecha-muted">Approved Trucks</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{data?.truckCount ?? 0}</p>
            </Card>
          </>
        )}
      </div>

      {approved && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-900">Trucks needed</h3>
            <Link to="/fleet/match-offers">
              <Button size="sm" variant="secondary">
                View match offers
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Active offers"
              value={activeOffers.length}
              sub={newCount > 0 ? `${newCount} new` : 'Awaiting response'}
              link={
                <Link to="/fleet/match-offers" className="text-sm font-medium text-korecha-primary hover:underline">
                  Open inbox
                </Link>
              }
            />
            <StatCard
              label="Trucks needed"
              value={trucksNeeded}
              sub="Across active broadcast loads"
              warn={trucksNeeded > 0}
            />
            <StatCard
              label="Total offers"
              value={offers.length}
              sub="Including assigned & declined"
            />
          </div>
          {activeOffers.length > 0 && (
            <Card className="mt-4">
              <ul className="divide-y divide-korecha-border">
                {activeOffers.slice(0, 5).map((offer) => {
                  const posting =
                    offer.loadPosting ||
                    (typeof offer.loadPostingId === 'object' ? offer.loadPostingId : null)
                  return (
                    <li key={offer.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {posting
                            ? `${posting.pickup.label} → ${posting.delivery.label}`
                            : 'Broadcast load'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {offer.trucksNeededCount} truck{offer.trucksNeededCount !== 1 ? 's' : ''} needed
                        </p>
                      </div>
                      <Badge status={offer.status} />
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}
        </div>
      )}

      {staffFlags.length > 0 && (
        <Card className="mt-6 max-w-lg">
          <h3 className="font-bold text-slate-900">Your staff permissions</h3>
          <ul className="mt-3 space-y-2">
            {staffFlags.map((flag) => (
              <li key={flag.key} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{flag.label}</span>
                <span className={flag.on ? 'font-semibold text-emerald-700' : 'text-slate-400'}>
                  {flag.on ? 'Allowed' : 'Denied'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {profile?.ceoNationalIdFile && (
        <Card className="mt-6 max-w-lg">
          <h3 className="font-bold text-slate-900">CEO National ID</h3>
          <a href={fileUrl(profile.ceoNationalIdFile)} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium text-korecha-primary hover:underline">
            View document
          </a>
        </Card>
      )}
    </div>
  )
}
