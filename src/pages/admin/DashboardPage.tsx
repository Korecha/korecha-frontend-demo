import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats, listContainers, listLocations } from '../../api/admin'
import { AdminCorridorMap } from '../../components/admin/AdminCorridorMap'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Card, StatCard } from '../../components/ui/Card'
import { LinkButton } from '../../components/ui/LinkButton'
import { Loading } from '../../components/ui/Loading'
import { PageHeader } from '../../components/ui/PageHeader'
import { StarRating } from '../../components/ui/StarRating'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import { ChipTabs } from '../../components/ui/Tabs'
import type { Container, DashboardPeriodKey, DashboardStats, Location } from '../../types'
import { formatDate, formatEtb, SIZE_LABELS, TYPE_LABELS } from '../../utils/format'

const PERIOD_TABS: { key: DashboardPeriodKey; label: string }[] = [
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
  { key: 'all', label: 'All' },
]

function demurrageTimeRemaining(lastFreeDay?: string | null): string {
  if (!lastFreeDay) return '—'
  const diffMs = new Date(lastFreeDay).getTime() - Date.now()
  if (diffMs <= 0) return 'Expired'

  const hours = Math.ceil(diffMs / (60 * 60 * 1000))
  if (hours < 24) return `${hours}h left`

  const days = Math.ceil(hours / 24)
  return `${days}d left`
}

function orgTypeLabel(type: string): string {
  if (!type || type.toLowerCase() === 'null') return 'Unassigned'
  return TYPE_LABELS[type] || type.replace(/_/g, ' ').toLowerCase()
}

function periodLabel(key: DashboardPeriodKey) {
  if (key === 'all') return 'all time'
  return key
}

function ModeRatioBar({ unimodal, multimodal }: { unimodal: number; multimodal: number }) {
  const total = unimodal + multimodal
  const uniPct = total > 0 ? (unimodal / total) * 100 : 50
  return (
    <div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="flex h-full w-full">
          <div className="bg-korecha-primary" style={{ width: `${uniPct}%` }} />
          <div className="bg-violet-400" style={{ width: `${100 - uniPct}%` }} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Unimodal {unimodal}</span>
        <span>Multimodal {multimodal}</span>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriodKey>('30d')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [containers, setContainers] = useState<Container[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [demurrageAlertHours, setDemurrageAlertHours] = useState(48)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([listContainers({ page: 1 }), listLocations()])
      .then(([containersRes, locationsRes]) => {
        setContainers(containersRes.data)
        setLocations(locationsRes.data)
        setDemurrageAlertHours(containersRes.meta.demurrageAlertHours ?? 48)
      })
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    getDashboardStats({ period })
      .then((statsRes) => {
        setStats(statsRes.data)
        setError('')
      })
      .catch((err) => setError(err.message))
  }, [period])

  if (error && !stats) return <Alert>{error}</Alert>
  if (!stats) return <Loading message="Loading dashboard..." />

  const pendingTotal = stats.pendingApprovals?.total ?? 0
  const flagged = stats.payments?.flaggedShipments ?? 0
  const openDisputes = stats.payments?.openDisputes ?? 0
  const ratingAverage = stats.ratings?.average ?? null
  const unimodal = stats.shipments?.byMode?.UNIMODAL ?? 0
  const multimodal = stats.shipments?.byMode?.MULTIMODAL ?? 0
  const activePeriod = stats.period?.key ?? period

  const operationsCards = [
    { label: 'Active Loads', value: stats.loads?.active ?? 0 },
    { label: 'Active Availability', value: stats.availability?.activePostings ?? 0 },
    { label: 'Shipments In Transit', value: stats.shipments?.inTransit ?? 0 },
    { label: 'Matches This Week', value: stats.matches?.thisWeek ?? 0 },
  ]

  const moneyCards = [
    {
      label: 'Commission Earned',
      value: formatEtb(stats.payments?.commissionEarnedEtb ?? 0),
      sub: `Period: ${periodLabel(activePeriod)}`,
    },
    {
      label: 'Funds Held in Escrow',
      value: formatEtb(stats.payments?.escrowHeldEtb ?? 0),
    },
    {
      label: 'Flagged Shipments',
      value: flagged,
      warn: flagged > 0,
      sub: `${openDisputes} open disputes`,
    },
  ]

  const platformCards = [
    {
      label: 'Total Organizations',
      value: stats.organizations.total,
      link: (
        <Link to="/admin/organizations" className="text-sm font-semibold text-korecha-primary hover:underline">
          View all →
        </Link>
      ),
    },
    {
      label: 'Total Containers',
      value: stats.containers.total,
      link: (
        <Link to="/admin/containers" className="text-sm font-semibold text-korecha-primary hover:underline">
          View fleet →
        </Link>
      ),
    },
    {
      label: 'Demurrage Risk',
      value: stats.containers.demurrageRisk,
      warn: stats.containers.demurrageRisk > 0,
    },
  ]

  const extrasCards = [
    { label: 'Active Organizations', value: stats.organizations.byStatus.ACTIVE || 0 },
    {
      label: 'Primary corridor',
      value: `${stats.pricing.corridorDistanceKm} km`,
      sub: 'Djibouti → Addis Ababa',
    },
    { label: 'Avg Trucking Rate', value: `${formatEtb(stats.pricing.avgBasePricePerKm)}/km` },
  ]

  const demurrageRiskContainers = containers
    .filter((container) => container.isDemurrageRisk)
    .sort((a, b) => new Date(a.lastFreeDay || '').getTime() - new Date(b.lastFreeDay || '').getTime())
    .slice(0, 8)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Ethiopia logistics corridor overview"
        action={
          <div className="flex gap-3">
            <LinkButton to="/admin/organizations" variant="primary">
              + New Organization
            </LinkButton>
            <LinkButton to="/admin/containers/upload" variant="secondary">
              Upload Containers
            </LinkButton>
          </div>
        }
      />

      {error && <Alert>{error}</Alert>}

      <ChipTabs items={PERIOD_TABS} active={period} onChange={setPeriod} />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {operationsCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {moneyCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
        <StatCard
          label="Average Platform Rating"
          value={
            ratingAverage == null ? (
              <span className="text-xl font-semibold text-slate-400">No ratings yet</span>
            ) : (
              <span className="flex items-center gap-3">
                <span>{ratingAverage.toFixed(1)}</span>
                <StarRating value={ratingAverage} readOnly size="sm" />
              </span>
            )
          }
          sub={ratingAverage == null ? undefined : `${stats.ratings?.count ?? 0} ratings`}
        />
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Link to="/admin/applications" className="block">
          <StatCard
            label="Pending Approvals"
            value={pendingTotal}
            warn={pendingTotal > 0}
            sub={`${stats.pendingApprovals?.tradeCustomers ?? 0} trade · ${stats.pendingApprovals?.fleetManagers ?? 0} fleet`}
          />
        </Link>
        {platformCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {extrasCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="font-bold text-slate-900">Organizations by Type</h3>
          <div className="mt-5 space-y-3">
            {Object.entries(stats.organizations.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm capitalize text-slate-600">{orgTypeLabel(type)}</span>
                <span className="rounded-lg bg-blue-50 px-2.5 py-0.5 text-sm font-bold text-korecha-primary">
                  {count}
                </span>
              </div>
            ))}
            {Object.keys(stats.organizations.byType).length === 0 && (
              <p className="text-sm text-slate-400">No organizations yet</p>
            )}
          </div>
        </Card>
        <Card>
          <h3 className="font-bold text-slate-900">Containers by Status</h3>
          <div className="mt-5 space-y-3">
            {Object.entries(stats.containers.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm capitalize text-slate-600">{status.replace(/_/g, ' ').toLowerCase()}</span>
                <span className="rounded-lg bg-blue-50 px-2.5 py-0.5 text-sm font-bold text-korecha-primary">
                  {count}
                </span>
              </div>
            ))}
            {Object.keys(stats.containers.byStatus).length === 0 && (
              <p className="text-sm text-slate-400">No containers yet</p>
            )}
          </div>
        </Card>
        <Card>
          <h3 className="font-bold text-slate-900">Shipments by Mode</h3>
          <ModeRatioBar unimodal={unimodal} multimodal={multimodal} />
        </Card>
        <Card>
          <h3 className="font-bold text-slate-900">External Integrations</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-700">ESL GPS feed</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Last sync: {stats.integrations?.eslGpsFeed.lastSyncAt
                    ? formatDate(stats.integrations.eslGpsFeed.lastSyncAt)
                    : 'Never'}
                </p>
              </div>
              <Badge status={stats.integrations?.eslGpsFeed.status ?? 'DISCONNECTED'} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-700">Vessel ETA feed</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Last sync: {stats.integrations?.vesselEtaFeed.lastSyncAt
                    ? formatDate(stats.integrations.vesselEtaFeed.lastSyncAt)
                    : 'Never'}
                </p>
              </div>
              <Badge status={stats.integrations?.vesselEtaFeed.status ?? 'DISCONNECTED'} />
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <AdminCorridorMap containers={containers} locations={locations} />
      </div>

      <div className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900">Demurrage Drill-down</h3>
            <p className="mt-1 text-sm text-slate-500">
              Containers whose last free day is within the next {demurrageAlertHours} hours.
            </p>
          </div>
          <Link to="/admin/containers" className="text-sm font-semibold text-korecha-primary hover:underline">
            View all containers →
          </Link>
        </div>

        <TableWrapper>
          <Table>
            <TableHead>
              <tr>
                <Th>Container</Th>
                <Th>Owner</Th>
                <Th>Status</Th>
                <Th>Location</Th>
                <Th>Last Free Day</Th>
                <Th>Time Remaining</Th>
              </tr>
            </TableHead>
            <tbody>
              {demurrageRiskContainers.length === 0 ? (
                <TableEmpty colSpan={6} message="No containers are at demurrage risk right now" />
              ) : (
                demurrageRiskContainers.map((container) => (
                  <TableRow key={container.id}>
                    <Td>
                      <div>
                        <p className="font-mono font-semibold text-slate-900">{container.containerNumber}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {SIZE_LABELS[container.size] || container.size} · {container.type}
                        </p>
                      </div>
                    </Td>
                    <Td>{container.organization?.name || '—'}</Td>
                    <Td>
                      <Badge status={container.status} />
                    </Td>
                    <Td>{container.location?.label || '—'}</Td>
                    <Td className="font-semibold text-red-600">{formatDate(container.lastFreeDay)}</Td>
                    <Td>
                      <span className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                        {demurrageTimeRemaining(container.lastFreeDay)}
                      </span>
                    </Td>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </TableWrapper>
      </div>
    </div>
  )
}
