import { getTruckOwnerProfile, useAuth } from '../../auth/AuthContext'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'

export function TruckOwnerHomePage() {
  const { user, memberProfile } = useAuth()
  const profile = getTruckOwnerProfile(memberProfile)

  return (
    <div className="space-y-4">
      <PageHeader title={profile?.ownerName || user?.fullName || 'Truck Owner'} description="Your trucks and availability" />
      <div className="rounded-2xl border border-korecha-border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Application Status</h3>
          {profile?.status && <Badge status={profile.status} />}
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Can post availability directly</span>
            <span className="font-medium text-slate-900">{profile?.canPostAvailability ? 'Yes' : 'No — admin-granted only'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Affiliated fleet manager</span>
            <span className="font-medium text-slate-900">
              {typeof profile?.fleetManagerId === 'object' && profile.fleetManagerId ? profile.fleetManagerId.fleetName : 'None'}
            </span>
          </div>
        </div>
      </div>
      <p className="text-sm text-korecha-muted">
        Truck registration, driver hiring, and availability posting for truck owners are coming soon.
      </p>
    </div>
  )
}
