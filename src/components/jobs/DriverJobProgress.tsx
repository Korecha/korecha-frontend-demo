import type { JobStatus } from '../../types'

const DRIVER_STEPS: { key: JobStatus; label: string }[] = [
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'IN_TRANSIT', label: 'In transit' },
  { key: 'PENDING_APPROVAL', label: 'Awaiting approval' },
  { key: 'COMPLETED', label: 'Completed' },
]

const STATUS_ORDER: JobStatus[] = ['ASSIGNED', 'IN_TRANSIT', 'PENDING_APPROVAL', 'COMPLETED']

export function DriverJobProgress({ status }: { status: JobStatus }) {
  const currentIdx = STATUS_ORDER.indexOf(status)
  if (currentIdx < 0) return null

  return (
    <div className="flex items-center justify-between gap-1 py-2">
      {DRIVER_STEPS.map((step, i) => {
        const done = i <= currentIdx
        const active = i === currentIdx
        return (
          <div key={step.key} className="flex min-w-0 flex-1 flex-col items-center">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                done ? 'bg-korecha-primary text-white' : 'bg-slate-100 text-slate-400'
              } ${active ? 'ring-4 ring-blue-100' : ''}`}
            >
              {i + 1}
            </div>
            <p className={`mt-1.5 text-center text-[10px] font-semibold leading-tight ${done ? 'text-korecha-primary' : 'text-slate-400'}`}>
              {step.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}
