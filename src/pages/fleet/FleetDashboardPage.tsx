import { useEffect, useState } from 'react'
import { getFleetProfile } from '../../api/fleet'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { fileUrl } from '../../utils/fileUrl'
import type { FleetProfile } from '../../types'

export function FleetDashboardPage() {
  const { memberProfile } = useAuth()
  const [data, setData] = useState<{ profile: FleetProfile; driverCount: number; truckCount: number } | null>(null)
  const approved = isApproved(memberProfile)

  useEffect(() => {
    getFleetProfile().then((r) => setData(r.data)).catch(() => {})
  }, [])

  const profile = data?.profile

  return (
    <div>
      <PageHeader title="Fleet Overview" description={profile?.fleetName || 'Your fleet dashboard'} />
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-korecha-muted">Status</p>
          <div className="mt-2">{profile?.status && <Badge status={profile.status} />}</div>
        </Card>
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
