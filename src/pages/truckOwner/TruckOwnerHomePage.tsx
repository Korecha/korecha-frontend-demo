import { useAuth } from '../../auth/AuthContext'
import { PROVIDER_TYPE_LABELS, TRUCK_OWNER_TYPE_LABELS } from '../../utils/format'
import { ApplicationStatusPage } from '../ApplicationStatusPage'
import type { TruckOwnerProfile } from '../../types'

export function TruckOwnerHomePage() {
  const { memberProfile, organization } = useAuth()
  const profile =
    memberProfile?.type === 'truckOwner' ? (memberProfile.profile as TruckOwnerProfile) : null

  const affiliation =
    profile?.fleetManagerId && typeof profile.fleetManagerId === 'object'
      ? profile.fleetManagerId.providerType
        ? `${profile.fleetManagerId.fleetName} (${PROVIDER_TYPE_LABELS[profile.fleetManagerId.providerType] || profile.fleetManagerId.providerType})`
        : profile.fleetManagerId.fleetName
      : 'Independent'

  return (
    <ApplicationStatusPage
      title="Truck Owner"
      description={profile?.displayName || 'Your truck owner account'}
      pendingMessage="A platform admin will review your registration. Availability posting stays disabled until it is granted."
      approvedMessage={
        profile?.canPostAvailability
          ? 'You can post truck availability for Unimodal loads.'
          : 'Your account is active. Availability posting has not been granted yet — ask a platform admin to enable it.'
      }
      details={[
        {
          label: 'Registered as',
          value: profile ? TRUCK_OWNER_TYPE_LABELS[profile.ownerType] || profile.ownerType : '—',
        },
        { label: 'Organization', value: organization?.name || 'Independent' },
        { label: 'Fleet manager', value: affiliation },
        {
          label: 'Can post availability',
          value: profile?.canPostAvailability ? 'Granted' : 'Not granted',
        },
      ]}
    />
  )
}
