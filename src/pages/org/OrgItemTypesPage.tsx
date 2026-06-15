import { useEffect, useState, type FormEvent } from 'react'
import { createItemType, listItemTypes } from '../../api/org'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import type { ItemType } from '../../types'

export function OrgItemTypesPage() {
  const [types, setTypes] = useState<ItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', unit: 'units' })

  const load = () => {
    setLoading(true)
    listItemTypes().then((r) => setTypes(r.data)).catch((err) => setError(err.message)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await createItemType(form)
      setShowForm(false)
      setForm({ name: '', description: '', unit: 'units' })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div>
      <PageHeader title="Item Types" description="Cargo types importers can post (containers, cement, gas tanks, etc.)" action={<Button onClick={() => setShowForm(true)}>+ Add type</Button>} />
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      <TableWrapper>
        <Table>
          <TableHead><tr><Th>Name</Th><Th>Unit</Th><Th>Description</Th><Th>Status</Th></tr></TableHead>
          <tbody>
            {loading ? <TableEmpty colSpan={4} message="Loading..." /> : types.length === 0 ? (
              <TableEmpty colSpan={4} message="No item types. Add Container, Cement, Gas tank..." />
            ) : types.map((t) => (
              <TableRow key={t.id}>
                <Td className="font-semibold">{t.name}</Td>
                <Td>{t.unit}</Td>
                <Td>{t.description || '—'}</Td>
                <Td><Badge status={t.isActive ? 'ACTIVE' : 'SUSPENDED'} /></Td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </TableWrapper>
      {showForm && (
        <Modal title="Add item type" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Container, Cement" required /></Field>
            <Field label="Unit"><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="units, tonnes, tanks" /></Field>
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
