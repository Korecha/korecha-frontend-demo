import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiRequestError } from '../../api/client'
import { registerImporter } from '../../api/register'
import { getHomeRoute, useAuth } from '../../auth/AuthContext'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'

export function RegisterImporterPage() {
  const navigate = useNavigate()
  const { refreshSession } = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    password: '',
    phone: '',
  })
  const [nationalId, setNationalId] = useState<File | null>(null)
  const [importLicense, setImportLicense] = useState<File | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!nationalId || !importLicense) {
      setError('National ID and import license are required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('nationalId', nationalId)
      fd.append('importLicense', importLicense)
      const res = await registerImporter(fd)
      await refreshSession()
      navigate(getHomeRoute(res.user.role))
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="Importer Registration"
          description="Register as an independent importer. A platform admin will review your documents before you can use the portal."
        />
        <div className="mt-6 rounded-2xl border bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <Alert>{error}</Alert>}
            <Field label="Company name">
              <Input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="Your business name"
              />
            </Field>
            <Field label="Your full name">
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={6}
                required
              />
            </Field>
            <Field label="National ID">
              <Input type="file" accept="image/*,.pdf" onChange={(e) => setNationalId(e.target.files?.[0] || null)} required />
            </Field>
            <Field label="Import license">
              <Input type="file" accept="image/*,.pdf" onChange={(e) => setImportLicense(e.target.files?.[0] || null)} required />
            </Field>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Submitting...' : 'Submit application'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            <Link to="/login" className="font-medium text-emerald-600">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
