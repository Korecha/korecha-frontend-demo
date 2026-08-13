import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { AdminLayout } from '../components/layout/AdminLayout'
import { DriverLayout } from '../components/layout/DriverLayout'
import { FleetLayout } from '../components/layout/FleetLayout'
import { OrgLayout } from '../components/layout/OrgLayout'
import { LoginPage } from '../pages/LoginPage'
import { ContainerBulkUploadPage } from '../pages/admin/ContainerBulkUploadPage'
import { ContainersPage } from '../pages/admin/ContainersPage'
import { DashboardPage } from '../pages/admin/DashboardPage'
import { LocationsPage } from '../pages/admin/LocationsPage'
import { OrganizationDetailPage } from '../pages/admin/OrganizationDetailPage'
import { OrganizationsPage } from '../pages/admin/OrganizationsPage'
import { SettingsPage } from '../pages/admin/SettingsPage'
import { AdminApplicationsPage } from '../pages/admin/ApplicationsPage'
import { CorporateApplicationsPage } from '../pages/admin/CorporateApplicationsPage'
import { TruckOwnersPage } from '../pages/admin/TruckOwnersPage'
import { AdminItemTypesPage } from '../pages/admin/ItemTypesPage'
import { DriverHomePage } from '../pages/driver/DriverHomePage'
import { DriverProfilePage } from '../pages/driver/DriverProfilePage'
import { DriverRoutesPage } from '../pages/driver/DriverRoutesPage'
import { DriverTrucksPage } from '../pages/driver/DriverTrucksPage'
import { FleetDashboardPage } from '../pages/fleet/FleetDashboardPage'
import { FleetDriversPage } from '../pages/fleet/FleetDriversPage'
import { FleetMatchOffersPage } from '../pages/fleet/FleetMatchOffersPage'
import { FleetAvailabilityPage } from '../pages/fleet/FleetAvailabilityPage'
import { FleetTrucksPage } from '../pages/fleet/FleetTrucksPage'
import { OrgApplicationsPage } from '../pages/org/OrgApplicationsPage'
import { OrgDashboardPage } from '../pages/org/OrgDashboardPage'
import { OrgPricingPage } from '../pages/org/OrgPricingPage'
import { OrgTruckTypesPage } from '../pages/org/OrgTruckTypesPage'
import { OrgUsersPage } from '../pages/org/OrgUsersPage'
import { RegisterDriverPage } from '../pages/register/RegisterDriverPage'
import { RegisterFleetPage } from '../pages/register/RegisterFleetPage'
import { RegisterImporterPage } from '../pages/register/RegisterImporterPage'
import { RegisterTruckOwnerPage } from '../pages/register/RegisterTruckOwnerPage'
import { RegisterCorporateCustomerPage } from '../pages/register/RegisterCorporateCustomerPage'
import { TruckOwnerHomePage } from '../pages/truckOwner/TruckOwnerHomePage'
import { TruckOwnerAvailabilityPage } from '../pages/truckOwner/TruckOwnerAvailabilityPage'
import { TruckOwnerLayout } from '../components/layout/TruckOwnerLayout'
import { CorporateHomePage } from '../pages/corporate/CorporateHomePage'
import { CorporatePostLoadPage } from '../pages/corporate/CorporatePostLoadPage'
import { CorporateLoadPostingsPage } from '../pages/corporate/CorporateLoadPostingsPage'
import { CorporateLoadPostingDetailPage } from '../pages/corporate/CorporateLoadPostingDetailPage'
import { CorporateLayout } from '../components/layout/CorporateLayout'
import { ImporterLayout } from '../components/layout/ImporterLayout'
import { ImporterHomePage } from '../pages/importer/ImporterHomePage'
import { ImporterJobsPage } from '../pages/importer/ImporterJobsPage'
import { ImporterNewJobPage } from '../pages/importer/ImporterNewJobPage'
import { ImporterJobDetailPage } from '../pages/importer/ImporterJobDetailPage'
import { ImporterLoadPostingDetailPage } from '../pages/importer/ImporterLoadPostingDetailPage'
import { ImporterProfilePage } from '../pages/importer/ImporterProfilePage'
import { DriverJobsPage } from '../pages/driver/DriverJobsPage'
import { DriverJobDetailPage } from '../pages/driver/DriverJobDetailPage'
import { OrgItemTypesPage } from '../pages/org/OrgItemTypesPage'
import { OrgGateEntrancesPage } from '../pages/org/OrgGateEntrancesPage'

function HomeRedirect() {
  return <Navigate to="/login" replace />
}

export function AppRoutes() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/driver" element={<RegisterDriverPage />} />
          <Route path="/register/fleet" element={<RegisterFleetPage />} />
          <Route path="/register/importer" element={<RegisterImporterPage />} />
          <Route path="/register/truck-owner" element={<RegisterTruckOwnerPage />} />
          <Route path="/register/corporate" element={<RegisterCorporateCustomerPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="organizations" element={<OrganizationsPage />} />
            <Route path="organizations/:id" element={<OrganizationDetailPage />} />
            <Route path="applications" element={<AdminApplicationsPage />} />
            <Route path="applications/corporate" element={<CorporateApplicationsPage />} />
            <Route path="truck-owners" element={<TruckOwnersPage />} />
            <Route path="item-types" element={<AdminItemTypesPage />} />
            <Route path="containers" element={<ContainersPage />} />
            <Route path="containers/upload" element={<ContainerBulkUploadPage />} />
            <Route path="locations" element={<LocationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route
            path="/org"
            element={
              <ProtectedRoute roles={['ORG_ADMIN']}>
                <OrgLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OrgDashboardPage />} />
            <Route path="applications" element={<OrgApplicationsPage />} />
            <Route path="users" element={<OrgUsersPage />} />
            <Route path="truck-types" element={<OrgTruckTypesPage />} />
            <Route path="item-types" element={<OrgItemTypesPage />} />
            <Route path="gate-entrances" element={<OrgGateEntrancesPage />} />
            <Route path="pricing" element={<OrgPricingPage />} />
          </Route>
          <Route
            path="/driver"
            element={
              <ProtectedRoute roles={['DRIVER']}>
                <DriverLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DriverHomePage />} />
            <Route path="routes" element={<DriverRoutesPage />} />
            <Route path="trucks" element={<DriverTrucksPage />} />
            <Route path="profile" element={<DriverProfilePage />} />
            <Route path="jobs" element={<DriverJobsPage />} />
            <Route path="jobs/:id" element={<DriverJobDetailPage />} />
          </Route>
          <Route
            path="/importer"
            element={
              <ProtectedRoute roles={['IMPORTER']}>
                <ImporterLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ImporterHomePage />} />
            <Route path="jobs" element={<ImporterJobsPage />} />
            <Route path="jobs/new" element={<ImporterNewJobPage />} />
            <Route path="jobs/:id" element={<ImporterJobDetailPage />} />
            <Route path="load-postings/:id" element={<ImporterLoadPostingDetailPage />} />
            <Route path="profile" element={<ImporterProfilePage />} />
          </Route>
          <Route
            path="/fleet"
            element={
              <ProtectedRoute roles={['FLEET_OWNER']}>
                <FleetLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<FleetDashboardPage />} />
            <Route path="match-offers" element={<FleetMatchOffersPage />} />
            <Route path="availability" element={<FleetAvailabilityPage />} />
            <Route path="drivers" element={<FleetDriversPage />} />
            <Route path="trucks" element={<FleetTrucksPage />} />
          </Route>
          <Route
            path="/truck-owner"
            element={
              <ProtectedRoute roles={['TRUCK_OWNER']}>
                <TruckOwnerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TruckOwnerHomePage />} />
            <Route path="availability" element={<TruckOwnerAvailabilityPage />} />
          </Route>
          <Route
            path="/corporate"
            element={
              <ProtectedRoute roles={['CORPORATE_CUSTOMER']}>
                <CorporateLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CorporateHomePage />} />
            <Route path="loads" element={<CorporateLoadPostingsPage />} />
            <Route path="loads/new" element={<CorporatePostLoadPage />} />
            <Route path="loads/:id" element={<CorporateLoadPostingDetailPage />} />
          </Route>
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}
