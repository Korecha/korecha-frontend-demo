import { JOB_STATUS_LABELS } from '../../utils/format'
import type { JobStatus } from '../../types'

const STEPS: JobStatus[] = ['OPEN', 'REQUESTED', 'ASSIGNED', 'IN_TRANSIT', 'COMPLETED']

export function JobStatusTimeline({ status }: { status: JobStatus }) {
  const currentIdx = STEPS.indexOf(status)

  return (
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
  )
}
