import { useEffect, useState, type FormEvent } from 'react'
import {
  createGateEntrance,
  listGateEntrances,
  listOrgLocations,
  updateGateEntrance,
} from '../../api/org'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Input'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import { formatEtb, refName } from '../../utils/format'
import type { GateEntrance, Location } from '../../types'

export function OrgGateEntrancesPage() {
  const [gates, setGates] = useState<GateEntrance[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', locationId: '', feeEtb: 0 })

  const load = () => {
    setLoading(true)
    Promise.all([listGateEntrances(), listOrgLocations()])
      .then(([gateRes, locRes]) => {
        setGates(gateRes.data)
        setLocations(locRes.data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await createGateEntrance({
        name: form.name,
        locationId: form.locationId || undefined,
        feeEtb: form.feeEtb,
      })
      setShowForm(false)
      setForm({ name: '', locationId: '', feeEtb: 0 })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  const toggleActive = async (gate: GateEntrance) => {
    try {
      await updateGateEntrance(gate.id, { isActive: !gate.isActive })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div>
      <PageHeader
        title="Gate Entrances"
        description="Set per-gate entrance fees (ETB). Applied when a job pickup or delivery uses the linked location."
        action={<Button onClick={() => setShowForm(true)}>+ Add gate</Button>}
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
              <Th>Gate</Th>
              <Th>Location</Th>
              <Th>Fee (ETB)</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={5} message="Loading..." />
            ) : gates.length === 0 ? (
              <TableEmpty colSpan={5} message="No gate entrances configured" />
            ) : (
              gates.map((gate) => (
                <TableRow key={gate.id}>
                  <Td className="font-semibold">{gate.name}</Td>
                  <Td>{refName(gate.locationId) || '—'}</Td>
                  <Td>{formatEtb(gate.feeEtb)}</Td>
                  <Td>
                    <Badge status={gate.isActive ? 'ACTIVE' : 'SUSPENDED'} />
                  </Td>
                  <Td>
                    <Button size="sm" variant="secondary" onClick={() => toggleActive(gate)}>
                      {gate.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </Td>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </TableWrapper>
      {showForm && (
        <Modal title="Add gate entrance" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Gate name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Modjo Gate 1"
                required
              />
            </Field>
            <Field label="Linked location">
              <Select
                value={form.locationId}
                onChange={(e) => setForm({ ...form, locationId: e.target.value })}
              >
                <option value="">No linked location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Entrance fee (ETB)">
              <Input
                type="number"
                min={0}
                value={form.feeEtb}
                onChange={(e) => setForm({ ...form, feeEtb: Number(e.target.value) })}
                required
              />
            </Field>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
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
