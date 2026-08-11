export type UserRole =
  | 'ADMIN'
  | 'ORG_ADMIN'
  | 'IMPORTER'
  | 'EXPORTER'
  | 'DRIVER'
  | 'FLEET_OWNER'
  | 'TRUCK_OWNER'
  | 'CORPORATE_CUSTOMER'
  | 'SHIPPING_LINE'

export type OrgMemberRole = 'DRIVER' | 'FLEET_OWNER' | 'IMPORTER'
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type TruckStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type DriverAvailability = 'AVAILABLE' | 'ON_JOB' | 'OFFLINE'
export type FleetProviderType = 'internal_unimodal' | 'transit_company' | 'association' | 'mto'
export type CorporateTier = 'STANDARD' | 'PRIORITY' | 'PREFERRED'
export type TruckOwnerType = 'INDIVIDUAL' | 'COMPANY'
export type TradeSide = 'IMPORTER' | 'EXPORTER'
export type ShipmentMode = 'UNIMODAL' | 'MULTIMODAL'
export type JobStatus =
  | 'OPEN'
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'IN_TRANSIT'
  | 'PENDING_APPROVAL'
  | 'COMPLETED'
  | 'CANCELLED'
export type JobRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'

export interface LiveLocation {
  lat: number
  lng: number
  accuracy?: number
  updatedAt?: string
}
export type OrgType = 'IMPORTER' | 'EXPORTER' | 'TRUCKING' | 'SHIPPING_LINE'
export type OrgStatus = 'ACTIVE' | 'SUSPENDED'
export type ContainerSize = 'TWENTY_FT' | 'FORTY_FT' | 'FORTY_FT_HC'
export type ContainerType = 'DRY' | 'REEFER' | 'OPEN_TOP' | 'FLAT_RACK'
export type ContainerStatus =
  | 'AVAILABLE'
  | 'IN_TRANSIT'
  | 'EMPTY'
  | 'LOADED'
  | 'DISCHARGED'
  | 'AT_PORT'
  | 'MAINTENANCE'
export type LocationType = 'PORT' | 'DRY_PORT' | 'WAREHOUSE' | 'CITY' | 'BORDER' | 'TRUCK_STOP'

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  organizationId: string | null
  phone?: string
  isVerified?: boolean
  memberProfile?: (DriverProfile | FleetProfile | ImporterProfile) & { type?: 'driver' | 'fleet' | 'importer' } | null
}

export interface TruckType {
  id: string
  organizationId: string
  name: string
  description?: string
  isActive: boolean
}

export interface FleetManagerStaff {
  id: string
  userId: string
  fleetManagerId: string
  canAssignJobs: boolean
  canViewEarnings: boolean
  canManageAffiliations: boolean
  canToggleTruckAvailability: boolean
}

export interface DriverProfile {
  id: string
  userId: string
  organizationId: string
  nationalIdFile: string
  driversLicenseFile: string
  preferredRouteIds: string[] | Location[]
  truckTypeId?: string | TruckType
  /** @deprecated Prefer fleetManagerId from Phase 1 DRIVERS table */
  fleetOwnerId?: string | { id: string; fullName: string; email: string }
  fleetManagerId?: string | { id: string; fleetName: string; status: ApprovalStatus; providerType?: FleetProviderType }
  truckOwnerId?: string | { id: string; displayName?: string; status: ApprovalStatus }
  status: ApprovalStatus
  rejectionReason?: string
  availability?: DriverAvailability
  isLocationLive?: boolean
  liveLocation?: LiveLocation | null
  user?: User
}

export interface FleetProfile {
  id: string
  userId: string
  organizationId: string
  fleetName: string
  ceoNationalIdFile: string
  providerType?: FleetProviderType
  shippingLineId?: string | null
  status: ApprovalStatus
  rejectionReason?: string
  staff?: FleetManagerStaff
  user?: User
  driverCount?: number
  truckCount?: number
}

export interface TruckOwnerProfile {
  id: string
  userId: string
  organizationId: string | null
  fleetManagerId?: string | { id: string; fleetName: string; providerType?: FleetProviderType } | null
  ownerType: TruckOwnerType
  displayName?: string
  canPostAvailability: boolean
  status: ApprovalStatus
  reviewedBy?: string
  reviewedAt?: string
  rejectionReason?: string
  user?: User
  createdAt?: string
}

export interface CorporateCustomerProfile {
  id: string
  userId: string
  organizationId: string | null
  companyName: string
  businessRegistrationFile?: string
  tinNumber?: string
  tier: CorporateTier
  status: ApprovalStatus
  reviewedBy?: string
  reviewedAt?: string
  rejectionReason?: string
  user?: User
  createdAt?: string
}

export interface Truck {
  id: string
  organizationId: string
  plateNumber: string
  truckTypeId: string | TruckType
  fleetOwnerId?: string | null
  driverId?: string | User | null
  status: TruckStatus
  rejectionReason?: string
  createdAt?: string
}

export interface ImporterProfile {
  id: string
  userId: string
  organizationId: string | null
  tradeSide?: TradeSide
  companyName?: string
  nationalIdFile: string
  importLicenseFile: string
  status: ApprovalStatus
  rejectionReason?: string
  user?: User
}

export interface ItemType {
  id: string
  organizationId: string | null
  name: string
  description?: string
  unit: string
  pricePerKmEtb?: number
  flatFeeEtb?: number
  isActive: boolean
  isPlatformDefault?: boolean
}

export interface GateEntrance {
  id: string
  organizationId: string
  name: string
  locationId?: string | Location | null
  feeEtb: number
  isActive: boolean
}

export interface JobPoint {
  locationId?: string
  label: string
  coordinates: { lat: number; lng: number }
}

export interface Job {
  id: string
  organizationId: string
  importerId: string | User
  itemTypeId: string | ItemType
  quantity: number
  notes?: string
  pickup: JobPoint
  delivery: JobPoint
  pickupGateId?: string | GateEntrance
  deliveryGateId?: string | GateEntrance
  status: JobStatus
  assignedDriverId?: string | User | null
  assignedTruckId?: string | Truck | null
  deliveredAt?: string
  completedAt?: string
  pricingQuote?: JobPricingQuote
  createdAt?: string
}

export interface JobRequest {
  id: string
  jobId: string | Job
  driverId: string | User
  truckId: string | Truck
  importerId?: string | User
  status: JobRequestStatus
  createdAt?: string
}

export interface NearbyTruck {
  distanceKm: number
  driver: User
  truck: Truck
  organization?: { id: string; name: string; type?: string } | null
  liveLocation: LiveLocation
}

export interface MemberProfileResponse {
  type: 'driver' | 'fleet' | 'importer' | 'truckOwner' | 'corporate'
  profile:
    | DriverProfile
    | FleetProfile
    | ImporterProfile
    | TruckOwnerProfile
    | CorporateCustomerProfile
}

export interface Pricing {
  currency: string
  basePricePerKm: number
  containerSizeMultipliers: Record<ContainerSize, number>
  surcharges: {
    reeferPremiumEtb: number
    hazardousPremiumEtb: number
    weekendPremiumPercent: number
    detentionPerHourEtb: number
  }
  roundTripDiscountPercent: number
  minTripPriceEtb: number
  itemTypeOverrides?: Array<{
    itemTypeId: string
    pricePerKmEtb: number
    flatFeeEtb: number
  }>
  updatedAt?: string
}

export interface Organization {
  id: string
  name: string
  type?: OrgType
  status: OrgStatus
  contactEmail?: string
  phone?: string
  address?: string
  tinNumber?: string
  pricing?: Pricing
  containerCount?: number
  orgAdmin?: User | null
  createdAt?: string
}

export interface Container {
  id: string
  containerNumber: string
  size: ContainerSize
  type: ContainerType
  status: ContainerStatus
  organizationId?: string
  organization?: { id: string; name: string; type: OrgType }
  location?: {
    label?: string
    locationId?: string
    coordinates?: { lat: number; lng: number }
  }
  shippingLineCode?: string
  sealNumber?: string
  lastFreeDay?: string
  emptyReadyAt?: string
  notes?: string
}

export interface Location {
  id: string
  name: string
  type: LocationType
  region: string
  coordinates: { lat: number; lng: number }
  isActive: boolean
}

export interface PlatformSettings {
  id: string
  defaultCurrency: string
  defaultBasePricePerKm: number
  platformCommissionPercent: number
  minTripPriceEtb: number
  demurrageAlertHours: number
  corridorDistanceKm: { djibouti_to_addis: number }
}

export interface DashboardStats {
  organizations: {
    total: number
    byType: Record<string, number>
    byStatus: Record<string, number>
  }
  containers: {
    total: number
    byStatus: Record<string, number>
    demurrageRisk: number
  }
  pricing: {
    avgBasePricePerKm: number
    currency: string
    corridorDistanceKm: number
  }
}

export interface QuotePreview {
  currency: string
  distanceKm: number
  breakdown: {
    base: number
    reeferPremium: number
    weekendPremium: number
    detentionCost: number
    roundTripDiscount: number
    minTripPriceEtb: number
  }
  totalEtb: number
}

export interface JobPricingQuote {
  currency: string
  distanceKm: number
  quantity: number
  basePricePerKm?: number
  effectivePricePerKm?: number
  breakdown: {
    base: number
    weekendPremium?: number
    perUnitTotal?: number
    minTripPriceEtb?: number
    quantity?: number
    reeferPremium?: number
    detentionCost?: number
    roundTripDiscount?: number
    itemTypeKmPremiumEtb?: number
    itemFlatFeeEtb?: number
    gateFeesEtb?: number
  }
  totalEtb: number
  isWeekend?: boolean
  calculatedAt?: string
}

export interface PaginatedMeta {
  total: number
  page: number
  limit: number
}

export interface ApiError {
  error: string
  details?: unknown
}
