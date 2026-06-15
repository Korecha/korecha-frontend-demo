import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listJobs } from '../../api/importer'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { DriverMap } from '../../components/driver/DriverMap'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { refName } from '../../utils/format'
import { jobRouteLocations } from '../../utils/jobMap'
import type { Job, JobStatus } from '../../types'

type Filter = 'all' | JobStatus

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'REQUESTED', label: 'Requested' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'IN_TRANSIT', label: 'In transit' },
  { key: 'COMPLETED', label: 'Done' },
]

export function ImporterJobsPage() {
  const { memberProfile } = useAuth()
  const approved = isApproved(memberProfile)
  const [jobs, setJobs] = useState<Job[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!approved) { setLoading(false); return }
    listJobs().then((r) => setJobs(r.data)).finally(() => setLoading(false))
  }, [approved])

  if (!approved) {
    return (
      <Alert variant="warning">
        Jobs are available after your account is approved by your organization.
      </Alert>
    )
  }

  const filtered = filter === 'all' ? jobs : jobs.filter((j) => j.status === filter)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My jobs</h2>
          <p className="text-sm text-slate-500">{jobs.length} total haul request{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/importer/jobs/new">
          <Button>+ New job</Button>
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const count = f.key === 'all' ? jobs.length : jobs.filter((j) => j.status === f.key).length
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                filter === f.key
                  ? 'bg-korecha-primary text-white shadow-sm'
                  : 'bg-white text-slate-600 ring-1 ring-korecha-border hover:bg-slate-50'
              }`}
            >
              {f.label}{count > 0 ? ` (${count})` : ''}
            </button>
          )
        })}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading jobs...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-korecha-primary">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="mt-4 text-lg font-bold text-slate-900">No jobs here</p>
          <p className="mt-1 text-sm text-slate-500">
            {filter === 'all' ? 'Post a haul job to find live trucks' : `No ${FILTERS.find((f) => f.key === filter)?.label.toLowerCase()} jobs`}
          </p>
          <Link to="/importer/jobs/new" className="mt-5 inline-block">
            <Button>Post a job</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((job) => (
            <Link
              key={job.id}
              to={`/importer/jobs/${job.id}`}
              className="block overflow-hidden rounded-3xl border border-korecha-border bg-white shadow-sm transition hover:border-korecha-primary/30 hover:shadow-md"
            >
              <DriverMap
                className="h-[22vh] min-h-[140px] rounded-none border-0"
                routeLocations={jobRouteLocations(job)}
                interactive={false}
              />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">
                      {refName(job.itemTypeId)} · {job.quantity}
                      {typeof job.itemTypeId === 'object' ? ` ${job.itemTypeId.unit}` : ''}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      <span className="font-medium text-korecha-primary">{job.pickup.label}</span>
                      {' → '}
                      <span className="font-medium text-amber-600">{job.delivery.label}</span>
                    </p>
                  </div>
                  <Badge status={job.status} />
                </div>
                {job.assignedDriverId && typeof job.assignedDriverId === 'object' && (
                  <p className="mt-2 text-xs text-slate-500">
                    Driver: {job.assignedDriverId.fullName}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
