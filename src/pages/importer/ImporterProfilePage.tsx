import { useEffect, useState } from 'react'
import { getImporterProfile } from '../../api/importer'
import { useAuth } from '../../auth/AuthContext'
import { Badge } from '../../components/ui/Badge'
import { fileUrl } from '../../utils/fileUrl'
import type { ImporterProfile } from '../../types'

export function ImporterProfilePage() {
  const { user, organization } = useAuth()
  const [profile, setProfile] = useState<ImporterProfile | null>(null)
  const [stats, setStats] = useState<Record<string, number>>({})

  useEffect(() => {
    getImporterProfile().then((r) => {
      setProfile(r.data.profile)
      setStats(r.data.stats)
    }).catch(() => {})
  }, [])

  const completed = stats.COMPLETED || 0
  const total = Object.values(stats).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-korecha-navy via-korecha-navy-light to-blue-600 p-6 text-white shadow-xl shadow-blue-900/20">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold backdrop-blur">
            {(profile?.companyName || user?.fullName)?.charAt(0)}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold">{profile?.companyName || user?.fullName}</h2>
            <p className="truncate text-sm text-blue-100">{organization?.name}</p>
            {profile?.status && (
              <div className="mt-2">
                <Badge status={profile.status} />
              </div>
            )}
          </div>
        </div>
        <div className="relative mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-blue-100">Total jobs</p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur">
            <p className="text-2xl font-bold">{completed}</p>
            <p className="text-xs text-blue-100">Completed</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-korecha-border bg-white p-5 shadow-sm">
        <h3 className="font-bold text-slate-900">Contact</h3>
        <div className="mt-3 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Email</span>
            <span className="font-medium text-slate-900">{user?.email}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Phone</span>
            <span className="font-medium text-slate-900">{user?.phone || '—'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Contact name</span>
            <span className="font-medium text-slate-900">{user?.fullName}</span>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-korecha-border bg-white p-5 shadow-sm">
        <h3 className="font-bold text-slate-900">Documents</h3>
        <div className="mt-3 flex flex-col gap-2">
          {profile?.nationalIdFile ? (
            <a
              href={fileUrl(profile.nationalIdFile)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-korecha-primary transition hover:bg-blue-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              National ID
            </a>
          ) : (
            <p className="text-sm text-slate-500">No national ID on file</p>
          )}
          {profile?.importLicenseFile ? (
            <a
              href={fileUrl(profile.importLicenseFile)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-korecha-primary transition hover:bg-blue-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Import license
            </a>
          ) : (
            <p className="text-sm text-slate-500">No import license on file</p>
          )}
        </div>
      </div>
    </div>
  )
}
