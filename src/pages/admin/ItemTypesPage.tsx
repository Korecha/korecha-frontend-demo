import { useEffect, useState, type FormEvent } from 'react'
import { createDefaultItemType, listDefaultItemTypes, updateDefaultItemType } from '../../api/admin'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Input'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import { formatEtb, SPECIAL_HANDLING_LABELS } from '../../utils/format'
import type { ItemType, SpecialHandling } from '../../types'

const EMPTY_FORM = {
  name: '',
  description: '',
  unit: 'units',
  pricePerKmEtb: 0,
  flatFeeEtb: 0,
  specialHandling: 'NONE' as SpecialHandling,
  requiresQuote: false,
  uniPricePerKm: '',
  uniFlatFee: '',
  multiPricePerKm: '',
  multiFlatFee: '',
}

function optionalNumber(value: string): number | null | undefined {
  if (value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function modeKmCell(type: ItemType): string {
  const u = type.modePricing?.UNIMODAL?.pricePerKmEtb
  const m = type.modePricing?.MULTIMODAL?.pricePerKmEtb
  const uLabel = u == null ? '—' : `${u}/km`
  const mLabel = m == null ? '—' : `${m}/km`
  return `U: ${uLabel} · M: ${mLabel}`
}

export function AdminItemTypesPage() {
  const [types, setTypes] = useState<ItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ItemType | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

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
    setForm(EMPTY_FORM)
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
      specialHandling: type.specialHandling ?? 'NONE',
      requiresQuote: type.requiresQuote ?? false,
      uniPricePerKm: type.modePricing?.UNIMODAL?.pricePerKmEtb == null
        ? ''
        : String(type.modePricing.UNIMODAL.pricePerKmEtb),
      uniFlatFee: type.modePricing?.UNIMODAL?.flatFeeEtb == null
        ? ''
        : String(type.modePricing.UNIMODAL.flatFeeEtb),
      multiPricePerKm: type.modePricing?.MULTIMODAL?.pricePerKmEtb == null
        ? ''
        : String(type.modePricing.MULTIMODAL.pricePerKmEtb),
      multiFlatFee: type.modePricing?.MULTIMODAL?.flatFeeEtb == null
        ? ''
        : String(type.modePricing.MULTIMODAL.flatFeeEtb),
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const body = {
      name: form.name,
      description: form.description,
      unit: form.unit,
      pricePerKmEtb: form.pricePerKmEtb,
      flatFeeEtb: form.flatFeeEtb,
      specialHandling: form.specialHandling,
      requiresQuote: form.requiresQuote,
      modePricing: {
        UNIMODAL: {
          pricePerKmEtb: optionalNumber(form.uniPricePerKm),
          flatFeeEtb: optionalNumber(form.uniFlatFee),
        },
        MULTIMODAL: {
          pricePerKmEtb: optionalNumber(form.multiPricePerKm),
          flatFeeEtb: optionalNumber(form.multiFlatFee),
        },
      },
    }
    try {
      if (editing) {
        await updateDefaultItemType(editing.id, body)
      } else {
        await createDefaultItemType(body)
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
        description="Full cargo taxonomy; Container and Break Bulk seeded automatically."
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
              <Th>Special handling</Th>
              <Th>Mode pricing</Th>
              <Th>Quote-based</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={9} message="Loading..." />
            ) : types.length === 0 ? (
              <TableEmpty colSpan={9} message="No default item types yet" />
            ) : (
              types.map((t) => (
                <TableRow key={t.id}>
                  <Td className="font-semibold">{t.name}</Td>
                  <Td>{t.unit}</Td>
                  <Td>{formatEtb(t.pricePerKmEtb ?? 0)}</Td>
                  <Td>{formatEtb(t.flatFeeEtb ?? 0)}</Td>
                  <Td>
                    {(t.specialHandling ?? 'NONE') === 'NONE' ? (
                      SPECIAL_HANDLING_LABELS.NONE
                    ) : (
                      <Badge status={t.specialHandling ?? 'NONE'} />
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-slate-600">{modeKmCell(t)}</Td>
                  <Td>
                    {t.requiresQuote ? (
                      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                        Quote
                      </span>
                    ) : (
                      '—'
                    )}
                  </Td>
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
            <Field label="Special handling">
              <Select
                value={form.specialHandling}
                onChange={(e) =>
                  setForm({ ...form, specialHandling: e.target.value as SpecialHandling })
                }
              >
                <option value="NONE">None</option>
                <option value="TEMPERATURE_CONTROLLED">Temp-controlled</option>
                <option value="PERMIT_AND_ESCORT">Permits + escort</option>
              </Select>
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.requiresQuote}
                onChange={(e) => setForm({ ...form, requiresQuote: e.target.checked })}
              />
              Quote-based (metadata only; does not block jobs)
            </label>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Mode pricing</p>
              <p className="mb-3 text-xs text-slate-500">
                Leave blank to inherit the default extra ETB / km and flat fee above.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Unimodal ETB / km">
                  <Input
                    type="number"
                    min={0}
                    placeholder={String(form.pricePerKmEtb)}
                    value={form.uniPricePerKm}
                    onChange={(e) => setForm({ ...form, uniPricePerKm: e.target.value })}
                  />
                </Field>
                <Field label="Unimodal flat fee">
                  <Input
                    type="number"
                    min={0}
                    placeholder={String(form.flatFeeEtb)}
                    value={form.uniFlatFee}
                    onChange={(e) => setForm({ ...form, uniFlatFee: e.target.value })}
                  />
                </Field>
                <Field label="Multimodal ETB / km">
                  <Input
                    type="number"
                    min={0}
                    placeholder={String(form.pricePerKmEtb)}
                    value={form.multiPricePerKm}
                    onChange={(e) => setForm({ ...form, multiPricePerKm: e.target.value })}
                  />
                </Field>
                <Field label="Multimodal flat fee">
                  <Input
                    type="number"
                    min={0}
                    placeholder={String(form.flatFeeEtb)}
                    value={form.multiFlatFee}
                    onChange={(e) => setForm({ ...form, multiFlatFee: e.target.value })}
                  />
                </Field>
              </div>
            </div>
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
