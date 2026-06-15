import type { ReactNode } from 'react'

export function TableWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-korecha-border bg-white shadow-sm shadow-slate-200/50">
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

export function Table({ children }: { children: ReactNode }) {
  return <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-korecha-border bg-gradient-to-r from-slate-50 to-blue-50/30">
      {children}
    </thead>
  )
}

export function Th({ children }: { children: ReactNode }) {
  return (
    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </th>
  )
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-5 py-4 text-slate-700 ${className}`}>{children}</td>
}

export function TableEmpty({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-16 text-center">
        <p className="text-sm text-slate-400">{message}</p>
      </td>
    </tr>
  )
}

export function TableRow({ children }: { children: ReactNode }) {
  return <tr className="border-b border-slate-100 transition-colors last:border-0 hover:bg-blue-50/30">{children}</tr>
}
