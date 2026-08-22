import { useState } from 'react'
import { requestTruckOwnerAvailabilityPermission } from '../../api/truckOwner'
import { useAuth } from '../../auth/AuthContext'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { PROVIDER_TYPE_LABELS, TRUCK_OWNER_TYPE_LABELS } from '../../utils/format'
import { ApplicationStatusPage } from '../ApplicationStatusPage'
import type { TruckOwnerProfile } from '../../types'

export function TruckOwnerHomePage() {
  const { memberProfile, organization, refreshSession } = useAuth()
  const profile =
    memberProfile?.type === 'truckOwner' ? (memberProfile.profile as TruckOwnerProfile) : null

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const affiliation =
    profile?.fleetManagerId && typeof profile.fleetManagerId === 'object'
      ? profile.fleetManagerId.providerType
        ? `${profile.fleetManagerId.fleetName} (${PROVIDER_TYPE_LABELS[profile.fleetManagerId.providerType] || profile.fleetManagerId.providerType})`
        : profile.fleetManagerId.fleetName
      : 'Independent'

  const requestStatus = profile?.availabilityRequestStatus
  const canRequest =
    profile?.status === 'APPROVED' &&
    !profile.isSelfPaired &&
    !profile.canPostAvailability &&
    requestStatus !== 'PENDING'

  const requestPermission = async () => {
    setSubmitting(true)
    setError('')
    try {
      await requestTruckOwnerAvailabilityPermission()
      await refreshSession()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

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
    >
      {profile?.status === 'APPROVED' && !profile.canPostAvailability && !profile.isSelfPaired && (
        <div className="mt-6">
          {error && (
            <div className="mb-4">
              <Alert>{error}</Alert>
            </div>
          )}
          {requestStatus === 'PENDING' ? (
            <Alert variant="warning">
              Your availability posting request is pending admin review.
            </Alert>
          ) : requestStatus === 'REJECTED' ? (
            <div className="space-y-3">
              <Alert>
                {profile.availabilityRequestRejectionReason ||
                  'Your previous availability posting request was rejected.'}
              </Alert>
              <Button disabled={submitting || !canRequest} onClick={requestPermission}>
                {submitting ? 'Submitting...' : 'Request again'}
              </Button>
            </div>
          ) : (
            <Button disabled={submitting || !canRequest} onClick={requestPermission}>
              {submitting ? 'Submitting...' : 'Request availability posting'}
            </Button>
          )}
        </div>
      )}
    </ApplicationStatusPage>
  )
}
