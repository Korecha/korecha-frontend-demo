import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDriverProfile } from '../../api/driver'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { DriverMap } from '../../components/driver/DriverMap'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { useDriverLocation } from '../../hooks/useDriverLocation'
import { formatDate } from '../../utils/format'
import type { DriverAvailability, DriverProfile, Location } from '../../types'

export function DriverHomePage() {
  const { memberProfile } = useAuth()
  const approved = isApproved(memberProfile)
  const [profile, setProfile] = useState<DriverProfile | null>(null)
  const [stats, setStats] = useState({
    truckCount: 0,
    pendingTruckCount: 0,
    pendingRequestCount: 0,
    activeJobCount: 0,
  })
  const [toggling, setToggling] = useState(false)

  const isLive = profile?.isLocationLive ?? false
  const { position, error: geoError, goLive, goOffline, setAvailability } = useDriverLocation(isLive && approved)

  const load = () => {
    getDriverProfile()
      .then((r) => {
        setProfile(r.data.profile)
        setStats(r.data.stats)
      })
      .catch(() => {})
  }

  useEffect(() => { load() }, [])

  const routeLocations = (profile?.preferredRouteIds || []).filter(
    (r): r is Location => typeof r === 'object' && r != null && 'coordinates' in r
  )

  const mapPosition = position ?? (profile?.liveLocation?.lat != null
    ? { lat: profile.liveLocation.lat, lng: profile.liveLocation.lng! }
    : null)

  const handleLiveToggle = async () => {
    if (!approved) return
    setToggling(true)
    try {
      if (isLive) {
        await goOffline()
        setProfile((p) => p ? { ...p, isLocationLive: false, availability: 'OFFLINE' } : p)
      } else {
        const ok = await goLive()
        if (ok) {
          setProfile((p) => p ? { ...p, isLocationLive: true, availability: 'AVAILABLE' } : p)
          load()
        }
      }
    } finally {
      setToggling(false)
    }
  }

  const handleAvailability = async (status: DriverAvailability) => {
    if (!approved) return
    if (status === 'OFFLINE') {
      await goOffline()
      setProfile((p) => p ? { ...p, availability: 'OFFLINE', isLocationLive: false } : p)
      return
    }
    if (!isLive) return
    await setAvailability(status)
    setProfile((p) => p ? { ...p, availability: status, isLocationLive: true } : p)
  }

  if (!approved) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Awaiting approval</h2>
          <p className="mt-2 text-sm text-slate-600">
            Once your organization approves your account, you can go live on the map and receive job requests from importers.
          </p>
        </div>
        <DriverMap className="h-[50vh] min-h-[280px]" interactive={false} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Live map hero */}
      <div className="relative overflow-hidden rounded-3xl border border-white/60 shadow-xl shadow-blue-900/10">
        <DriverMap
          className="h-[42vh] min-h-[260px] md:h-[50vh]"
          driverPosition={mapPosition}
          routeLocations={routeLocations}
          isLive={isLive}
        />
        {isLive && (
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-emerald-600 shadow-lg backdrop-blur">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            LIVE
          </div>
        )}
      </div>

      {(geoError) && <Alert variant="warning">{geoError}</Alert>}

      {/* Go live control */}
      <div className="rounded-3xl border border-korecha-border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-slate-900">Share live location</h2>
            <p className="mt-0.5 text-xs text-korecha-muted">
              Importers will find your truck on the map when you are live
            </p>
          </div>
          <button
            type="button"
            disabled={toggling}
            onClick={handleLiveToggle}
            className={`relative h-9 w-16 shrink-0 rounded-full transition-all ${
              isLive ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          >
            <span
              className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow-md transition-all ${
                isLive ? 'left-8' : 'left-1'
              }`}
            />
          </button>
        </div>

        {isLive && (
          <div className="mt-4 flex flex-wrap gap-2">
            {(['AVAILABLE', 'ON_JOB', 'OFFLINE'] as DriverAvailability[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleAvailability(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  profile?.availability === s
                    ? 'bg-korecha-primary text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s === 'AVAILABLE' ? 'Available' : s === 'ON_JOB' ? 'On job' : 'Offline'}
              </button>
            ))}
          </div>
        )}

        {profile?.liveLocation?.updatedAt && (
          <p className="mt-3 text-[11px] text-korecha-muted">
            Last updated {formatDate(profile.liveLocation.updatedAt)}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Trucks', value: stats.truckCount, sub: 'approved' },
          { label: 'Pending', value: stats.pendingTruckCount, sub: 'trucks' },
          { label: 'Routes', value: routeLocations.length, sub: 'preferred' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-korecha-border bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-korecha-primary">{s.value}</p>
            <p className="text-xs font-semibold text-slate-700">{s.label}</p>
            <p className="text-[10px] text-korecha-muted">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Haul jobs */}
      <Link
        to="/driver/jobs"
        className="block rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/80 to-white p-5 shadow-sm transition hover:border-korecha-primary/40"
      >
        <div className="flex items-start gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-korecha-primary text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            {stats.pendingRequestCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {stats.pendingRequestCount}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900">Haul jobs</h3>
            <p className="mt-1 text-sm text-slate-600">
              {stats.pendingRequestCount > 0
                ? `${stats.pendingRequestCount} new request${stats.pendingRequestCount > 1 ? 's' : ''} waiting`
                : stats.activeJobCount > 0
                  ? `${stats.activeJobCount} active trip${stats.activeJobCount > 1 ? 's' : ''} in progress`
                  : 'Importers send requests when you are live and available'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {profile?.availability && <Badge status={profile.availability} />}
              <span className="text-xs font-semibold text-korecha-primary">Open jobs →</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
