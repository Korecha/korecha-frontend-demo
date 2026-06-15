import { APPROVAL_LABELS, AVAILABILITY_LABELS, JOB_STATUS_LABELS, ROLE_LABELS, STATUS_COLORS } from '../../utils/format'

export function Badge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
  const label =
    JOB_STATUS_LABELS[status] ||
    AVAILABILITY_LABELS[status] ||
    APPROVAL_LABELS[status] ||
    ROLE_LABELS[status] ||
    status.replace(/_/g, ' ').toLowerCase()
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>
      {label}
    </span>
  )
}
