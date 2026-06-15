import { useEffect, useState, type FormEvent } from 'react'
import { createTruckType, listTruckTypes, updateTruckType } from '../../api/org'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import type { TruckType } from '../../types'

export function OrgTruckTypesPage() {
  const [types, setTypes] = useState<TruckType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  const load = () => {
    setLoading(true)
    listTruckTypes()
      .then((r) => setTypes(r.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await createTruckType(form)
      setShowForm(false)
      setForm({ name: '', description: '' })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create')
    }
  }

  const toggleActive = async (t: TruckType) => {
    try {
      await updateTruckType(t.id, { isActive: !t.isActive })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  return (
    <div>
      <PageHeader title="Truck Types" description="Define truck types drivers and fleets can select" action={<Button onClick={() => setShowForm(true)}>+ Add Type</Button>} />
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      <TableWrapper>
        <Table>
          <TableHead><tr><Th>Name</Th><Th>Description</Th><Th>Status</Th><Th>Actions</Th></tr></TableHead>
          <tbody>
            {loading ? <TableEmpty colSpan={4} message="Loading..." /> : types.length === 0 ? (
              <TableEmpty colSpan={4} message="No truck types yet. Add types like Flatbed, Tanker, Reefer." />
            ) : types.map((t) => (
              <TableRow key={t.id}>
                <Td className="font-semibold">{t.name}</Td>
                <Td>{t.description || '—'}</Td>
                <Td><Badge status={t.isActive ? 'ACTIVE' : 'SUSPENDED'} /></Td>
                <Td>
                  <button type="button" onClick={() => toggleActive(t)} className="text-sm font-medium text-korecha-primary hover:underline">
                    {t.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </Td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </TableWrapper>
      {showForm && (
        <Modal title="Add Truck Type" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Flatbed, Tanker" required /></Field>
            <Field label="Description"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  )
}
