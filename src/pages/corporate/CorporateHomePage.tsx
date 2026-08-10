import { getCorporateCustomerProfile, useAuth } from '../../auth/AuthContext'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'

export function CorporateHomePage() {
  const { user, memberProfile } = useAuth()
  const profile = getCorporateCustomerProfile(memberProfile)

  return (
    <div className="space-y-4">
      <PageHeader title={profile?.companyName || user?.fullName || 'Corporate Customer'} description="Priority-tier load posting and shipment tracking" />
      <div className="rounded-2xl border border-korecha-border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Application Status</h3>
          {profile?.status && <Badge status={profile.status} />}
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Tier</span>
            <span className="font-medium text-slate-900">{profile?.tier || 'CORPORATE'}</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-korecha-muted">
        Load posting and priority matching for corporate customers are coming soon.
      </p>
    </div>
  )
}
