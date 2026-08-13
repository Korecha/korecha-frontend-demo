import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listJobs, listLoadPostings } from '../../api/importer'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { DriverMap } from '../../components/driver/DriverMap'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { refName } from '../../utils/format'
import { jobRouteLocations } from '../../utils/jobMap'
import type { Job, JobStatus, LoadPosting } from '../../types'

type Tab = 'jobs' | 'postings'
type Filter = 'all' | JobStatus

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'REQUESTED', label: 'Requested' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'IN_TRANSIT', label: 'In transit' },
  { key: 'PENDING_APPROVAL', label: 'Awaiting approval' },
  { key: 'COMPLETED', label: 'Done' },
]

function postingRouteLocations(posting: LoadPosting) {
  return [
    {
      id: `pickup-${posting.id}`,
      name: posting.pickup.label,
      type: 'CITY' as const,
      region: '',
      coordinates: posting.pickup.coordinates,
      isActive: true,
    },
    {
      id: `delivery-${posting.id}`,
      name: posting.delivery.label,
      type: 'CITY' as const,
      region: '',
      coordinates: posting.delivery.coordinates,
      isActive: true,
    },
  ]
}

export function ImporterJobsPage() {
  const { memberProfile, organization } = useAuth()
  const approved = isApproved(memberProfile)
  const canUseJobs = approved && Boolean(organization)
  const [tab, setTab] = useState<Tab>('jobs')
  const [jobs, setJobs] = useState<Job[]>([])
  const [postings, setPostings] = useState<LoadPosting[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!canUseJobs) return
    let active = true
    void Promise.resolve()
      .then(() => {
        setLoading(true)
        return Promise.all([listJobs(), listLoadPostings().catch(() => ({ data: [] as LoadPosting[] }))])
      })
      .then(([jobsRes, postingsRes]) => {
        if (active) {
          setJobs(jobsRes.data)
          setPostings(postingsRes.data)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [canUseJobs])

  if (!approved) {
    return (
      <Alert variant="warning">
        Jobs are available after your account is approved.
      </Alert>
    )
  }

  if (!organization) {
    return (
      <Alert variant="warning">
        Your account is approved. Contact the platform admin to be linked to an organization before posting jobs.
      </Alert>
    )
  }

  const filtered = filter === 'all' ? jobs : jobs.filter((j) => j.status === filter)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My loads</h2>
          <p className="text-sm text-slate-500">
            {jobs.length} job{jobs.length !== 1 ? 's' : ''} · {postings.length} load posting
            {postings.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/importer/jobs/new">
          <Button>+ New job</Button>
        </Link>
      </div>

      <div className="flex gap-2 rounded-2xl border border-korecha-border bg-white p-1 shadow-sm">
        {(
          [
            { key: 'jobs' as Tab, label: `Jobs (${jobs.length})` },
            { key: 'postings' as Tab, label: `Load postings (${postings.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              tab === t.key ? 'bg-korecha-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'jobs' ? (
        <>
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
                  {f.label}
                  {count > 0 ? ` (${count})` : ''}
                </button>
              )
            })}
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading jobs...</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-12 text-center">
              <p className="text-lg font-bold text-slate-900">No jobs here</p>
              <p className="mt-1 text-sm text-slate-500">
                {filter === 'all'
                  ? 'Post a haul job to find live trucks'
                  : `No ${FILTERS.find((f) => f.key === filter)?.label.toLowerCase()} jobs`}
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
                      <p className="mt-2 text-xs text-slate-500">Driver: {job.assignedDriverId.fullName}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : loading ? (
        <p className="text-sm text-slate-500">Loading load postings...</p>
      ) : postings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-12 text-center">
          <p className="text-lg font-bold text-slate-900">No load postings yet</p>
          <p className="mt-1 text-sm text-slate-500">
            New posts create a load posting with broadcast or manual matching
          </p>
          <Link to="/importer/jobs/new" className="mt-5 inline-block">
            <Button>Post a load</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {postings.map((posting) => (
            <Link
              key={posting.id}
              to={`/importer/load-postings/${posting.id}`}
              className="block overflow-hidden rounded-3xl border border-korecha-border bg-white shadow-sm transition hover:border-korecha-primary/30 hover:shadow-md"
            >
              <DriverMap
                className="h-[22vh] min-h-[140px] rounded-none border-0"
                routeLocations={postingRouteLocations(posting)}
                interactive={false}
              />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">
                      {refName(posting.itemTypeId)} · {posting.quantity}
                      {typeof posting.itemTypeId === 'object' ? ` ${posting.itemTypeId.unit}` : ''}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      <span className="font-medium text-korecha-primary">{posting.pickup.label}</span>
                      {' → '}
                      <span className="font-medium text-amber-600">{posting.delivery.label}</span>
                    </p>
                  </div>
                  <Badge status={posting.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge status={posting.matchingMode} />
                  <Badge status={posting.mode} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
