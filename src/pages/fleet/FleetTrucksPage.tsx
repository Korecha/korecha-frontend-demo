import { useEffect, useState } from 'react'
import { listFleetTrucks, reviewFleetTruck, toggleFleetTruckAvailability } from '../../api/fleet'
import { getFleetProfile as getFleetMemberProfile, isApproved, useAuth } from '../../auth/AuthContext'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import { refName } from '../../utils/format'
import type { Truck } from '../../types'

export function FleetTrucksPage() {
  const { memberProfile } = useAuth()
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const approved = isApproved(memberProfile)
  const fleetProfile = getFleetMemberProfile(memberProfile)
  const canToggleAvailability = fleetProfile?.staff?.canToggleTruckAvailability ?? true

  const load = () => {
    if (!approved) { setLoading(false); return }
    setLoading(true)
    listFleetTrucks()
      .then((r) => setTrucks(r.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [approved])

  const handleReview = async (truck: Truck, status: 'APPROVED' | 'REJECTED') => {
    try {
      await reviewFleetTruck(truck.id, { status })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review truck')
    }
  }

  const handleToggleAvailability = async (truck: Truck) => {
    try {
      await toggleFleetTruckAvailability(truck.id, !truck.isAvailable)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update availability')
    }
  }

  if (!approved) {
    return (
      <div>
        <PageHeader title="Fleet Trucks" />
        <Alert variant="warning" className="mt-6">Available after your fleet account is approved.</Alert>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Fleet Trucks"
        description="Review trucks registered by your drivers — you cannot add trucks directly"
      />
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      <TableWrapper>
        <Table>
          <TableHead><tr><Th>Plate</Th><Th>Type</Th><Th>Driver</Th><Th>Status</Th><Th>Availability</Th><Th>Actions</Th></tr></TableHead>
          <tbody>
            {loading ? <TableEmpty colSpan={6} message="Loading..." /> : trucks.length === 0 ? (
              <TableEmpty colSpan={6} message="No trucks yet. Drivers register their own trucks after approval." />
            ) : trucks.map((t) => (
              <TableRow key={t.id}>
                <Td className="font-semibold">{t.plateNumber}</Td>
                <Td>{refName(t.truckTypeId)}</Td>
                <Td>{typeof t.driverId === 'object' && t.driverId ? t.driverId.fullName : '—'}</Td>
                <Td><Badge status={t.status} /></Td>
                <Td>
                  {t.status === 'APPROVED' ? (
                    <button
                      type="button"
                      disabled={!canToggleAvailability}
                      onClick={() => handleToggleAvailability(t)}
                      className={`text-xs font-medium ${t.isAvailable ? 'text-emerald-600' : 'text-slate-400'} ${canToggleAvailability ? 'hover:underline' : 'cursor-not-allowed'}`}
                    >
                      {t.isAvailable ? 'Available' : 'Unavailable'}
                    </button>
                  ) : '—'}
                </Td>
                <Td>
                  {t.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleReview(t, 'APPROVED')} className="text-xs font-medium text-emerald-600 hover:underline">Approve</button>
                      <button type="button" onClick={() => handleReview(t, 'REJECTED')} className="text-xs font-medium text-red-500 hover:underline">Reject</button>
                    </div>
                  )}
                </Td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </TableWrapper>
    </div>
  )
}
