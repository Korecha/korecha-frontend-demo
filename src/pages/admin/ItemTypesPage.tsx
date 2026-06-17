import { useEffect, useState, type FormEvent } from 'react'
import { createDefaultItemType, listDefaultItemTypes, updateDefaultItemType } from '../../api/admin'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import { formatEtb } from '../../utils/format'
import type { ItemType } from '../../types'

export function AdminItemTypesPage() {
  const [types, setTypes] = useState<ItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ItemType | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    unit: 'units',
    pricePerKmEtb: 0,
    flatFeeEtb: 0,
  })

  const load = () => {
    setLoading(true)
    listDefaultItemTypes()
      .then((r) => setTypes(r.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setForm({ name: '', description: '', unit: 'units', pricePerKmEtb: 0, flatFeeEtb: 0 })
    setEditing(null)
    setShowForm(false)
  }

  const openEdit = (type: ItemType) => {
    setEditing(type)
    setForm({
      name: type.name,
      description: type.description || '',
      unit: type.unit,
      pricePerKmEtb: type.pricePerKmEtb ?? 0,
      flatFeeEtb: type.flatFeeEtb ?? 0,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await updateDefaultItemType(editing.id, form)
      } else {
        await createDefaultItemType(form)
      }
      resetForm()
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  const toggleActive = async (type: ItemType) => {
    try {
      await updateDefaultItemType(type.id, { isActive: !type.isActive })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div>
      <PageHeader
        title="Default Item Types"
        description="Platform-wide cargo types with default pricing. Container and Unstuffed are created automatically."
        action={<Button onClick={() => { resetForm(); setShowForm(true) }}>+ Add default type</Button>}
      />
      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}
      <TableWrapper>
        <Table>
          <TableHead>
            <tr>
              <Th>Name</Th>
              <Th>Unit</Th>
              <Th>ETB / km</Th>
              <Th>Flat fee</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={6} message="Loading..." />
            ) : types.length === 0 ? (
              <TableEmpty colSpan={6} message="No default item types yet" />
            ) : (
              types.map((t) => (
                <TableRow key={t.id}>
                  <Td className="font-semibold">{t.name}</Td>
                  <Td>{t.unit}</Td>
                  <Td>{formatEtb(t.pricePerKmEtb ?? 0)}</Td>
                  <Td>{formatEtb(t.flatFeeEtb ?? 0)}</Td>
                  <Td>
                    <Badge status={t.isActive ? 'ACTIVE' : 'SUSPENDED'} />
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(t)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => toggleActive(t)}>
                        {t.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </Td>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </TableWrapper>
      {showForm && (
        <Modal title={editing ? `Edit ${editing.name}` : 'Add default item type'} onClose={resetForm}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                disabled={!!editing}
              />
            </Field>
            <Field label="Unit">
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </Field>
            <Field label="Default extra ETB per km">
              <Input
                type="number"
                min={0}
                value={form.pricePerKmEtb}
                onChange={(e) => setForm({ ...form, pricePerKmEtb: Number(e.target.value) })}
              />
            </Field>
            <Field label="Default flat fee per unit (ETB)">
              <Input
                type="number"
                min={0}
                value={form.flatFeeEtb}
                onChange={(e) => setForm({ ...form, flatFeeEtb: Number(e.target.value) })}
              />
            </Field>
            <Field label="Description">
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <ModalFooter>
              <Button variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  )
}
