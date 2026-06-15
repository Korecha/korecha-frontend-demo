import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats } from '../../api/admin'
import { Alert } from '../../components/ui/Alert'
import { StatCard } from '../../components/ui/Card'
import { LinkButton } from '../../components/ui/LinkButton'
import { Loading } from '../../components/ui/Loading'
import { PageHeader } from '../../components/ui/PageHeader'
import type { DashboardStats } from '../../types'
import { formatEtb } from '../../utils/format'

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboardStats()
      .then((res) => setStats(res.data))
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
                <span className="text-sm capitalize text-slate-600">{type.replace(/_/g, ' ').toLowerCase()}</span>
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
    </div>
  )
}
