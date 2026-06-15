import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOrgProfile } from '../../api/org'
import { useAuth } from '../../auth/AuthContext'
import { Alert } from '../../components/ui/Alert'
import { Card } from '../../components/ui/Card'
import { LinkButton } from '../../components/ui/LinkButton'
import { Loading } from '../../components/ui/Loading'
import { PageHeader } from '../../components/ui/PageHeader'
import { formatEtb, TYPE_LABELS } from '../../utils/format'

export function OrgDashboardPage() {
  const { organization: orgFromAuth } = useAuth()
  const [memberCount, setMemberCount] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOrgProfile()
      .then((res) => setMemberCount(res.data.memberCount))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />
  if (error) return <Alert>{error}</Alert>

  const org = orgFromAuth

  return (
    <div>
      <PageHeader
        title={`Welcome, ${org?.name}`}
        description="Manage your team, fleet, and ETB pricing"
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <p className="text-sm text-korecha-muted">Organization Type</p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {org?.type ? TYPE_LABELS[org.type] : '—'}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-korecha-muted">Team Members</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{memberCount}</p>
          <Link to="/org/users" className="mt-2 inline-block text-sm font-semibold text-korecha-primary hover:underline">
            Manage team →
          </Link>
        </Card>
        <Card>
          <p className="text-sm text-korecha-muted">Base Rate</p>
          <p className="mt-2 text-xl font-bold text-korecha-primary">
            {org?.pricing ? `${formatEtb(org.pricing.basePricePerKm)}/km` : 'Not set'}
          </p>
          <Link to="/org/pricing" className="mt-2 inline-block text-sm font-semibold text-korecha-primary hover:underline">
            Configure pricing →
          </Link>
        </Card>
      </div>

      <div className="mt-8 flex gap-3">
        <LinkButton to="/org/users" variant="primary">Add Driver or Fleet Owner</LinkButton>
        <LinkButton to="/org/pricing" variant="secondary">Pricing Settings</LinkButton>
      </div>
    </div>
  )
}
