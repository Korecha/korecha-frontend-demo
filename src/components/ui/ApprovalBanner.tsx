import { useAuth } from '../../auth/AuthContext'
import { Alert } from './Alert'
import { Badge } from './Badge'

export function ApprovalBanner() {
  const { memberProfile, organization, user } = useAuth()
  const status = memberProfile?.profile?.status
  const isSoleImporter = user?.role === 'IMPORTER' && !organization

  if (!status || status === 'APPROVED') return null

  if (status === 'PENDING') {
    return (
      <Alert variant="warning" className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Application under review</p>
            <p className="mt-1 text-sm opacity-90">
              {isSoleImporter
                ? 'Your documents have been submitted. A platform admin will review and approve your account.'
                : 'Your documents have been submitted. The organization admin will review and approve your account.'}
            </p>
          </div>
          <Badge status="PENDING" />
        </div>
      </Alert>
    )
  }

  return (
    <Alert className="mb-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold">Application rejected</p>
          <p className="mt-1 text-sm opacity-90">
            {memberProfile?.profile?.rejectionReason ||
              (isSoleImporter ? 'Contact platform support for details.' : 'Contact your organization admin for details.')}
          </p>
        </div>
        <Badge status="REJECTED" />
      </div>
    </Alert>
  )
}
