import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import type { Organization, OrgType } from '../../../types'
import { fleetManagerChipLabel, TYPE_LABELS } from '../../../utils/format'

function typeLabel(org: Organization) {
  if (org.type === 'FLEET_MANAGER' || org.type === 'TRUCKING') {
    return fleetManagerChipLabel(org.fleetSubType)
  }
  return org.type ? TYPE_LABELS[org.type] : 'Unassigned'
}

function showTruckOwners(type?: OrgType) {
  return type === 'FLEET_MANAGER' || type === 'TRUCKING'
}

function showContainers(type?: OrgType) {
  return type === 'SHIPPING_LINE'
}

function showLoadPostings(type?: OrgType) {
  return type === 'IMPORTER' || type === 'EXPORTER'
}

function showShipments(type?: OrgType) {
  return type === 'IMPORTER' || type === 'EXPORTER' || type === 'FLEET_MANAGER' || type === 'TRUCKING'
}

export function OverviewTab({
  org,
  onGoToTruckOwners,
}: {
  org: Organization
  onGoToTruckOwners: () => void
}) {
  const counts = org.counts
  const tiles: { label: string; value: number }[] = []
  if (showTruckOwners(org.type)) {
    tiles.push(
      { label: 'Fleet entities', value: counts?.fleetManagerCount ?? 0 },
      { label: 'Truck owners', value: counts?.truckOwnerCount ?? 0 },
      { label: 'Drivers', value: counts?.driverCount ?? 0 },
      { label: 'Trucks', value: counts?.truckCount ?? 0 },
      { label: 'Pending trucks', value: counts?.pendingTruckCount ?? 0 },
    )
  }
  if (showShipments(org.type)) {
    tiles.push({ label: 'Shipments', value: counts?.shipmentCount ?? 0 })
  }
  if (showLoadPostings(org.type)) {
    tiles.push({ label: 'Load postings', value: counts?.loadPostingCount ?? 0 })
  }
  if (showContainers(org.type)) {
    tiles.push({ label: 'Containers', value: org.containerCount ?? 0 })
  }

  const pendingTrucks = counts?.pendingTruckCount ?? 0

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <p className="text-sm text-korecha-muted">Type</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{typeLabel(org)}</p>
        </Card>
        <Card>
          <p className="text-sm text-korecha-muted">Mode</p>
          <div className="mt-1">{org.mode ? <Badge status={org.mode} /> : '—'}</div>
        </Card>
        <Card>
          <p className="text-sm text-korecha-muted">Tier</p>
          <div className="mt-1">{org.tier ? <Badge status={org.tier} /> : '—'}</div>
        </Card>
        <Card>
          <p className="text-sm text-korecha-muted">License</p>
          <div className="mt-1">{org.licenseStatus ? <Badge status={org.licenseStatus} /> : '—'}</div>
        </Card>
        <Card>
          <p className="text-sm text-korecha-muted">Status</p>
          <div className="mt-1">
            <Badge status={org.status} />
          </div>
        </Card>
        <Card>
          <p className="text-sm text-korecha-muted">Org admin</p>
          <p className="mt-1 text-sm font-medium text-slate-800">{org.orgAdmin?.email || '—'}</p>
        </Card>
      </div>

      {tiles.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((tile) => (
            <Card key={tile.label}>
              <p className="text-sm text-korecha-muted">{tile.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{tile.value}</p>
            </Card>
          ))}
        </div>
      )}

      {showTruckOwners(org.type) && pendingTrucks > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800">
            {pendingTrucks} truck(s) awaiting review
          </p>
          <Button size="sm" onClick={onGoToTruckOwners}>
            Review trucks
          </Button>
        </div>
      )}
    </div>
  )
}
