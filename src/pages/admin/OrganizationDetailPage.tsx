import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getOrganization } from '../../api/admin'
import { ContainersTab } from '../../components/admin/orgDetail/ContainersTab'
import { LoadPostingsTab } from '../../components/admin/orgDetail/LoadPostingsTab'
import { OverviewTab } from '../../components/admin/orgDetail/OverviewTab'
import { PricingTab } from '../../components/admin/orgDetail/PricingTab'
import { ProfileTab } from '../../components/admin/orgDetail/ProfileTab'
import { ShipmentsTab } from '../../components/admin/orgDetail/ShipmentsTab'
import { TruckOwnersTab } from '../../components/admin/orgDetail/TruckOwnersTab'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Loading } from '../../components/ui/Loading'
import { PillTabs } from '../../components/ui/Tabs'
import type { Organization, OrgType } from '../../types'

export type OrgDetailTab =
  | 'overview'
  | 'profile'
  | 'truck-owners'
  | 'containers'
  | 'load-postings'
  | 'shipments'
  | 'pricing'

const TAB_LABELS: Record<OrgDetailTab, string> = {
  overview: 'overview',
  profile: 'profile',
  'truck-owners': 'truck owners',
  containers: 'containers',
  'load-postings': 'load postings',
  shipments: 'shipments',
  pricing: 'pricing',
}

const TAB_ORDER: OrgDetailTab[] = [
  'overview',
  'profile',
  'truck-owners',
  'containers',
  'load-postings',
  'shipments',
  'pricing',
]

function visibleTabsFor(type?: OrgType): OrgDetailTab[] {
  return TAB_ORDER.filter((tab) => {
    if (tab === 'overview' || tab === 'profile' || tab === 'pricing') return true
    if (tab === 'truck-owners') return type === 'FLEET_MANAGER' || type === 'TRUCKING'
    if (tab === 'containers') return type === 'SHIPPING_LINE'
    if (tab === 'load-postings') return type === 'IMPORTER' || type === 'EXPORTER'
    if (tab === 'shipments') {
      return (
        type === 'IMPORTER' ||
        type === 'EXPORTER' ||
        type === 'FLEET_MANAGER' ||
        type === 'TRUCKING'
      )
    }
    return false
  })
}

export function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [org, setOrg] = useState<Organization | null>(null)
  const [error, setError] = useState('')

  const loadOrg = useCallback(() => {
    if (!id) return
    getOrganization(id)
      .then((res) => setOrg(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load organization'))
  }, [id])

  useEffect(() => {
    loadOrg()
  }, [loadOrg])

  const visibleTabs = useMemo(() => visibleTabsFor(org?.type), [org?.type])

  const tabParam = searchParams.get('tab')
  const tab: OrgDetailTab = visibleTabs.includes(tabParam as OrgDetailTab)
    ? (tabParam as OrgDetailTab)
    : 'overview'

  const setTab = (next: OrgDetailTab) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        params.set('tab', next)
        params.delete('expand')
        params.delete('highlight')
        return params
      },
      { replace: true },
    )
  }

  if (error && !org) return <Alert>{error}</Alert>
  if (!org || !id) return <Loading />

  return (
    <div>
      <Link
        to="/admin/organizations"
        className="inline-flex items-center gap-1 text-sm font-medium text-korecha-primary hover:underline"
      >
        ← Back to Organizations
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{org.name}</h1>
        <Badge status={org.status} />
      </div>
      <p className="mt-1 text-sm text-korecha-muted">{org.containerCount ?? 0} containers</p>

      <PillTabs
        items={visibleTabs.map((key) => ({ key, label: TAB_LABELS[key] }))}
        active={tab}
        onChange={setTab}
      />

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {tab === 'overview' && <OverviewTab org={org} onGoToTruckOwners={() => setTab('truck-owners')} />}
      {tab === 'profile' && <ProfileTab org={org} onRefresh={loadOrg} />}
      {tab === 'pricing' && <PricingTab orgId={id} org={org} onRefresh={loadOrg} />}
      {tab === 'truck-owners' && <TruckOwnersTab orgId={id} />}
      {tab === 'containers' && <ContainersTab orgId={id} />}
      {tab === 'load-postings' && <LoadPostingsTab orgId={id} />}
      {tab === 'shipments' && <ShipmentsTab orgId={id} />}
    </div>
  )
}
