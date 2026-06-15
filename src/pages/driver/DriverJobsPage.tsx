import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  completeDriverJob,
  listDriverActiveJobs,
  listDriverJobHistory,
  listDriverJobRequests,
  respondToJobRequest,
  startDriverJob,
} from '../../api/driver'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { DriverMap } from '../../components/driver/DriverMap'
import { DriverJobProgress } from '../../components/jobs/DriverJobProgress'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { formatDate, refName } from '../../utils/format'
import { jobRouteLocations } from '../../utils/jobMap'
import type { Job, JobRequest } from '../../types'

type Tab = 'requests' | 'active' | 'history'

export function DriverJobsPage() {
  const { memberProfile } = useAuth()
  const approved = isApproved(memberProfile)
  const [tab, setTab] = useState<Tab>('requests')
  const [requests, setRequests] = useState<JobRequest[]>([])
  const [activeJobs, setActiveJobs] = useState<Job[]>([])
  const [history, setHistory] = useState<Job[]>([])
  const [error, setError] = useState('')
  const [acting, setActing] = useState<string | null>(null)

  const load = () => {
    Promise.all([
      listDriverJobRequests(),
      listDriverActiveJobs(),
      listDriverJobHistory(),
    ])
      .then(([reqRes, activeRes, histRes]) => {
        setRequests(reqRes.data)
        setActiveJobs(activeRes.data)
        setHistory(histRes.data)
        if (reqRes.data.length > 0) setTab('requests')
        else if (activeRes.data.length > 0) setTab('active')
      })
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    if (approved) load()
  }, [approved])

  const handleRespond = async (id: string, accept: boolean) => {
    setActing(id)
    try {
      await respondToJobRequest(id, accept)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setActing(null)
    }
  }

  const handleStart = async (id: string) => {
    setActing(id)
    try {
      await startDriverJob(id)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setActing(null)
    }
  }

  const handleComplete = async (id: string) => {
    setActing(id)
    try {
      await completeDriverJob(id)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setActing(null)
    }
  }

  if (!approved) {
    return (
      <Alert variant="warning">
        Haul jobs from importers are available after your account is approved. Stay live on the map to receive requests.
      </Alert>
    )
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'requests', label: 'Requests', count: requests.length },
    { key: 'active', label: 'Active', count: activeJobs.length },
    { key: 'history', label: 'History', count: history.length },
  ]

  const featuredJob = activeJobs[0]

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Haul jobs</h2>
        <p className="mt-1 text-sm text-slate-500">Accept importer requests and manage your trips</p>
      </div>

      {error && <Alert>{error}</Alert>}

      {featuredJob && tab !== 'active' && (
        <Link
          to={`/driver/jobs/${featuredJob.id}`}
          className="block rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-korecha-primary">Active trip</p>
            <Badge status={featuredJob.status} />
          </div>
          <p className="mt-2 font-bold text-slate-900">
            {refName(featuredJob.itemTypeId)} × {featuredJob.quantity}
          </p>
          <p className="text-sm text-slate-600">{featuredJob.pickup.label} → {featuredJob.delivery.label}</p>
          <p className="mt-2 text-xs font-semibold text-korecha-primary">View trip →</p>
        </Link>
      )}

      <div className="flex gap-2 rounded-2xl bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition ${
              tab === t.key ? 'bg-white text-korecha-primary shadow-sm' : 'text-slate-500'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                tab === t.key ? 'bg-blue-100 text-korecha-primary' : 'bg-slate-200 text-slate-600'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'requests' && (
        requests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <p className="font-semibold text-slate-700">No pending requests</p>
            <p className="mt-1 text-sm text-slate-500">Go live and set availability to Available to appear on the importer map</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => {
              const job = typeof r.jobId === 'object' ? r.jobId : null
              const importer = typeof r.importerId === 'object' ? r.importerId : null
              if (!job) return null
              return (
                <div key={r.id} className="overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm">
                  <DriverMap className="h-[24vh] min-h-[140px] rounded-none border-0" routeLocations={jobRouteLocations(job)} interactive={false} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900">{refName(job.itemTypeId)} × {job.quantity}</p>
                        <p className="text-sm text-slate-600">{job.pickup.label} → {job.delivery.label}</p>
                        {importer && (
                          <p className="mt-1 text-xs text-slate-500">From {importer.fullName}</p>
                        )}
                      </div>
                      <Badge status="PENDING" />
                    </div>
                    {job.notes && <p className="mt-2 text-xs text-slate-500">{job.notes}</p>}
                    <div className="mt-4 flex gap-2">
                      <Button
                        className="flex-1"
                        disabled={acting === r.id}
                        onClick={() => handleRespond(r.id, true)}
                      >
                        Accept
                      </Button>
                      <Button
                        className="flex-1"
                        variant="secondary"
                        disabled={acting === r.id}
                        onClick={() => handleRespond(r.id, false)}
                      >
                        Decline
                      </Button>
                    </div>
                    <Link
                      to={`/driver/jobs/${job.id}`}
                      className="mt-3 block text-center text-xs font-semibold text-korecha-primary hover:underline"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {tab === 'active' && (
        activeJobs.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">No active jobs right now</p>
        ) : (
          <div className="space-y-4">
            {activeJobs.map((job) => (
              <div key={job.id} className="overflow-hidden rounded-3xl border bg-white shadow-sm">
                <DriverMap className="h-[24vh] min-h-[140px] rounded-none border-0" routeLocations={jobRouteLocations(job)} interactive={false} />
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <p className="font-bold text-slate-900">{refName(job.itemTypeId)} × {job.quantity}</p>
                    <Badge status={job.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{job.pickup.label} → {job.delivery.label}</p>
                  <div className="mt-3"><DriverJobProgress status={job.status} /></div>
                  <div className="mt-4 flex gap-2">
                    {job.status === 'ASSIGNED' && (
                      <Button className="flex-1" disabled={acting === job.id} onClick={() => handleStart(job.id)}>
                        Start trip
                      </Button>
                    )}
                    {job.status === 'IN_TRANSIT' && (
                      <Button className="flex-1" disabled={acting === job.id} onClick={() => handleComplete(job.id)}>
                        Mark completed
                      </Button>
                    )}
                    <Link to={`/driver/jobs/${job.id}`} className="flex-1">
                      <Button variant="secondary" className="w-full">Details</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'history' && (
        history.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Completed jobs will appear here</p>
        ) : (
          <div className="space-y-3">
            {history.map((job) => (
              <Link
                key={job.id}
                to={`/driver/jobs/${job.id}`}
                className="block rounded-2xl border bg-white p-4 shadow-sm transition hover:border-korecha-primary/30"
              >
                <div className="flex items-start justify-between">
                  <p className="font-bold text-slate-900">{refName(job.itemTypeId)} × {job.quantity}</p>
                  <Badge status="COMPLETED" />
                </div>
                <p className="mt-1 text-sm text-slate-600">{job.pickup.label} → {job.delivery.label}</p>
                {job.completedAt && (
                  <p className="mt-2 text-xs text-slate-400">{formatDate(job.completedAt)}</p>
                )}
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  )
}
