export function refName(ref: string | { name?: string } | null | undefined, fallback = '—'): string {
  if (ref == null) return fallback
  if (typeof ref === 'string') return ref
  return ref.name || fallback
}

export function formatEtb(amount: number): string {
  return `ETB ${amount.toLocaleString('en-ET', { maximumFractionDigits: 0 })}`
}

export function formatDate(date?: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-ET', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function isDemurrageRisk(lastFreeDay?: string | null, alertHours = 48): boolean {
  if (!lastFreeDay) return false
  const diff = new Date(lastFreeDay).getTime() - Date.now()
  return diff > 0 && diff <= alertHours * 60 * 60 * 1000
}

export const SIZE_LABELS: Record<string, string> = {
  TWENTY_FT: '20ft',
  FORTY_FT: '40ft',
  FORTY_FT_HC: '40ft HC',
}

export const TYPE_LABELS: Record<string, string> = {
  IMPORTER: 'Importer',
  EXPORTER: 'Exporter',
  TRUCKING: 'Trucking',
  SHIPPING_LINE: 'Shipping Line',
}

export const ROLE_LABELS: Record<string, string> = {
  ORG_ADMIN: 'Org Admin',
  DRIVER: 'Driver',
  FLEET_OWNER: 'Fleet Owner',
  IMPORTER: 'Importer',
}

export const JOB_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  REQUESTED: 'Awaiting driver',
  ASSIGNED: 'Truck assigned',
  IN_TRANSIT: 'In transit',
  PENDING_APPROVAL: 'Awaiting importer approval',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export const AVAILABILITY_LABELS: Record<string, string> = {
  AVAILABLE: 'Available for jobs',
  ON_JOB: 'On a job',
  OFFLINE: 'Offline',
}

export const APPROVAL_LABELS: Record<string, string> = {
  PENDING: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

export const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  ON_JOB: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  OFFLINE: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  OPEN: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  REQUESTED: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  ASSIGNED: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  IN_TRANSIT: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  PENDING_APPROVAL: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  CANCELLED: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  PENDING: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  SUSPENDED: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  ORG_ADMIN: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  DRIVER: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  FLEET_OWNER: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  IMPORTER: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  EMPTY: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  LOADED: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  AT_PORT: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200',
  DISCHARGED: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  MAINTENANCE: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
}
