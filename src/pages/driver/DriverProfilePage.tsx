import { useEffect, useState } from 'react'
import { getDriverProfile } from '../../api/driver'
import { useAuth } from '../../auth/AuthContext'
import { Badge } from '../../components/ui/Badge'
import { fileUrl } from '../../utils/fileUrl'
import { refName } from '../../utils/format'
import type { DriverProfile } from '../../types'

export function DriverProfilePage() {
  const { user, organization } = useAuth()
  const [profile, setProfile] = useState<DriverProfile | null>(null)

  useEffect(() => {
    getDriverProfile().then((r) => setProfile(r.data.profile)).catch(() => {})
  }, [])

  const routes = (profile?.preferredRouteIds || [])
    .map((r) => refName(r, ''))
    .filter(Boolean)

  const rows = [
    ['Email', user?.email],
    ['Phone', user?.phone || '—'],
    ['Organization', organization?.name],
    ['Truck type', refName(profile?.truckTypeId)],
    ['Fleet', typeof profile?.fleetOwnerId === 'object' ? profile.fleetOwnerId.fullName : 'Independent'],
    ['Routes', routes.length ? routes.join(', ') : '—'],
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-korecha-navy to-blue-700 p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold backdrop-blur">
            {user?.fullName?.charAt(0) || 'D'}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.fullName}</h2>
            <p className="text-sm text-blue-100/80">Driver · {organization?.name}</p>
            {profile?.status && (
              <div className="mt-2">
                <Badge status={profile.status} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-korecha-border bg-white p-5 shadow-sm">
        <h3 className="font-bold text-slate-900">Details</h3>
        <dl className="mt-4 space-y-3">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-slate-50 pb-3 last:border-0">
              <dt className="text-sm text-korecha-muted">{label}</dt>
              <dd className="max-w-[55%] text-right text-sm font-medium text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-3xl border border-korecha-border bg-white p-5 shadow-sm">
        <h3 className="font-bold text-slate-900">Documents</h3>
        <div className="mt-4 flex flex-col gap-3">
          {profile?.nationalIdFile ? (
            <a
              href={fileUrl(profile.nationalIdFile)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 font-medium text-korecha-primary hover:bg-blue-50"
            >
              <span className="text-2xl">🪪</span> National ID
            </a>
          ) : null}
          {profile?.driversLicenseFile ? (
            <a
              href={fileUrl(profile.driversLicenseFile)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 font-medium text-korecha-primary hover:bg-blue-50"
            >
              <span className="text-2xl">📄</span> Driver&apos;s License
            </a>
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-5 text-center">
        <p className="text-sm font-semibold text-slate-700">Importer marketplace</p>
        <p className="mt-1 text-xs text-korecha-muted">
          Your live location and route preferences help importers find and request your truck.
        </p>
      </div>
    </div>
  )
}
