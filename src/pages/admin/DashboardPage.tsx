import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats, getSettings, listContainers, listLocations } from '../../api/admin'
import { AdminCorridorMap } from '../../components/admin/AdminCorridorMap'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { StatCard } from '../../components/ui/Card'
import { LinkButton } from '../../components/ui/LinkButton'
import { Loading } from '../../components/ui/Loading'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import type { Container, DashboardStats, Location } from '../../types'
import { formatDate, formatEtb, isDemurrageRisk, SIZE_LABELS, TYPE_LABELS } from '../../utils/format'

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

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [containers, setContainers] = useState<Container[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [demurrageAlertHours, setDemurrageAlertHours] = useState(48)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getDashboardStats(), listContainers(), getSettings(), listLocations()])
      .then(([statsRes, containersRes, settingsRes, locationsRes]) => {
        setStats(statsRes.data)
        setContainers(containersRes.data)
        setLocations(locationsRes.data)
        setDemurrageAlertHours(settingsRes.data.demurrageAlertHours)
      })
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <Alert>{error}</Alert>
  if (!stats) return <Loading message="Loading dashboard..." />

  const cards = [
    {
      label: 'Total Organizations',
      value: stats.organizations.total,
      link: (
        <Link to="/admin/organizations" className="text-sm font-semibold text-korecha-primary hover:underline">
          View all →
        </Link>
      ),
    },
    { label: 'Active Organizations', value: stats.organizations.byStatus.ACTIVE || 0 },
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
      warn: (stats.containers.demurrageRisk as number) > 0,
    },
    { label: 'Avg Trucking Rate', value: `${formatEtb(stats.pricing.avgBasePricePerKm)}/km` },
    {
      label: 'Corridor Distance',
      value: `${stats.pricing.corridorDistanceKm} km`,
      sub: 'Djibouti → Addis Ababa',
    },
  ]

  const demurrageRiskContainers = containers
    .filter((container) => isDemurrageRisk(container.lastFreeDay, demurrageAlertHours))
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

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-korecha-border bg-white p-6 shadow-sm">
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
        </div>
        <div className="rounded-2xl border border-korecha-border bg-white p-6 shadow-sm">
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
        </div>
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
