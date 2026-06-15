import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
  hover = false,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border border-korecha-border bg-white p-6 shadow-sm shadow-slate-200/50 ${
        hover ? 'transition-all hover:border-blue-200 hover:shadow-md hover:shadow-blue-100/50' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

export function StatCard({
  label,
  value,
  sub,
  link,
  warn,
}: {
  label: string
  value: ReactNode
  sub?: string
  link?: ReactNode
  warn?: boolean
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-6 shadow-sm transition-all duration-300 ${
        warn
          ? 'border-red-200 bg-gradient-to-br from-red-50 to-white'
          : 'border-korecha-border bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/60'
      }`}
    >
      {!warn && (
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-50 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
      <p className="text-sm font-medium text-korecha-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
      {link && <div className="mt-3">{link}</div>}
    </div>
  )
}
