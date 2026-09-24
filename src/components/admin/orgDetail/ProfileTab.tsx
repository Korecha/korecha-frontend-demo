import { useState, type FormEvent } from 'react'
import { createOrgCredentials } from '../../../api/admin'
import { Alert } from '../../ui/Alert'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Field, Input, PasswordInput } from '../../ui/Input'
import type { Organization } from '../../../types'
import { TYPE_LABELS } from '../../../utils/format'

export function ProfileTab({ org, onRefresh }: { org: Organization; onRefresh: () => void }) {
  const [error, setError] = useState('')
  const [credForm, setCredForm] = useState({ adminFullName: '', adminEmail: '', adminPassword: '' })
  const [creatingCreds, setCreatingCreds] = useState(false)

  const handleCreateCredentials = async (e: FormEvent) => {
    e.preventDefault()
    setCreatingCreds(true)
    setError('')
    try {
      await createOrgCredentials(org.id, credForm)
      onRefresh()
      setCredForm({ adminFullName: '', adminEmail: '', adminPassword: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create credentials')
    } finally {
      setCreatingCreds(false)
    }
  }

  return (
    <>
      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <Card className="mt-6 max-w-lg">
        <div className="space-y-4">
          {[
            ['Type', org.type ? TYPE_LABELS[org.type] : 'Unassigned'],
            ['Org Admin', org.orgAdmin?.email || 'Not set'],
            ['Email', org.contactEmail || '—'],
            ['Phone', org.phone || '—'],
            ['Address', org.address || '—'],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
            >
              <span className="text-sm text-korecha-muted">{label}</span>
              <span className="text-sm font-medium text-slate-800">{value}</span>
            </div>
          ))}
        </div>
      </Card>

      {!org.orgAdmin && (
        <Card className="mt-6 max-w-lg">
          <h3 className="font-bold text-slate-900">Create Organization Login</h3>
          <p className="mt-1 text-sm text-korecha-muted">
            This organization has no login yet. Create credentials for the org admin.
          </p>
          <form onSubmit={handleCreateCredentials} className="mt-4 space-y-4">
            <Field label="Admin Full Name">
              <Input
                value={credForm.adminFullName}
                onChange={(e) => setCredForm({ ...credForm, adminFullName: e.target.value })}
                required
              />
            </Field>
            <Field label="Admin Email">
              <Input
                type="email"
                value={credForm.adminEmail}
                onChange={(e) => setCredForm({ ...credForm, adminEmail: e.target.value })}
                required
              />
            </Field>
            <Field label="Admin Password">
              <PasswordInput
                value={credForm.adminPassword}
                onChange={(e) => setCredForm({ ...credForm, adminPassword: e.target.value })}
                minLength={6}
                required
              />
            </Field>
            <Button type="submit" disabled={creatingCreds}>
              {creatingCreds ? 'Creating...' : 'Create Login'}
            </Button>
          </form>
        </Card>
      )}
    </>
  )
}
