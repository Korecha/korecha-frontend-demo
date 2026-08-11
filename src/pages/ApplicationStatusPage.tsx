import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Loading } from '../components/ui/Loading'
import { PageHeader } from '../components/ui/PageHeader'
import type { ApprovalStatus } from '../types'

interface DetailRow {
  label: string
  value: string
}

export function ApplicationStatusPage({
  title,
  description,
  details,
  pendingMessage,
  approvedMessage,
}: {
  title: string
  description: string
  details: DetailRow[]
  pendingMessage: string
  approvedMessage: string
}) {
  const { user, memberProfile, loading, logout } = useAuth()
  const navigate = useNavigate()

  if (loading) return <Loading message="Loading your application..." />

  const status = (memberProfile?.profile?.status as ApprovalStatus | undefined) ?? 'PENDING'
  const rejectionReason = memberProfile?.profile?.rejectionReason

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-korecha-bg px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title={title}
          description={description}
          action={
            <Button variant="secondary" onClick={handleLogout}>
              Sign out
            </Button>
          }
        />

        {status === 'PENDING' && (
          <Alert variant="warning" className="mb-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">Application under review</p>
                <p className="mt-1 text-sm opacity-90">{pendingMessage}</p>
              </div>
              <Badge status="PENDING" />
            </div>
          </Alert>
        )}

        {status === 'REJECTED' && (
          <Alert className="mb-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">Application rejected</p>
                <p className="mt-1 text-sm opacity-90">
                  {rejectionReason || 'Contact platform support for details.'}
                </p>
              </div>
              <Badge status="REJECTED" />
            </div>
          </Alert>
        )}

        {status === 'APPROVED' && (
          <Alert variant="success" className="mb-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">Account approved</p>
                <p className="mt-1 text-sm opacity-90">{approvedMessage}</p>
              </div>
              <Badge status="APPROVED" />
            </div>
          </Alert>
        )}

        <Card>
          <h3 className="font-bold text-slate-900">Your details</h3>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between gap-4 border-b border-slate-50 pb-3">
              <dt className="text-sm text-korecha-muted">Contact</dt>
              <dd className="text-right text-sm font-medium text-slate-800">
                {user?.fullName}
                <div className="text-xs text-korecha-muted">{user?.email}</div>
              </dd>
            </div>
            {details.map((row) => (
              <div
                key={row.label}
                className="flex justify-between gap-4 border-b border-slate-50 pb-3 last:border-0"
              >
                <dt className="text-sm text-korecha-muted">{row.label}</dt>
                <dd className="max-w-[55%] text-right text-sm font-medium text-slate-800">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  )
}
