import { Link, type LinkProps } from 'react-router-dom'

export function LinkButton({
  to,
  children,
  variant = 'primary',
  className = '',
  ...props
}: LinkProps & { variant?: 'primary' | 'secondary'; className?: string }) {
  const styles =
    variant === 'primary'
      ? 'bg-korecha-primary text-white shadow-md shadow-blue-500/20 hover:bg-korecha-primary-dark'
      : 'border border-korecha-border bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/50'

  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${styles} ${className}`}
      {...props}
    >
      {children}
    </Link>
  )
}
