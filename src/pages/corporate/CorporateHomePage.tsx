import { useAuth } from '../../auth/AuthContext'
import { CORPORATE_TIER_LABELS } from '../../utils/format'
import { ApplicationStatusPage } from '../ApplicationStatusPage'
import type { CorporateCustomerProfile } from '../../types'

export function CorporateHomePage() {
  const { memberProfile, organization } = useAuth()
  const profile =
    memberProfile?.type === 'corporate' ? (memberProfile.profile as CorporateCustomerProfile) : null

  return (
    <ApplicationStatusPage
      title="Corporate Customer"
      description={profile?.companyName || 'Your corporate account'}
      pendingMessage="A platform admin is verifying your business registration and will assign your matching tier."
      approvedMessage="Your corporate account is verified. You can post loads with your assigned tier."
      details={[
        { label: 'Company', value: profile?.companyName || '—' },
        { label: 'TIN number', value: profile?.tinNumber || '—' },
        {
          label: 'Tier',
          value: profile ? CORPORATE_TIER_LABELS[profile.tier] || profile.tier : '—',
        },
        { label: 'Organization', value: organization?.name || 'Not linked' },
      ]}
    />
  )
}
