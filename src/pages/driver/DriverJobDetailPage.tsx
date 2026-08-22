import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  completeDriverLeg,
  getDriverJob,
  listDriverJobRatings,
  respondToJobRequest,
  startDriverLeg,
  submitDriverJobRating,
  uploadDriverLegPod,
} from '../../api/driver'
import { useAuth } from '../../auth/AuthContext'
import { DriverMap } from '../../components/driver/DriverMap'
import { DriverJobProgress } from '../../components/jobs/DriverJobProgress'
import { RatingCard, type RatingCounterpart } from '../../components/jobs/RatingCard'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { fileUrl } from '../../utils/fileUrl'
import { formatDate, refName } from '../../utils/format'
import { jobRouteLocations, legRouteLocations } from '../../utils/jobMap'
import type { Job, JobRequest, Rating, ShipmentLeg } from '../../types'

function locName(value: ShipmentLeg['fromLocationId']): string {
  return refName(value as string | { name?: string } | null | undefined)
}

export function DriverJobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [request, setRequest] = useState<JobRequest | null>(null)
  const [currentLeg, setCurrentLeg] = useState<ShipmentLeg | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acting, setActing] = useState(false)
  const [legCompleteOpen, setLegCompleteOpen] = useState(false)
  const [podFile, setPodFile] = useState<File | null>(null)
  const [podPreview, setPodPreview] = useState('')
  const [ratings, setRatings] = useState<Rating[]>([])

  const load = () => {
    if (!id) return
    setLoading(true)
    getDriverJob(id)
      .then((r) => {
        setJob(r.data.job)
        setRequest(r.data.request)
        setCurrentLeg(r.data.currentLeg || r.data.job.currentLeg || null)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [id])

  const loadRatings = useCallback(() => {
    if (!id || !job || job.status !== 'COMPLETED') return
    listDriverJobRatings(id)
      .then((r) => setRatings(r.data))
      .catch(() => {})
  }, [id, job])

  useEffect(() => {
    loadRatings()
  }, [loadRatings])

  useEffect(() => {
    return () => {
      if (podPreview.startsWith('blob:')) URL.revokeObjectURL(podPreview)
    }
  }, [podPreview])

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
    if (!currentLeg) return
    setActing(true)
    setError('')
    try {
      await startDriverLeg(currentLeg.id)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setActing(false)
    }
  }

  const handlePodChange = (file: File | null) => {
    setPodPreview((prev) => {
      if (prev.startsWith('blob:')) URL.revokeObjectURL(prev)
      return file ? URL.createObjectURL(file) : ''
    })
    setPodFile(file)
  }

  const handleComplete = async () => {
    if (!currentLeg) return
    if (!podFile && !currentLeg.podPhotoUrl) {
      setError('A delivery photo is required to complete this leg')
      return
    }
    setActing(true)
    setError('')
    try {
      if (podFile) {
        const uploaded = await uploadDriverLegPod(currentLeg.id, podFile)
        setCurrentLeg(uploaded.data.currentLeg)
      }
      const r = await completeDriverLeg(currentLeg.id)
      if (r.data.released) {
        setLegCompleteOpen(true)
        return
      }
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
  const importerCounterparts: RatingCounterpart[] = importer
    ? [{ userId: importer.id, label: importer.fullName }]
    : []
  const showRequestActions = !!request && ['OPEN', 'REQUESTED'].includes(job.status)
  const showDriverProgress = ['ASSIGNED', 'IN_TRANSIT', 'PENDING_APPROVAL', 'COMPLETED'].includes(
    job.status,
  )
  const route = currentLeg ? legRouteLocations(currentLeg) : jobRouteLocations(job)
  const routeLabel = currentLeg
    ? `${locName(currentLeg.fromLocationId)} → ${locName(currentLeg.toLocationId)}`
    : `${job.pickup.label} → ${job.delivery.label}`

  return (
    <div className="space-y-4">
      <Link
        to="/driver/jobs"
        className="inline-flex items-center gap-1 text-sm font-medium text-korecha-primary hover:underline"
      >
        ← Back to jobs
      </Link>

      <div className="rounded-3xl border border-korecha-border bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {refName(job.itemTypeId)} × {job.quantity}
            </h2>
            {currentLeg ? (
              <p className="mt-1 text-sm text-slate-600">
                Leg {currentLeg.sequenceNo}: {routeLabel}
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-600">{routeLabel}</p>
            )}
          </div>
          <Badge status={currentLeg?.status || job.status} />
        </div>

        {job.notes && (
          <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {job.notes}
          </p>
        )}

        {importer && (
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-blue-50 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Importer
              </p>
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

        {showDriverProgress && (
          <div className="mt-4">
            <DriverJobProgress status={job.status} currentLeg={currentLeg} />
          </div>
        )}
        {job.completedAt && (
          <p className="mt-2 text-xs text-slate-500">Completed {formatDate(job.completedAt)}</p>
        )}
      </div>

      <DriverMap
        className="h-[36vh] min-h-[220px]"
        routeLocations={route.length ? route : jobRouteLocations(job)}
        interactive
      />

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
            <Button
              className="flex-1 py-3"
              variant="secondary"
              disabled={acting}
              onClick={() => handleRespond(false)}
            >
              Decline
            </Button>
          </div>
        </div>
      )}

      {currentLeg?.status === 'ASSIGNED' && (
        <Button className="w-full py-3.5" disabled={acting} onClick={handleStart}>
          {acting ? 'Starting...' : 'Start this leg'}
        </Button>
      )}

      {currentLeg?.status === 'IN_TRANSIT' && (
        <div className="rounded-3xl border border-korecha-border bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-900">Delivery photo required</h3>
          <p className="mt-1 text-sm text-slate-600">
            Take a photo of the delivery. You cannot finish this trip without a photo.
          </p>
          <div className="mt-4">
            <Field label="Take or choose a photo">
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                className="cursor-pointer py-3"
                onChange={(e) => handlePodChange(e.target.files?.[0] || null)}
              />
            </Field>
          </div>
          {(podPreview || currentLeg.podPhotoUrl) && (
            <a
              href={podPreview || fileUrl(currentLeg.podPhotoUrl)}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block overflow-hidden rounded-2xl border border-korecha-border"
            >
              <img
                src={podPreview || fileUrl(currentLeg.podPhotoUrl)}
                alt="Delivery photo preview"
                className="h-56 w-full object-cover"
              />
            </a>
          )}
          <Button className="mt-4 w-full py-3.5" disabled={acting} onClick={handleComplete}>
            {acting ? 'Submitting...' : 'Complete this leg'}
          </Button>
        </div>
      )}

      {legCompleteOpen && (
        <Modal title="Your leg is complete" onClose={() => navigate('/driver/jobs')}>
          <p className="text-sm text-slate-600">
            You and your truck are available for another load. The rest of this shipment continues
            with the next leg.
          </p>
          <ModalFooter>
            <Button onClick={() => navigate('/driver/jobs')}>Back to jobs</Button>
          </ModalFooter>
        </Modal>
      )}

      {!currentLeg && job.status === 'IN_TRANSIT' && (
        <div className="rounded-2xl bg-slate-50 p-4 text-center">
          <p className="font-semibold text-slate-800">Waiting on the previous leg</p>
          <p className="mt-1 text-sm text-slate-600">
            Your assigned leg will unlock when the previous one is completed.
          </p>
        </div>
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

      {job.status === 'COMPLETED' && user && (
        <RatingCard
          counterparts={importerCounterparts}
          ratings={ratings}
          currentUserId={user.id}
          onSubmit={async (_rateeUserId, score, comment) => {
            await submitDriverJobRating(id!, { score, comment: comment || undefined })
            loadRatings()
          }}
        />
      )}
    </div>
  )
}
