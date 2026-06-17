import { useEffect, useState } from 'react'
import { listSoleImporterApplications, reviewSoleImporterApplication } from '../../api/admin'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import { fileUrl } from '../../utils/fileUrl'
import type { ImporterProfile } from '../../types'

export function AdminApplicationsPage() {
  const [importers, setImporters] = useState<ImporterProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    listSoleImporterApplications('PENDING')
      .then((res) => setImporters(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const review = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await reviewSoleImporterApplication(id, {
        status,
        rejectionReason: status === 'REJECTED' ? 'Documents did not meet requirements' : undefined,
      })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div>
      <PageHeader
        title="Importer Applications"
        description="Review independent importers registering without an organization"
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
              <Th>Company</Th>
              <Th>Contact</Th>
              <Th>Phone</Th>
              <Th>Documents</Th>
              <Th>Actions</Th>
            </tr>
          </TableHead>
          <tbody>
            {loading ? (
              <TableEmpty colSpan={5} message="Loading..." />
            ) : importers.length === 0 ? (
              <TableEmpty colSpan={5} message="No pending sole importer applications" />
            ) : (
              importers.map((imp) => (
                <TableRow key={imp.id}>
                  <Td className="font-semibold">{imp.companyName || imp.user?.fullName}</Td>
                  <Td>{imp.user?.fullName}</Td>
                  <Td>{imp.user?.phone || '—'}</Td>
                  <Td className="space-x-3">
                    {imp.nationalIdFile && (
                      <a
                        href={fileUrl(imp.nationalIdFile)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-korecha-primary hover:underline"
                      >
                        National ID
                      </a>
                    )}
                    {imp.importLicenseFile && (
                      <a
                        href={fileUrl(imp.importLicenseFile)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-korecha-primary hover:underline"
                      >
                        Import license
                      </a>
                    )}
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => review(imp.id, 'APPROVED')}>
                        Approve
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => review(imp.id, 'REJECTED')}>
                        Reject
                      </Button>
                    </div>
                  </Td>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </TableWrapper>
    </div>
  )
}
