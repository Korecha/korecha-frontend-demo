import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminSearch } from '../../api/admin'
import type {
  AdminSearchDriverHit,
  AdminSearchFleetManagerHit,
  AdminSearchOrgHit,
  AdminSearchResults,
} from '../../types'

export function AdminGlobalSearch() {
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<AdminSearchResults | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return
    let active = true
    const timer = window.setTimeout(() => {
      adminSearch(q)
        .then((res) => {
          if (!active) return
          setResults(res.data)
          setError('')
          setOpen(true)
        })
        .catch((err) => {
          if (!active) return
          setError(err instanceof Error ? err.message : 'Search failed')
          setResults(null)
          setOpen(true)
        })
    }, 300)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [query])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const goOrg = (hit: AdminSearchOrgHit) => {
    navigate(`/admin/organizations/${hit.orgId}?tab=overview`)
    setOpen(false)
  }

  const goFleet = (hit: AdminSearchFleetManagerHit) => {
    if (!hit.orgId) return
    navigate(`/admin/organizations/${hit.orgId}?tab=truck-owners&expand=${hit.id}`)
    setOpen(false)
  }

  const goDriver = (hit: AdminSearchDriverHit) => {
    if (!hit.orgId) return
    navigate(
      `/admin/organizations/${hit.orgId}?tab=truck-owners&expand=${hit.fleetManagerId ?? ''}&highlight=${hit.id}`,
    )
    setOpen(false)
  }

  const orgHits = results?.organizations ?? []
  const fleetHits = results?.fleetManagers ?? []
  const driverHits = results?.drivers ?? []
  const hasAny = orgHits.length + fleetHits.length + driverHits.length > 0
  const showDropdown = open && query.trim().length >= 2

  return (
    <div ref={rootRef} className="relative w-full max-w-xl">
      <input
        type="search"
        value={query}
        placeholder="Search organizations, truck owners, drivers..."
        onChange={(e) => {
          const next = e.target.value
          setQuery(next)
          if (next.trim().length < 2) {
            setResults(null)
            setError('')
            setOpen(false)
          }
        }}
        onFocus={() => {
          if (query.trim().length >= 2 && (results || error)) setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
        className="w-full rounded-xl border border-korecha-border bg-white px-4 py-2 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-korecha-primary focus:outline-none focus:ring-4 focus:ring-korecha-ring/40"
      />
      {showDropdown && (
        <div className="absolute z-40 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-korecha-border bg-white p-2 shadow-lg">
          {error ? (
            <p className="px-3 py-2 text-sm text-red-600">{error}</p>
          ) : !hasAny ? (
            <p className="px-3 py-2 text-sm text-slate-500">No matches</p>
          ) : (
            <div className="space-y-3">
              {orgHits.length > 0 && (
                <SearchGroup label="Organizations">
                  {orgHits.map((hit) => (
                    <SearchHitButton
                      key={hit.id}
                      title={hit.name}
                      subtitle={hit.type || hit.status}
                      onClick={() => goOrg(hit)}
                    />
                  ))}
                </SearchGroup>
              )}
              {fleetHits.length > 0 && (
                <SearchGroup label="Truck owners & fleets">
                  {fleetHits.map((hit) => (
                    <SearchHitButton
                      key={hit.id}
                      title={hit.fleetName}
                      subtitle={
                        hit.orgId
                          ? hit.orgName || hit.parentFleetName || hit.providerType || hit.status
                          : 'No organization'
                      }
                      disabled={!hit.orgId}
                      onClick={() => goFleet(hit)}
                    />
                  ))}
                </SearchGroup>
              )}
              {driverHits.length > 0 && (
                <SearchGroup label="Drivers">
                  {driverHits.map((hit) => (
                    <SearchHitButton
                      key={hit.id}
                      title={hit.fullName || '—'}
                      subtitle={hit.orgId ? hit.orgName || hit.fleetName || hit.phone || '' : 'No organization'}
                      disabled={!hit.orgId}
                      onClick={() => goDriver(hit)}
                    />
                  ))}
                </SearchGroup>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SearchGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div>{children}</div>
    </div>
  )
}

function SearchHitButton({
  title,
  subtitle,
  disabled,
  onClick,
}: {
  title: string
  subtitle?: string | null
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="text-sm font-medium text-slate-900">{title}</span>
      {subtitle ? <span className="text-xs text-slate-500">{subtitle}</span> : null}
    </button>
  )
}
