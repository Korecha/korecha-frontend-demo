# Korecha — Complete System Overview

Korecha is a digital marketplace replacing broker-mediated inland logistics in Ethiopia's import/export corridor. It connects importers/exporters and corporate customers who need cargo hauled, with fleet managers, truck owners, and drivers — enabling direct matching, end-to-end shipment tracking, proof-of-delivery capture, payment handling, and reputation building.

---

## System Architecture

Two repositories, synchronized by API contract:

### Backend (`korecha-backend-demo`)
- **Stack**: Node.js, Express 5, MongoDB/Mongoose 9.7.0, Zod 3.4.3 validation, JWT auth, multer 2.1.1 for file uploads
- **Module System**: CommonJS (`require`/`module.exports`)
- **Testing**: Node's built-in test runner (`npm test` runs `node --test src/tests/*.test.js`)
- **Current Branch**: `feat/shipment-excution` (note spelling)

### Frontend (`korecha-frontend-demo`)
- **Stack**: React 19, TypeScript (strict), Vite, react-router-dom v7 (`HashRouter`), Tailwind CSS v4
- **Maps**: react-leaflet + Leaflet
- **HTTP**: axios with interceptors for auth tokens
- **Current Branch**: `feat/shipment-excution-ui`

---

## Business Model & Legal Foundation

### Mode Determination

The **mode** (Unimodal vs Multimodal) follows Ethiopian import financing regulations — it is **not** a UI choice:

| Mode | Financing Path | Who Arranges Transport | Fleet Manager Types |
|---|---|---|---|
| **Unimodal** | Self-financed or Franco Valuta (tracked in NBE's FEMoUS system) | Importer's arrangement via Korecha's internal Unimodal dept, a transit company, an association, or (if permitted) the truck owner directly | Any approved fleet manager |
| **Multimodal** | Foreign-currency (FX) financed with bank import permit from an Ethiopian bank | A licensed multimodal transport operator (MTO) for the full end-to-end journey | Only MTOs (`providerType === "mto"`) |

**Mode is derived server-side** from `fxFinanced` (boolean) and `bankPermitNo` (string presence). The UI **never** presents a manual mode dropdown.

### Fleet Manager as a Role, Not a Company Type

"Fleet manager" is a **function** (aggregating trucking capacity), not a fixed organization type. These entities can all act as fleet managers:
- Korecha's internal Unimodal department
- Transit companies (customs brokers arranging Franco Valuta transport)
- Truck owner associations
- Large multi-truck owners
- Licensed multimodal transport operators (MTOs)

**Key Market Context**: ESL held Ethiopia's only multimodal license for 15 years. That monopoly ended in 2025 — five to six additional MTOs (Panafric Global, Tikur Abay Transport, Cosmos MTO, Ethio-Djibouti Railway, Gulf Ingot FZC) are now licensed. The system must onboard any licensed MTO without code changes — only new data rows, never hardcoded company-specific logic.

---

## Actors / User Roles

`User.role` dispatches to role-specific portals. Per-role profile tables hold permissions and approval state.

| Role | Portal Prefix | Purpose |
|---|---|---|
| `ADMIN` | `/admin` | Platform superuser: approves organizations, truck owners, corporate customers; manages item types, containers, locations, settings |
| `ORG_ADMIN` | `/org` | Per-organization admin: approves org members, manages truck types, item types, gate entrances, pricing |
| `IMPORTER` (also `EXPORTER`) | `/importer` | Posts jobs/loads, requests trucks, approves delivery (POD) |
| `CORPORATE_CUSTOMER` | `/corporate` | Posts loads like an importer but as a corporate account (separate registration + application flow) |
| `FLEET_OWNER` (Fleet Manager) | `/fleet` | Receives match offers, assigns trucks/drivers, manages drivers/trucks, tracks shipments, can add multi-leg routes |
| `TRUCK_OWNER` | `/truckOwner` | Owns trucks, posts availability (if `can_post_availability` granted), can self-pair as a driver |
| `DRIVER` | `/driver` | Org member (under fleet manager or truck owner); accepts/starts/completes hauls, shares live GPS location, uploads POD photos |

**Additional Oversight Roles** (read-only, not yet built):
- **Customs Commission** — per-branch monitoring: suspicious trucks, container stats, real-time incoming trucks
- **Government Project Offices** — filter/track shipments tagged to specific projects (fuel, sugar, corridor, etc.)

### Registration & Approval Flow

1. User registers via `/register/*` → lands in `PENDING` approval state
2. Admin (`/admin`) or org admin (`/org`) approves → status moves to `APPROVED`
3. Account becomes active; user can transact

**Approval Statuses**: `PENDING | APPROVED | REJECTED`

---

## Domain Model (Mongoose Schemas)

Core models in `korecha-backend-demo/src/models/`:

### Identity & Organizations
- **User** — auth identity: `email`, `passwordHash`, `role`, `organizationId`, `rating`
- **Organization** — importer/exporter/trucking/shipping-line org; owns pricing config (`basePricePerKm`, container size multipliers, surcharges, round-trip discount)
- **ImporterProfile / ImporterExporter / CorporateCustomer / FleetManager / FleetManagerStaff / FleetProfile / TruckOwner / DriverProfile / Driver / Admin** — per-role profile/approval tables

### Fleet & Assets
- **Truck / TruckType** — fleet vehicles; a truck belongs to a fleet manager's org or a truck owner; can have an assigned `driverId`
- **Container** — physical container inventory (size/type/status); optionally linked to a `Shipment`

### Geography & Pricing
- **Location** — named points (port, dry port, warehouse, city, border, truck stop) with lat/lng; used for pickup/delivery/routes
- **GateEntrance** — port/border gate with a fee; referenced by `Job.pickupGateId` / `deliveryGateId`
- **ItemType** — cargo category driving pricing overrides
- **PlatformSettings** — global platform config (commission rate, etc.)

### Load Requests & Matching
- **Job** — original importer-facing haul request: `organizationId`, `importerId`, `itemTypeId`, `quantity`, `pickup`/`delivery` (label + coordinates), gate IDs, `pricingQuote`, `status`, `assignedDriverId`, `assignedTruckId`
- **LoadPosting** — Phase 2 generalization: can come from importer/exporter OR corporate customer (`posterType`), carries `matchingMode` (`BROADCAST` vs `MANUAL_REQUEST`) and `mode` (`UNIMODAL` vs `MULTIMODAL`). Links to `Job` via `linkedJobId` once assigned.
- **LoadMatchOffer** — broadcast offer sent to one fleet manager for one `LoadPosting`, carrying `trucksNeededCount` (that manager's share) and `status` (`SENT → VIEWED → ASSIGNED/DECLINED/EXPIRED`)
- **AvailabilityPosting** — fleet manager or truck owner advertising a truck's availability at origin/time window; used for proximity-based matching
- **JobRequest** — manual-assignment counterpart: driver-side request/accept flow for a specific `Job`

### Shipment Execution (Phase 3)
- **Shipment** — Phase 3 execution record, **dual-written alongside `Job`** (Job is not replaced). One `Shipment` per `Job` (`jobId` unique) and per `LoadPosting` (`loadPostingId` unique/sparse). Carries `mode`, `customerType`/`customerId`, `fleetManagerId`, optional `containerId`, `status` mirroring the Job.
- **ShipmentLeg** — one leg of a shipment's route: `sequenceNo`, `fromLocationId`/`toLocationId`, `truckId`/`driverId`, nullable `customsBranchId`, `status`, `startedAt`/`completedAt`, `podPhotoUrl`. A shipment auto-gets leg 1 at assignment; fleet manager can add more via `POST /api/fleet/shipments/:id/legs`.
- **TrackingEvent** — GPS ping history per leg: `shipmentLegId`, `driverId`, `lat`, `lng`, `accuracy`, `recordedAt`. Additive to (not replacement of) `Driver.liveLocation` snapshot.

---

## Status State Machines

```
Job / Shipment:      OPEN* → REQUESTED* → ASSIGNED → IN_TRANSIT → PENDING_APPROVAL → COMPLETED
                                                                              ↘ CANCELLED
  (* OPEN/REQUESTED are Job-only, pre-assignment; Shipment starts at ASSIGNED)

ShipmentLeg:          ASSIGNED → IN_TRANSIT → COMPLETED   (or CANCELLED)

LoadPosting:          OPEN → MATCHING → ASSIGNED   (or CANCELLED / EXPIRED)

LoadMatchOffer:       SENT → VIEWED → ASSIGNED   (or DECLINED / EXPIRED)

AvailabilityPosting:  OPEN → CLOSED   (or EXPIRED)

Driver.availability:  OFFLINE ⇄ AVAILABLE ⇄ ON_JOB
```

### Critical Semantics (Phase 3 locked)

- **Leg `ASSIGNED`** — that leg is assigned to driver/truck, not yet started
- **Shipment/Job `PENDING_APPROVAL`** — importer's POD/delivery approval of the **finished shipment**, triggered after the **last** leg completes. NOT approval of a new leg. Extra legs can only be added while `ASSIGNED`/`IN_TRANSIT`; once `PENDING_APPROVAL`, adding a leg is rejected.
- **Handover** — when a driver completes a non-last leg, they and their truck return to the assignable pool (driver → `AVAILABLE`); frontend shows "Your leg is complete" modal and drops the job from Active list. Last-leg driver stays assigned until importer POD approval.
- **POD photo is required, no v1 exception** — a leg cannot complete without `podPhotoUrl`. Legacy Job-only complete endpoint is gated off once shipment/legs exist.
- **GPS tracking** — `useDriverLocation` (frontend hook, ~15s interval via `watchPosition`) is the single ping source. Backend persists each accepted ping as a new `TrackingEvent` row (with ~10s debounce) only while the driver has an `IN_TRANSIT` leg. `Driver.liveLocation` snapshot is updated on every ping regardless.

---

## Core Workflows

### 1. Onboarding
Role registers (`/register/*`) → lands in `PENDING` → approved by admin/org-admin → status moves to `APPROVED` → user can transact.

### 2. Posting a Load
Importer/exporter or corporate customer creates a `LoadPosting` (or legacy `Job`) with pickup/delivery, item type, quantity. Pricing is quoted server-side from org's pricing config.

### 3. Matching (Two Paths)
Both paths funnel into the same shipment-creation logic:

**Broadcast Mode**:
- Eligible fleet managers (filtered by provider type for multimodal loads) receive a `LoadMatchOffer` sized by their nearby truck pool
- Fleet manager views/declines/assigns a truck+driver

**Manual Request Mode**:
- Importer browses nearby live trucks, sends `JobRequest` directly to a driver
- Driver accepts/declines

### 4. Assignment → Shipment
Whichever path wins, `createShipmentForAssignment` (shared, idempotent service) creates exactly one `Shipment` plus its first `ShipmentLeg`, syncs Job/LoadPosting status to `ASSIGNED`.

### 5. Execution
Driver starts the current leg (`IN_TRANSIT`), shares live GPS location, completes it with a required POD photo. Fleet manager may insert extra legs mid-route (multi-leg/relay hauls) while shipment is `ASSIGNED`/`IN_TRANSIT`.

### 6. Completion
After the last leg completes, shipment/job moves to `PENDING_APPROVAL`. Importer reviews POD and approves → status moves to `COMPLETED`.

### 7. Not Yet Built
- **Phase 4**: Payments/escrow (provider scaffolding, commission, ratings model)
- **Phase 5**: Truck-owner self-service UX (availability toggle, portal, `can_post_availability` grants)
- **Phase 6**: Customs/government oversight dashboards, external integrations (ESL GPS feed, ocean carrier vessel-ETA, Fayda national digital ID)

---

## API Surface (Backend Routes)

All routes under `/api/<role-prefix>/...`, guarded by `requireAuth` + role/organization/approval middleware.

- **`/api/auth`** — login, register/*
- **`/api/admin`** — organizations, applications (driver/fleet/truck-owner/corporate), truck owners, item types, containers (+ bulk upload), locations, settings
- **`/api/org`** — org dashboard, member applications, users, truck types, item types, gate entrances, pricing
- **`/api/importer`** — profile, locations, item types, gate entrances, jobs (create/list/get/approve/request-truck/nearby-trucks/preview-pricing), load postings, leg tracking history, availability-postings/nearby
- **`/api/corporate`** — parallel load-posting endpoints for corporate customers
- **`/api/fleet`** — profile, locations, truck-types, drivers (create/list), trucks (list/review), match-offers (list/view/decline/assign), availability-postings, shipments (list/get/add-leg/leg-tracking)
- **`/api/driver`** — profile, locations, routes, live location ping (`PUT /location`), trucks, job requests (list/respond), active/history jobs, job start/complete (legacy, gated), leg start/complete, POD upload (`POST /legs/:id/pod`)
- **`/api/truckOwner`** — profile, trucks, availability postings

---

## Frontend Structure

### Routing (`HashRouter`)

One top-level protected `<Route>` per role, each wrapped in a role-specific layout providing nav chrome and (for drivers) shared live-location context.

```
/login, /register/*        → Auth pages
/admin/*                   → AdminLayout → admin pages
/org/*                     → OrgLayout → org admin pages
/importer/*                → ImporterLayout → importer pages
/corporate/*               → CorporateLayout → corporate pages
/fleet/*                   → FleetLayout → fleet manager pages
/driver/*                  → DriverLayout → driver pages
/truckOwner/*              → TruckOwnerLayout → truck owner pages
```

### File Organization

```
src/
├── pages/{role}/{feature}.tsx        # Role-specific pages
├── layouts/{Role}Layout.tsx          # Per-role layout with nav
├── components/
│   ├── ui/                           # Shared UI (Button, Card, Table)
│   ├── driver/                       # Driver-specific widgets (JobCard)
│   ├── jobs/                         # Domain widgets (StatusTimeline)
│   ├── maps/                         # Map components (DriverMap)
│   └── importer/                     # Importer widgets (PodPhotos)
├── api/{role}Api.ts                  # Per-role axios clients
├── types/{domain}.ts                 # TypeScript types matching backend
├── hooks/use{Feature}.ts             # Custom hooks (useAuth, useDriverLocation)
└── utils/{purpose}.ts                # Utilities (format, validation)
```

### Key Shared Components

- **`DriverMap`** — Leaflet map showing driver position, route locations, `TrackingEvent` polyline
- **`PodPhotos`** — renders leg-level delivery photos on importer/corporate/fleet detail pages
- **`JobStatusTimeline` / `DriverJobProgress`** — leg-by-leg progress UI mirroring Job/Shipment/Leg state machines

---

## Pricing Model

Pricing is computed **server-side** from `Organization.pricing` (or item-type override):

```
Price = basePricePerKm × distance × containerSizeMultiplier
        + weekendSurcharge + reeferSurcharge + hazardousSurcharge
        - roundTripDiscount
        (with minimumTripPrice floor)
```

Currency: ETB throughout. Pricing logic **never** branches on provider type or mode — it's purely distance-based with surcharges.

---

## Critical Implementation Notes

### Dual-Write Pattern (Job + Shipment)

- `Job` is **not** replaced by `Shipment` — both exist in parallel
- One `Shipment` per `Job` (via unique `jobId`)
- Status must be kept in sync between Job and Shipment
- Use `createShipmentForAssignment` service function (idempotent, shared by both matching paths)

### Multi-Leg Constraints

- Extra legs can only be added while shipment is `ASSIGNED` or `IN_TRANSIT`
- Once `PENDING_APPROVAL`, no more legs can be added
- Each leg must have a POD photo to complete
- Non-last leg completion returns driver/truck to pool; last leg keeps them assigned until importer approval

### GPS Tracking

- Frontend `useDriverLocation` hook pings every ~15s via `watchPosition`
- Backend creates `TrackingEvent` only for drivers with `IN_TRANSIT` legs
- `Driver.liveLocation` is always updated (even when no active leg)
- ~10s debounce on TrackingEvent creation to avoid excessive DB writes

### Matching Modes

- **BROADCAST** — system sends `LoadMatchOffer` to eligible fleet managers (multimodal loads only to MTOs)
- **MANUAL_REQUEST** — importer/customer browses live trucks, sends direct `JobRequest`
- Both paths converge at `createShipmentForAssignment`

### Multi-Modal vs Uni-Modal

- `mode` derived from `fxFinanced` + `bankPermitNo` (server-side, never a UI dropdown)
- `MULTIMODAL` loads only match fleet managers with `providerType === "mto"`
- `UNIMODAL` loads match all approved fleet managers
- Pricing logic **never** branches on provider type (pricing is mode-agnostic)

---

## Branching & Jira Conventions

### Git Branches

- **Backend Phase 3**: `feat/shipment-excution` (note spelling)
- **Frontend Phase 3**: `feat/shipment-excution-ui`
- Phase 2 (`feat/matching-engine[-ui]`) merged to `main` on both repos

### Jira Structure

- **Project**: KAN on `korecha12.atlassian.net`
- **Epic per Phase**: Phase 1 (KAN-10), Phase 2 (KAN-11), Phase 3 (KAN-6)
- **Backend/Frontend Split**: Parent task splits into separate subtasks
  - Example: KAN-35 parent → KAN-68 backend + KAN-64 frontend

### Commit Messages

Format: `[KAN-XX] Brief description`

---

## Roadmap

| Phase | Epic | Scope | Status |
|---|---|---|---|
| 1 | KAN-10 | Identity & onboarding | ✅ Done, merged |
| 2 | KAN-11 | Matching engine (load postings, broadcast/manual assignment, availability postings) | ✅ Done, merged to `main` |
| 3 | KAN-6 | Shipment execution: multi-leg routing, GPS tracking history, POD photos, optional container linkage | 🚧 In progress — dual-write, multi-leg, POD, GPS tracking done; container linkage (KAN-58/KAN-61) next |
| 4 | KAN-8 | Payments & ratings (provider scaffolding, commissions, escrow, ratings model) | ⏳ Not started |
| 5 | KAN-7 | Fleet manager & truck owner UX (availability toggle, truck-owner portal, `can_post_availability` grants) | ⏳ Not started |
| 6 | KAN-9 | Customs/government oversight & external integrations | ⏳ Not started |

---

## Open Business Decisions (Don't Build Around These)

- Exact commission rate, and whether it varies by mode or customer tier
- Whether ESL gets an exclusivity window before other MTOs onboard
- MTO partnership structure (software license, revenue share, or per-transaction fee)
- Whether Tele Birr / CBE Birr integration also serves as KYC source
- Dispute resolution ownership when POD is contested
- Whether Fayda (Ethiopia's national digital ID) will be used for driver/truck owner verification

---

## Team Reference

This is a **founding/development team** project. The backend and frontend are developed in parallel by a small team coordinating via Jira and shared understanding of:
- Business model (mode determination, fleet manager role flexibility)
- Legal constraints (Unimodal vs Multimodal financing paths)
- Market context (ESL monopoly ended 2025, multi-MTO readiness required)
- Data model and API contracts
- Phase-based delivery (identity → matching → execution → payments → oversight)

**Key Principle**: The system must be **data-driven and extensible** — no hardcoded company-specific logic, especially for MTOs. ESL, Panafric Global, Cosmos MTO, and future operators are all just rows in the `FleetManager` table with `providerType: "mto"`.
