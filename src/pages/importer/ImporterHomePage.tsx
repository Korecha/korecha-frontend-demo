import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getImporterProfile, listJobs } from '../../api/importer'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { DriverMap } from '../../components/driver/DriverMap'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { refName } from '../../utils/format'
import { jobRouteLocations } from '../../utils/jobMap'
import type { Job } from '../../types'

export function ImporterHomePage() {
  const { memberProfile, organization } = useAuth()
  const approved = isApproved(memberProfile)
  const isSoleImporter = !organization
  const [stats, setStats] = useState<Record<string, number>>({})
  const [recentJobs, setRecentJobs] = useState<Job[]>([])

  useEffect(() => {
    getImporterProfile().then((r) => setStats(r.data.stats)).catch(() => {})
    if (approved) {
      listJobs().then((r) => setRecentJobs(r.data.slice(0, 3))).catch(() => {})
    }
  }, [approved])

  const activeCount = (stats.ASSIGNED || 0) + (stats.IN_TRANSIT || 0) + (stats.REQUESTED || 0)

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-korecha-navy via-korecha-navy-light to-blue-600 p-6 text-white shadow-xl shadow-blue-900/20">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-blue-400/10" />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200/80">Import & haul</p>
          <h2 className="mt-1 text-2xl font-bold">Move cargo across the corridor</h2>
          <p className="mt-2 max-w-sm text-sm text-blue-100/90">
            Post haul jobs, find live trucks nearby, and track every delivery until it&apos;s done.
          </p>
          {approved && !isSoleImporter ? (
            <Link to="/importer/jobs/new" className="mt-5 inline-block">
              <Button className="bg-white text-korecha-primary shadow-lg hover:bg-blue-50">
                + Post a job
              </Button>
            </Link>
          ) : approved && isSoleImporter ? (
            <p className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-blue-100">
              Your account is approved. Contact the platform admin to be linked to an organization before posting jobs.
            </p>
          ) : (
            <p className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-blue-100">
              Awaiting approval — you can post jobs once your account is verified
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Open', key: 'OPEN', color: 'text-sky-600' },
          { label: 'Active', key: 'IN_TRANSIT', color: 'text-violet-600' },
          { label: 'Assigned', key: 'ASSIGNED', color: 'text-indigo-600' },
          { label: 'Completed', key: 'COMPLETED', color: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.key} className="rounded-2xl border border-korecha-border bg-white p-4 text-center shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{stats[s.key] || 0}</p>
            <p className="text-xs font-semibold text-slate-600">{s.label}</p>
          </div>
        ))}
      </div>

      {approved && activeCount > 0 && (
        <Link
          to="/importer/jobs"
          className="flex items-center justify-between rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white px-4 py-3 shadow-sm transition hover:border-korecha-primary/30"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-korecha-primary text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{activeCount} job{activeCount > 1 ? 's' : ''} in progress</p>
              <p className="text-xs text-slate-500">Track status and trucks</p>
            </div>
          </div>
          <span className="text-xs font-bold text-korecha-primary">View →</span>
        </Link>
      )}

      {approved && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Recent jobs</h3>
            <Link to="/importer/jobs" className="text-sm font-semibold text-korecha-primary hover:underline">
              View all
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-korecha-primary">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="mt-4 font-semibold text-slate-800">No jobs yet</p>
              <p className="mt-1 text-sm text-slate-500">Post your first haul request to find trucks</p>
              <Link to="/importer/jobs/new" className="mt-4 inline-block">
                <Button>Post first job</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/importer/jobs/${job.id}`}
                  className="block overflow-hidden rounded-3xl border border-korecha-border bg-white shadow-sm transition hover:border-korecha-primary/30 hover:shadow-md"
                >
                  <DriverMap
                    className="h-[18vh] min-h-[120px] rounded-none border-0"
                    routeLocations={jobRouteLocations(job)}
                    interactive={false}
                  />
                  <div className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900">
                        {refName(job.itemTypeId)} × {job.quantity}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {job.pickup.label} → {job.delivery.label}
                      </p>
                    </div>
                    <Badge status={job.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
