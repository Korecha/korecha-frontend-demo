import { useEffect, useState } from 'react'
import { listApplications, reviewDriverApplication, reviewFleetApplication, reviewImporterApplication, reviewOrgTruck, listPendingTrucks } from '../../api/org'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableEmpty, TableHead, TableRow, TableWrapper, Td, Th } from '../../components/ui/Table'
import { fileUrl } from '../../utils/fileUrl'
import { refName } from '../../utils/format'
import type { DriverProfile, FleetProfile, ImporterProfile, Truck } from '../../types'

export function OrgApplicationsPage() {
  const [drivers, setDrivers] = useState<DriverProfile[]>([])
  const [fleets, setFleets] = useState<FleetProfile[]>([])
  const [importers, setImporters] = useState<ImporterProfile[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([listApplications('PENDING'), listPendingTrucks()])
      .then(([appRes, truckRes]) => {
        setDrivers(appRes.data.drivers)
        setFleets(appRes.data.fleets)
        setImporters(appRes.data.importers || [])
        setTrucks(truckRes.data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const reviewDriver = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await reviewDriverApplication(id, { status, rejectionReason: status === 'REJECTED' ? 'Documents did not meet requirements' : undefined })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  const reviewFleet = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await reviewFleetApplication(id, { status, rejectionReason: status === 'REJECTED' ? 'Documents did not meet requirements' : undefined })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  const reviewTruck = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await reviewOrgTruck(id, { status })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div>
      <PageHeader title="Applications" description="Review driver, fleet, and independent truck registrations" />
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}

      <h2 className="mt-8 text-lg font-bold text-slate-900">Driver Applications</h2>
      <div className="mt-4">
      <TableWrapper>
        <Table>
          <TableHead><tr><Th>Name</Th><Th>Email</Th><Th>Documents</Th><Th>Actions</Th></tr></TableHead>
          <tbody>
            {loading ? <TableEmpty colSpan={4} message="Loading..." /> : drivers.length === 0 ? (
              <TableEmpty colSpan={4} message="No pending driver applications" />
            ) : drivers.map((d) => (
              <TableRow key={d.id}>
                <Td className="font-semibold">{d.user?.fullName}</Td>
                <Td>{d.user?.email}</Td>
                <Td className="space-x-3">
                  {d.nationalIdFile && <a href={fileUrl(d.nationalIdFile)} target="_blank" rel="noreferrer" className="text-xs text-korecha-primary hover:underline">National ID</a>}
                  {d.driversLicenseFile && <a href={fileUrl(d.driversLicenseFile)} target="_blank" rel="noreferrer" className="text-xs text-korecha-primary hover:underline">License</a>}
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => reviewDriver(d.id, 'APPROVED')}>Approve</Button>
                    <Button size="sm" variant="secondary" onClick={() => reviewDriver(d.id, 'REJECTED')}>Reject</Button>
                  </div>
                </Td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </TableWrapper>
      </div>

      <h2 className="mt-10 text-lg font-bold text-slate-900">Fleet Applications</h2>
      <div className="mt-4">
      <TableWrapper>
        <Table>
          <TableHead><tr><Th>Fleet</Th><Th>Contact</Th><Th>CEO ID</Th><Th>Actions</Th></tr></TableHead>
          <tbody>
            {fleets.length === 0 ? (
              <TableEmpty colSpan={4} message="No pending fleet applications" />
            ) : fleets.map((f) => (
              <TableRow key={f.id}>
                <Td className="font-semibold">{f.fleetName}</Td>
                <Td>{f.user?.fullName} · {f.user?.email}</Td>
                <Td>{f.ceoNationalIdFile && <a href={fileUrl(f.ceoNationalIdFile)} target="_blank" rel="noreferrer" className="text-xs text-korecha-primary hover:underline">View</a>}</Td>
                <Td>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => reviewFleet(f.id, 'APPROVED')}>Approve</Button>
                    <Button size="sm" variant="secondary" onClick={() => reviewFleet(f.id, 'REJECTED')}>Reject</Button>
                  </div>
                </Td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </TableWrapper>
      </div>

      <h2 className="mt-10 text-lg font-bold text-slate-900">Importer Applications</h2>
      <div className="mt-4">
      <TableWrapper>
        <Table>
          <TableHead><tr><Th>Company</Th><Th>Contact</Th><Th>Documents</Th><Th>Actions</Th></tr></TableHead>
          <tbody>
            {importers.length === 0 ? (
              <TableEmpty colSpan={4} message="No pending importer applications" />
            ) : importers.map((imp) => (
              <TableRow key={imp.id}>
                <Td className="font-semibold">{imp.companyName || imp.user?.fullName}</Td>
                <Td>{imp.user?.fullName} · {imp.user?.email}</Td>
                <Td className="space-x-3">
                  {imp.nationalIdFile && <a href={fileUrl(imp.nationalIdFile)} target="_blank" rel="noreferrer" className="text-xs text-korecha-primary hover:underline">National ID</a>}
                  {imp.importLicenseFile && <a href={fileUrl(imp.importLicenseFile)} target="_blank" rel="noreferrer" className="text-xs text-korecha-primary hover:underline">Import license</a>}
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => reviewImporterApplication(imp.id, { status: 'APPROVED' }).then(load)}>Approve</Button>
                    <Button size="sm" variant="secondary" onClick={() => reviewImporterApplication(imp.id, { status: 'REJECTED' }).then(load)}>Reject</Button>
                  </div>
                </Td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </TableWrapper>
      </div>

      <h2 className="mt-10 text-lg font-bold text-slate-900">Independent Driver Trucks</h2>
      <div className="mt-4">
      <TableWrapper>
        <Table>
          <TableHead><tr><Th>Plate</Th><Th>Driver</Th><Th>Type</Th><Th>Status</Th><Th>Actions</Th></tr></TableHead>
          <tbody>
            {trucks.length === 0 ? (
              <TableEmpty colSpan={5} message="No pending trucks" />
            ) : trucks.map((t) => (
              <TableRow key={t.id}>
                <Td className="font-semibold">{t.plateNumber}</Td>
                <Td>{typeof t.driverId === 'object' && t.driverId ? t.driverId.fullName : '—'}</Td>
                <Td>{refName(t.truckTypeId)}</Td>
                <Td><Badge status={t.status} /></Td>
                <Td>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => reviewTruck(t.id, 'APPROVED')}>Approve</Button>
                    <Button size="sm" variant="secondary" onClick={() => reviewTruck(t.id, 'REJECTED')}>Reject</Button>
                  </div>
                </Td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </TableWrapper>
      </div>
    </div>
  )
}
