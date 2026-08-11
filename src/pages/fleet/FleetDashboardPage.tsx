import { useEffect, useState } from 'react'
import { getFleetProfile } from '../../api/fleet'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { fileUrl } from '../../utils/fileUrl'
import { PROVIDER_TYPE_LABELS } from '../../utils/format'
import type { FleetProfile } from '../../types'

export function FleetDashboardPage() {
  const { memberProfile } = useAuth()
  const [data, setData] = useState<{ profile: FleetProfile; driverCount: number; truckCount: number } | null>(null)
  const approved = isApproved(memberProfile)
  const sessionProfile = memberProfile?.type === 'fleet' ? (memberProfile.profile as FleetProfile) : null

  useEffect(() => {
    getFleetProfile().then((r) => setData(r.data)).catch(() => {})
  }, [])

  const profile = data?.profile ?? sessionProfile
  const staff = profile?.staff ?? sessionProfile?.staff
  const providerType = profile?.providerType ?? sessionProfile?.providerType

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
