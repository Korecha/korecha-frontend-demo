import { JOB_STATUS_LABELS, SHIPMENT_LEG_STATUS_LABELS, refName } from '../../utils/format'
import type { JobStatus, ShipmentLeg } from '../../types'

const STEPS: JobStatus[] = ['OPEN', 'REQUESTED', 'ASSIGNED', 'IN_TRANSIT', 'PENDING_APPROVAL', 'COMPLETED']

function locName(value: ShipmentLeg['fromLocationId']): string {
  return refName(value as string | { name?: string } | null | undefined)
}

export function JobStatusTimeline({ status, legs = [] }: { status: JobStatus; legs?: ShipmentLeg[] }) {
  const currentIdx = STEPS.indexOf(status)
  const showLegs = legs.length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-1 overflow-x-auto py-2">
        {STEPS.map((step, i) => {
          const done = i <= currentIdx && status !== 'CANCELLED'
          const active = i === currentIdx
          return (
            <div key={step} className="flex min-w-0 flex-1 flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  done ? 'bg-korecha-primary text-white' : 'bg-slate-100 text-slate-400'
                } ${active ? 'ring-4 ring-blue-100' : ''}`}
              >
                {i + 1}
              </div>
              <p className={`mt-1.5 text-center text-[9px] font-semibold leading-tight ${done ? 'text-korecha-primary' : 'text-slate-400'}`}>
                {JOB_STATUS_LABELS[step]}
              </p>
            </div>
          )
        })}
      </div>

      {showLegs && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Leg progress</p>
          <ol className="mt-2 space-y-2">
            {legs
              .slice()
              .sort((a, b) => a.sequenceNo - b.sequenceNo)
              .map((leg) => {
                const done = leg.status === 'COMPLETED'
                const active = leg.status === 'IN_TRANSIT'
                return (
                  <li
                    key={leg.id}
                    className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${
                      active ? 'bg-blue-50' : done ? 'bg-emerald-50/60' : 'bg-slate-50'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        done || active ? 'bg-korecha-primary text-white' : 'bg-white text-slate-400 ring-1 ring-slate-200'
                      }`}
                    >
                      {leg.sequenceNo}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {locName(leg.fromLocationId)} → {locName(leg.toLocationId)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {SHIPMENT_LEG_STATUS_LABELS[leg.status] || leg.status}
                        {typeof leg.driverId === 'object' && leg.driverId?.fullName ? ` · ${leg.driverId.fullName}` : ''}
                      </p>
                    </div>
                  </li>
                )
              })}
          </ol>
        </div>
      )}
    </div>
  )
}
