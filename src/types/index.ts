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
export type FleetProviderType =
  | 'internal_unimodal'
  | 'transit_company'
  | 'association'
  | 'mto'
  | 'licensed_operator'
export type CorporateTier = 'STANDARD' | 'PRIORITY' | 'PREFERRED'
export type ImporterTier = 'NORMAL' | 'PREMIUM'
export type FxFinancingDeclaration = 'BANK_PERMIT' | 'SELF_FINANCED' | 'FRANCO_VALUTA'
export type TradeCustomerSource = 'IMPORTER_EXPORTER' | 'CORPORATE_CUSTOMER'
export type TierVocabulary = 'IMPORTER' | 'CORPORATE'
export type LicenseStatus = ApprovalStatus
export type TruckOwnerType = 'INDIVIDUAL' | 'COMPANY'
export type TradeSide = 'IMPORTER' | 'EXPORTER'
export type ShipmentMode = 'UNIMODAL' | 'MULTIMODAL'
export type MatchingMode = 'BROADCAST' | 'MANUAL_REQUEST'
export type LoadPosterType = 'IMPORTER_EXPORTER' | 'CORPORATE_CUSTOMER'
export type LoadPostingStatus = 'OPEN' | 'MATCHING' | 'ASSIGNED' | 'CANCELLED' | 'EXPIRED'
export type LoadMatchOfferStatus = 'SENT' | 'VIEWED' | 'ASSIGNED' | 'DECLINED' | 'EXPIRED'
export type AvailabilityPosterType = 'FLEET_MANAGER' | 'TRUCK_OWNER'
export type AvailabilityPostingStatus = 'OPEN' | 'CLOSED' | 'EXPIRED'
export type JobStatus =
  | 'OPEN'
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'IN_TRANSIT'
  | 'PENDING_APPROVAL'
  | 'COMPLETED'
  | 'CANCELLED'
export type JobRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'
export type ShipmentStatus =
  | 'ASSIGNED'
  | 'IN_TRANSIT'
  | 'PENDING_APPROVAL'
  | 'COMPLETED'
  | 'CANCELLED'
export type ShipmentLegStatus = 'ASSIGNED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'
export type PaymentStatus = 'HELD' | 'RELEASED' | 'DISPUTED' | 'REVERSED'
export type PaymentProvider = 'TELE_BIRR' | 'CBE_BIRR' | 'NATIONAL_IPS' | 'MANUAL'
export type PaymentReleaseMethod = 'CUSTOMER_CONFIRMED' | 'AUTO_TIMEOUT' | 'ADMIN_OVERRIDE'
export type DisputeReasonCode =
  | 'DELIVERY_NOT_CONFIRMED'
  | 'CARGO_DAMAGE'
  | 'AMOUNT_MISMATCH'
  | 'FRAUD_SUSPECTED'
  | 'OTHER'
export type DisputeStatus = 'OPEN' | 'RESOLVED'
export type DisputeResolution = 'RELEASE' | 'REVERSE'
export type SpecialHandling = 'NONE' | 'TEMPERATURE_CONTROLLED' | 'PERMIT_AND_ESCORT'
export type IntegrationStatus = 'DISCONNECTED' | 'CONNECTED' | 'ERROR'
export type ItemTypeResolvedFrom =
  | 'ORG_TYPE'
  | 'ORG_OVERRIDE'
  | 'MODE_PRICING'
  | 'ITEM_DEFAULT'
  | 'NONE'

export interface LiveLocation {
  lat: number
  lng: number
  accuracy?: number
  updatedAt?: string
}
export type OrgType = 'IMPORTER' | 'EXPORTER' | 'TRUCKING' | 'SHIPPING_LINE' | 'FLEET_MANAGER'
export type CreatableOrgType = Exclude<OrgType, 'TRUCKING'>
export type ModeScope = ShipmentMode
export type OrgStatus = 'ACTIVE' | 'SUSPENDED'
export type ContainerSize = 'TWENTY_FT' | 'FORTY_FT' | 'FORTY_FT_HC'
export type ContainerType = 'DRY' | 'REEFER' | 'OPEN_TOP' | 'FLAT_RACK' | 'TANK'
export type ContainerStatus =
  | 'AVAILABLE'
  | 'IN_TRANSIT'
  | 'EMPTY'
  | 'LOADED'
  | 'DISCHARGED'
  | 'AT_PORT'
  | 'MAINTENANCE'
export type LocationType = 'PORT' | 'DRY_PORT' | 'WAREHOUSE' | 'CITY' | 'BORDER' | 'TRUCK_STOP'
export type LocationStatus = 'DRAFT' | 'PUBLISHED'

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  organizationId: string | null
  phone?: string
  isVerified?: boolean
  memberProfile?:
    | ((DriverProfile | FleetProfile | ImporterProfile) & {
        type?: 'driver' | 'fleet' | 'importer'
      })
    | null
}

export interface TruckType {
  id: string
  organizationId: string | null
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
  organizationId: string | null
  nationalIdFile: string
  driversLicenseFile: string
  preferredRouteIds: string[] | Location[]
  truckTypeId?: string | TruckType
  /** @deprecated Prefer fleetManagerId from Phase 1 DRIVERS table */
  fleetOwnerId?: string | { id: string; fullName: string; email: string }
  fleetManagerId?:
    | string
    | {
        id: string
        fleetName: string
        status: ApprovalStatus
        providerType?: FleetProviderType
      }
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
  organizationId: string | null
  fleetName: string
  ceoNationalIdFile: string
  providerType?: FleetProviderType
  modeScope?: ModeScope
  ownerType?: TruckOwnerType
  parentFleetManagerId?:
    | string
    | { id: string; _id?: string; fleetName: string; providerType?: FleetProviderType }
    | null
  canPostAvailability?: boolean
  availabilityRequestStatus?: ApprovalStatus | null
  availabilityRequestedAt?: string
  availabilityRequestReviewedAt?: string
  availabilityRequestRejectionReason?: string
  shippingLineId?: string | null
  status: ApprovalStatus
  rejectionReason?: string
  staff?: FleetManagerStaff
  user?: User
  driverCount?: number
  truckCount?: number
  reviewedBy?: string
  reviewedAt?: string
  createdAt?: string
}

/** @deprecated Truck owners are FleetManager rows with providerType licensed_operator. */
export type TruckOwnerProfile = FleetProfile & {
  isSelfPaired?: never
  /** @deprecated use fleetName */
  displayName?: string
  /** @deprecated use parentFleetManagerId */
  fleetManagerId?:
    | string
    | { id: string; fleetName: string; providerType?: FleetProviderType }
    | null
}

export interface CorporateCustomerProfile {
  id: string
  userId: string
  organizationId: string | null
  companyName: string
  businessRegistrationFile?: string
  tinNumber?: string
  tier: CorporateTier
  fxFinancingDeclared?: FxFinancingDeclaration | null
  status: ApprovalStatus
  reviewedBy?: string
  reviewedAt?: string
  rejectionReason?: string
  user?: User
  createdAt?: string
}

export interface Truck {
  id: string
  organizationId: string | null
  plateNumber: string
  /** Optional — only articulated trucks (tractor + detachable trailer) have one. */
  trailerPlateNumber?: string | null
  truckTypeId: string | TruckType
  fleetOwnerId?: string | null
  fleetManagerId?: string | { id: string; fleetName: string } | null
  driverId?: string | User | null
  status: TruckStatus
  available: boolean
  rejectionReason?: string
  createdAt?: string
}

export interface ImporterProfile {
  id: string
  userId: string
  organizationId: string | null
  tradeSide?: TradeSide
  tier?: ImporterTier
  companyName?: string
  nationalIdFile: string
  importLicenseFile: string
  fxFinancingDeclared?: FxFinancingDeclaration | null
  status: ApprovalStatus
  rejectionReason?: string
  user?: User
}

export interface ApplicationDocument {
  key: string
  label: string
  url: string
}

export interface TradeCustomerApplication {
  id: string
  source: TradeCustomerSource
  companyName: string
  contact: { fullName: string; email: string; phone: string } | null
  tradeSide: TradeSide | null
  tier: string | null
  tierLabel: string | null
  tierVocabulary: TierVocabulary
  fxFinancingDeclared: FxFinancingDeclaration | null
  documents: ApplicationDocument[]
  tinNumber?: string | null
  status: ApprovalStatus
  rejectionReason?: string | null
  reviewedAt?: string | null
  createdAt?: string
}

/** Queue row: FleetProfile plus review documents. organizationId is widened locally. */
export interface FleetManagerApplication extends Omit<FleetProfile, 'organizationId'> {
  documents: ApplicationDocument[]
  multimodalLicenseNo?: string
  organizationId: string | { id: string; name: string } | null
}

export interface ItemTypeModePricingLeaf {
  pricePerKmEtb?: number | null
  flatFeeEtb?: number | null
}

export interface ItemType {
  id: string
  organizationId: string | null
  name: string
  description?: string
  unit: string
  pricePerKmEtb?: number
  flatFeeEtb?: number
  modePricing?: {
    UNIMODAL?: ItemTypeModePricingLeaf
    MULTIMODAL?: ItemTypeModePricingLeaf
  }
  specialHandling?: SpecialHandling
  requiresQuote?: boolean
  resolvedFrom?: ItemTypeResolvedFrom
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
  currentLeg?: ShipmentLeg | null
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

export interface TrackingEvent {
  id: string
  lat: number
  lng: number
  accuracy?: number
  recordedAt: string
}

export interface ShipmentLeg {
  id: string
  shipmentId: string
  sequenceNo: number
  fromLocationId?: string | Location | null
  toLocationId?: string | Location | null
  truckId?: string | Truck | null
  driverId?: string | User | null
  status: ShipmentLegStatus
  startedAt?: string | null
  completedAt?: string | null
  podPhotoUrl?: string
  tracking?: TrackingEvent[]
}

export interface Shipment {
  id: string
  loadPostingId?: string | null
  jobId?: string | Job
  job?: Job
  mode: ShipmentMode
  status: ShipmentStatus
  fleetManagerId?: string | null
  containerId?: string | null
  container?: {
    id: string
    containerNumber: string
    size: ContainerSize
    type: ContainerType
    status: ContainerStatus
  } | null
  legs: ShipmentLeg[]
  completedAt?: string | null
  createdAt?: string
}

/** KAN-98: summary monitoring stats for one fleet owner, as returned by GET /api/org/fleet-owners[/:id/summary]. */
export interface FleetOwnerSummary {
  id: string
  fleetName: string
  status: ApprovalStatus
  createdAt?: string
  activeTruckCount: number
  activeDriverCount: number
  totalShipments: number
  completedShipments: number
  cancelledShipments: number
  /** Percentage (0-100, one decimal place), or null if the fleet owner has zero shipments. */
  completionRate: number | null
  netEarningsEtb: number
  /** Average of 1-5 driver ratings, one decimal place, or null if no ratings exist yet. */
  averageRating: number | null
  ratingCount: number
}

/**
 * KAN-98: one row from GET /api/org/fleet-owners/:id/shipments. jobId is populated with only the
 * fields the backend selects (pickup/delivery/assignedDriverId/assignedTruckId/pricingQuote/
 * deliveredAt) — treat it as a partial Job, not a full one.
 */
export interface FleetOwnerShipment {
  id: string
  status: ShipmentStatus
  mode: ShipmentMode
  completedAt?: string | null
  createdAt?: string
  jobId?: Pick<
    Job,
    'pickup' | 'delivery' | 'assignedDriverId' | 'assignedTruckId' | 'pricingQuote' | 'deliveredAt'
  > | null
}

export interface Rating {
  id: string
  shipmentId: string
  raterUserId: string
  rateeUserId: string
  score: number
  comment?: string
  createdAt?: string
  updatedAt?: string
}

export interface RatingSummary {
  averageRating: number | null
  ratingCount: number
}

export interface Payment {
  id: string
  shipmentId: string | { id: string; mode: ShipmentMode; customerType: string }
  grossAmountEtb: number
  commissionPctSnapshot: number
  commissionAmountEtb: number
  netAmountEtb: number
  provider: PaymentProvider
  providerReference: string | null
  providerConfirmed?: boolean
  providerTransactionId?: string | null
  geofencePassed?: boolean | null
  travelTimePlausible?: boolean | null
  releaseMethod?: PaymentReleaseMethod | null
  releasedAt?: string | null
  payee?: {
    fleetManagerId: string
    fleetName: string
    organizationName: string | null
  } | null
  openDisputeId?: string | null
  status: PaymentStatus
  createdAt: string
  updatedAt: string
}

export interface PaymentDispute {
  id: string
  paymentId:
    | string
    | {
        id: string
        grossAmountEtb: number
        netAmountEtb: number
        status: PaymentStatus
        shipmentId: string
      }
  reasonCode: DisputeReasonCode
  reason: string
  raisedBy: string | { id: string; fullName: string; email: string }
  status: DisputeStatus
  resolution: DisputeResolution | null
  resolutionNotes?: string
  resolvingAdmin?: string | { id: string; fullName: string; email: string } | null
  resolvedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface LoadPostingOffersSummary {
  total: number
  sent?: number
  viewed?: number
  assigned?: number
  declined?: number
  expired?: number
}

export interface LoadPosting {
  id: string
  posterType: LoadPosterType
  posterId: string
  organizationId: string
  importerUserId: string | User
  itemTypeId: string | ItemType
  quantity: number
  notes?: string
  pickup: JobPoint
  delivery: JobPoint
  pickupGateId?: string | GateEntrance
  deliveryGateId?: string | GateEntrance
  fxFinanced: boolean
  bankPermitNo?: string
  mode: ShipmentMode
  governmentProjectId?: string | null
  pricingQuote?: JobPricingQuote
  matchingMode: MatchingMode
  status: LoadPostingStatus
  linkedJobId?: string | Job | null
  offersSummary?: LoadPostingOffersSummary
  createdAt?: string
}

export interface LoadMatchOffer {
  id: string
  loadPostingId: string | LoadPosting
  fleetManagerId: string
  trucksNeededCount: number
  status: LoadMatchOfferStatus
  assignedTruckId?: string | Truck | null
  assignedDriverId?: string | User | null
  assignedDriverProfileId?: string | null
  respondedAt?: string | null
  createdAt?: string
  /** Nested summary when list/detail APIs populate the posting */
  loadPosting?: LoadPosting
}

export interface AvailabilityPosting {
  id: string
  posterType: AvailabilityPosterType
  posterId: string
  organizationId?: string | null
  truckId?: string | Truck | null
  originLocationId: string | Location
  availableFrom: string
  availableTo: string
  status: AvailabilityPostingStatus
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

export interface OrgFacets {
  mode?: ModeScope | null
  tier?: ImporterTier | null
  licenseStatus?: LicenseStatus | null
  fleetSubType?: FleetProviderType | 'MIXED' | null
}

export interface OrgCounts {
  fleetManagerCount: number
  truckOwnerCount: number
  driverCount: number
  truckCount: number
  pendingTruckCount: number
  shipmentCount: number
  loadPostingCount: number
}

export interface AdminOrgFleetRow extends FleetProfile {
  kind: 'OWN_FLEET' | 'TRUCK_OWNER'
  parentFleetName?: string | null
  driverCount: number
  truckCount: number
  pendingTruckCount: number
}

export interface AdminOrgFleetTree {
  ownFleet: AdminOrgFleetRow[]
  truckOwners: AdminOrgFleetRow[]
}

export interface AdminOrgFleetMembers {
  drivers: DriverProfile[]
  trucks: Truck[]
}

export interface AdminSearchOrgHit {
  id: string
  name: string
  type?: OrgType
  status: OrgStatus
  orgId: string
}

export interface AdminSearchFleetManagerHit {
  id: string
  fleetName: string
  providerType?: FleetProviderType
  status: ApprovalStatus
  isTruckOwner: boolean
  orgId: string | null
  orgName?: string | null
  parentFleetName?: string | null
}

export interface AdminSearchDriverHit {
  id: string
  userId: string
  fullName?: string | null
  phone?: string | null
  status: ApprovalStatus
  fleetManagerId?: string | null
  fleetName?: string | null
  orgId: string | null
  orgName?: string | null
}

export interface AdminSearchResults {
  organizations: AdminSearchOrgHit[]
  fleetManagers: AdminSearchFleetManagerHit[]
  drivers: AdminSearchDriverHit[]
}

export interface Organization extends OrgFacets {
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
  counts?: OrgCounts
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
  registeredCarrier?: { code: string | null; name: string | null; source: string }
  linkedLoadPostingId?: string | null
  linkedLoadPosting?: {
    id: string
    status: string
    mode?: string
    pickupLabel?: string
    deliveryLabel?: string
  } | null
  isDemurrageRisk?: boolean
  linkedShipment?: Shipment | null
}

export interface Location {
  id: string
  name: string
  type: LocationType
  region: string
  status: LocationStatus
  coordinates?: { lat: number; lng: number } | null
  isCustomsBranch?: boolean
  isActive: boolean
}

export interface IntegrationFeed {
  status: IntegrationStatus
  lastSyncAt?: string | null
  endpointUrl?: string
}

export interface PlatformSettings {
  id: string
  defaultCurrency: string
  defaultBasePricePerKm: number
  platformCommissionPercent: number
  minTripPriceEtb: number
  demurrageAlertHours: number
  autoReleaseTimeoutHours?: number
  corridorDistanceKm: { djibouti_to_addis: number }
  externalIntegrations?: {
    eslGpsFeed: IntegrationFeed
    vesselEtaFeed: IntegrationFeed
  }
}

export type CommissionScopeType = 'GLOBAL' | 'MODE' | 'TIER' | 'MODE_TIER'

export interface CommissionSetting {
  id: string
  ratePct: number
  scopeType: CommissionScopeType
  scopeValue: string | null
  effectiveFrom: string
  createdBy: { id: string; fullName: string; email: string }
  createdAt: string
  updatedAt: string
}

export interface EffectiveCommission {
  effectiveRatePct: number
  source: {
    type: 'SETTING' | 'FALLBACK'
    setting: CommissionSetting | null
  }
  context: {
    mode: string | null
    tier: string | null
    importerTier?: string | null
    at: string
  }
}

export interface CommissionMatrixCell {
  mode: ShipmentMode
  tier: ImporterTier
  ratePct: number
  source: {
    type: 'SETTING' | 'FALLBACK'
    setting: CommissionSetting | null
  }
}

export interface CommissionMatrix {
  at: string
  fallbackPct: number
  cells: CommissionMatrixCell[]
}

export type DashboardPeriodKey = '7d' | '30d' | '90d' | 'all'

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
  loads?: {
    active: number
    byStatus: Record<string, number>
  }
  availability?: {
    activePostings: number
  }
  shipments?: {
    inTransit: number
    byMode: Record<string, number>
  }
  matches?: {
    thisWeek: number
  }
  pendingApprovals?: {
    tradeCustomers: number
    fleetManagers: number
    total: number
  }
  payments?: {
    commissionEarnedEtb: number
    escrowHeldEtb: number
    flaggedShipments: number
    openDisputes: number
  }
  ratings?: {
    average: number | null
    count: number
  }
  integrations?: {
    eslGpsFeed: IntegrationFeed
    vesselEtaFeed: IntegrationFeed
  }
  period?: {
    key: DashboardPeriodKey
    from: string | null
    to: string
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
  demurrageAlertHours?: number
}

export interface ApiError {
  error: string
  details?: unknown
}
