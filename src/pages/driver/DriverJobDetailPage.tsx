import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  completeDriverJob,
  getDriverJob,
  respondToJobRequest,
  startDriverJob,
} from '../../api/driver'
import { DriverMap } from '../../components/driver/DriverMap'
import { DriverJobProgress } from '../../components/jobs/DriverJobProgress'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { formatDate, refName } from '../../utils/format'
import { jobRouteLocations } from '../../utils/jobMap'
import type { Job, JobRequest } from '../../types'

export function DriverJobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [request, setRequest] = useState<JobRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acting, setActing] = useState(false)

  const load = () => {
    if (!id) return
    setLoading(true)
    getDriverJob(id)
      .then((r) => {
        setJob(r.data.job)
        setRequest(r.data.request)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const handleRespond = async (accept: boolean) => {
    if (!request) return
    setActing(true)
    setError('')
    try {
      await respondToJobRequest(request.id, accept)
      if (accept && id) navigate(`/driver/jobs/${id}`, { replace: true })
      else navigate('/driver/jobs')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setActing(false)
    }
  }

  const handleStart = async () => {
    if (!id) return
    setActing(true)
    try {
      await startDriverJob(id)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setActing(false)
    }
  }

  const handleComplete = async () => {
    if (!id) return
    setActing(true)
    try {
      await completeDriverJob(id)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setActing(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading job...</p>
  if (!job) return <Alert>Job not found</Alert>

  const importer = typeof job.importerId === 'object' ? job.importerId : null
  const showRequestActions = !!request && ['OPEN', 'REQUESTED'].includes(job.status)
  const showDriverProgress = ['ASSIGNED', 'IN_TRANSIT', 'PENDING_APPROVAL', 'COMPLETED'].includes(job.status)

  return (
    <div className="space-y-4">
      <Link to="/driver/jobs" className="inline-flex items-center gap-1 text-sm font-medium text-korecha-primary hover:underline">
        ← Back to jobs
      </Link>

      <div className="rounded-3xl border border-korecha-border bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {refName(job.itemTypeId)} × {job.quantity}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{job.pickup.label} → {job.delivery.label}</p>
          </div>
          <Badge status={job.status} />
        </div>

        {job.notes && (
          <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{job.notes}</p>
        )}

        {importer && (
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-blue-50 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Importer</p>
              <p className="font-semibold text-slate-900">{importer.fullName}</p>
            </div>
            {importer.phone && (
              <a
                href={`tel:${importer.phone}`}
                className="rounded-xl bg-korecha-primary px-3 py-2 text-xs font-bold text-white shadow-sm"
              >
                Call
              </a>
            )}
          </div>
        )}

        {showDriverProgress && <div className="mt-4"><DriverJobProgress status={job.status} /></div>}
        {job.completedAt && (
          <p className="mt-2 text-xs text-slate-500">Completed {formatDate(job.completedAt)}</p>
        )}
      </div>

      <DriverMap className="h-[36vh] min-h-[220px]" routeLocations={jobRouteLocations(job)} interactive />

      {error && <Alert>{error}</Alert>}

      {showRequestActions && request && (
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
          <h3 className="font-bold text-amber-900">New haul request</h3>
          <p className="mt-1 text-sm text-amber-800">
            An importer wants you to haul this cargo. Accept to assign the job to you.
          </p>
          <div className="mt-4 flex gap-3">
            <Button className="flex-1 py-3" disabled={acting} onClick={() => handleRespond(true)}>
              {acting ? '...' : 'Accept job'}
            </Button>
            <Button className="flex-1 py-3" variant="secondary" disabled={acting} onClick={() => handleRespond(false)}>
              Decline
            </Button>
          </div>
        </div>
      )}

      {job.status === 'ASSIGNED' && (
        <Button className="w-full py-3.5" disabled={acting} onClick={handleStart}>
          {acting ? 'Starting...' : 'Start trip — head to pickup'}
        </Button>
      )}

      {job.status === 'IN_TRANSIT' && (
        <Button className="w-full py-3.5" disabled={acting} onClick={handleComplete}>
          {acting ? 'Submitting...' : 'Mark delivered — submit for importer approval'}
        </Button>
      )}

      {job.status === 'PENDING_APPROVAL' && (
        <div className="rounded-2xl bg-orange-50 p-4 text-center">
          <p className="font-semibold text-orange-800">Delivery submitted</p>
          <p className="mt-1 text-sm text-orange-700">
            Waiting for the importer to approve. You will be available for new jobs after approval.
          </p>
          {job.deliveredAt && (
            <p className="mt-2 text-xs text-orange-600">Delivered {formatDate(job.deliveredAt)}</p>
          )}
        </div>
      )}

      {job.status === 'COMPLETED' && (
        <div className="rounded-2xl bg-emerald-50 p-4 text-center">
          <p className="font-semibold text-emerald-800">Job completed successfully</p>
          <p className="mt-1 text-sm text-emerald-700">You are available for new requests</p>
        </div>
      )}
    </div>
  )
}
