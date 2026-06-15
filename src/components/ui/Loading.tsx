export function Loading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-blue-100 border-t-korecha-primary" />
      <p className="text-sm text-korecha-muted">{message}</p>
    </div>
  )
}
