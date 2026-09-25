import { useState } from 'react'
import { FleetManagerQueue } from '../../components/admin/applications/FleetManagerQueue'
import { TradeCustomerQueue } from '../../components/admin/applications/TradeCustomerQueue'
import { PageHeader } from '../../components/ui/PageHeader'
import { ChipTabs, PillTabs } from '../../components/ui/Tabs'
import type { ApprovalStatus, ModeScope } from '../../types'

type TopTab = 'trade' | 'fleet'
type StatusFilter = ApprovalStatus | 'ALL'

const TOP_TABS: { key: TopTab; label: string }[] = [
  { key: 'trade', label: 'Importers/exporters' },
  { key: 'fleet', label: 'Fleet managers' },
]

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'ALL', label: 'All' },
]

const FLEET_SCOPE_TABS: { key: ModeScope; label: string }[] = [
  { key: 'MULTIMODAL', label: 'Multimodal / MTO' },
  { key: 'UNIMODAL', label: 'Unimodal' },
]

export function AdminApplicationsPage() {
  const [topTab, setTopTab] = useState<TopTab>('trade')
  const [status, setStatus] = useState<StatusFilter>('PENDING')
  const [fleetSubTab, setFleetSubTab] = useState<ModeScope>('MULTIMODAL')

  return (
    <div>
      <PageHeader
        title="Applications"
        description="One review queue per applicant. Mode is derived automatically from FX financing on approval — it is never chosen manually."
      />
      <PillTabs items={TOP_TABS} active={topTab} onChange={setTopTab} />
      <div className="mt-4">
        <ChipTabs items={STATUS_TABS} active={status} onChange={setStatus} />
      </div>
      {topTab === 'fleet' && (
        <ChipTabs items={FLEET_SCOPE_TABS} active={fleetSubTab} onChange={setFleetSubTab} />
      )}
      {topTab === 'trade' ? (
        <TradeCustomerQueue status={status} />
      ) : (
        <FleetManagerQueue status={status} modeScope={fleetSubTab} />
      )}
    </div>
  )
}
