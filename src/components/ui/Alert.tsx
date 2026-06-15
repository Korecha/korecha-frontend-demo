type AlertVariant = 'error' | 'success' | 'info' | 'warning'

const styles: Record<AlertVariant, string> = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
}

export function Alert({
  children,
  variant = 'error',
  className = '',
}: {
  children: React.ReactNode
  variant?: AlertVariant
  className?: string
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${styles[variant]} ${className}`}>
      {children}
    </div>
  )
}
