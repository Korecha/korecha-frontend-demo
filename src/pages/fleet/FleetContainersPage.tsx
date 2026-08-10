import { useEffect, useState } from 'react'
import { listFleetContainers } from '../../api/fleet'
import { isApproved, useAuth } from '../../auth/AuthContext'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import { formatDate, refName } from '../../utils/format'
import type { Container } from '../../types'

// Read-only view-only tab for MTO-linked fleet managers (heads-up #2). Fleet managers not linked
// to a shipping line simply see an empty state — no provider-type branching in the UI either.
export function FleetContainersPage() {
  const { memberProfile } = useAuth()
  const [containers, setContainers] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const approved = isApproved(memberProfile)

  useEffect(() => {
    if (!approved) { setLoading(false); return }
    setLoading(true)
    listFleetContainers()
      .then((r) => setContainers(r.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [approved])

  if (!approved) {
    return (
      <div>
        <PageHeader title="Containers" />
        <Alert variant="warning" className="mt-6">Available after your fleet account is approved.</Alert>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Containers" description="View-only status of containers tied to your shipping line, if any" />
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      <TableWrapper>
        <Table>
          <TableHead><tr><Th>Container #</Th><Th>Size</Th><Th>Type</Th><Th>Status</Th><Th>Location</Th><Th>Last Free Day</Th></tr></TableHead>
          <tbody>
            {loading ? <TableEmpty colSpan={6} message="Loading..." /> : containers.length === 0 ? (
              <TableEmpty colSpan={6} message="No containers to show — this fleet manager isn't linked to a shipping line." />
            ) : containers.map((c) => (
              <TableRow key={c.id}>
                <Td className="font-semibold">{c.containerNumber}</Td>
                <Td>{c.size}</Td>
                <Td>{c.type}</Td>
                <Td><Badge status={c.status} /></Td>
                <Td>{c.location?.label || refName(c.location?.locationId)}</Td>
                <Td>{formatDate(c.lastFreeDay)}</Td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </TableWrapper>
    </div>
  )
}
