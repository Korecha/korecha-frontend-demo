# Korecha Frontend — Current Work State

> **⚠️ CRITICAL: UPDATE THIS FILE AFTER EVERY CHANGE**
> 
> This file is the **single source of truth** for current work state. The korecha-frontend-engineer agent mode reads this file at the start of every session to understand:
> - What work is completed, in progress, and upcoming
> - Current technical decisions and known issues
> - Recent changes and their context
> 
> **After completing ANY work**, you MUST:
> 1. Move completed items from "In Progress" to "Recently Completed"
> 2. Update the "Last Updated" date
> 3. Add any new technical decisions or patterns discovered
> 4. Log any new known issues found
> 5. Update priorities in "Next Up" if they changed
>
> **This file is tracked in Git** — commit it with your feature changes so the team stays aligned.

**Last Updated**: 2026-08-20  
**Current Branch**: `feat/shipment-excution-ui` (note spelling)  
**Jira Board**: [KAN](https://korecha12.atlassian.net)

---

## 🤖 Agent Instructions: End-of-Task Checklist

**When you complete ANY task**, before ending your turn, you MUST update this file:

1. **Move completed work**: 
   - Remove from "In Progress" section
   - Add to "Recently Completed" section (keep list to ~10 items, remove oldest)

2. **Update metadata**:
   - Change "Last Updated" date to today's date
   - Update current branch if it changed

3. **Document decisions**:
   - Add any new patterns discovered to "Technical Decisions & Patterns"
   - Add new conventions to "Conventions & Standards"

4. **Log issues**:
   - Add any bugs/issues discovered to "Known Issues / Tech Debt"
   - Categorize by priority (High/Medium/Low)

5. **Update priorities**:
   - Adjust "Next Up" list if priorities changed
   - Remove completed items from TODOs

6. **Commit this file**:
   - Stage: `git add .github/korecha-state.md`
   - Commit with your feature changes
   - This ensures the next agent session has current context

**Example commit message**: `[KAN-XX] Feature name + update korecha-state.md`

---

## Current Sprint / In Progress

### Phase 3: Shipment Execution UI (Epic: KAN-6)

**Completed Frontend Features**:
- ✅ Multi-leg shipment display (leg-by-leg progress cards)
- ✅ GPS tracking visualization (`DriverMap` with `TrackingEvent` polyline)
- ✅ POD photo upload flow (driver → camera/file upload → required validation)
- ✅ Driver handover modal ("Your leg is complete" when completing non-last leg)
- ✅ Shipment status timeline component (`JobStatusTimeline`)
- ✅ Live location tracking hook (`useDriverLocation` with ~15s interval)
- ✅ Container detail page (KAN-61) — admin view with linked shipment, legs, and POD photos
- ✅ Fleet manager container link/unlink (KAN-61) — PATCH /api/fleet-manager/shipments/:id/container
- ✅ Fleet container control by container number (KAN-85) — input/display containerNumber instead of ObjectId

**In Progress**:
- 🚧 Fleet manager "Add Leg" form validation (prevent adding legs when `PENDING_APPROVAL`)

**Next Up** (Priority Order):
1. Container selection dropdown on load posting form (optional field)
2. Container status display badge on shipment cards
3. Add leg button state management (disabled after `PENDING_APPROVAL`)
4. POD photo gallery component for importer approval screen

---

## Recently Completed (Last ~10 Items)

1. ✅ Fleet container control by container number (KAN-85) — input/display containerNumber, shows size/type/status
2. ✅ Container detail page with linked shipment display (KAN-61)
3. ✅ Fleet manager container link/unlink controls (KAN-61)
4. ✅ `DriverMap` component — Leaflet integration with marker + polyline
5. ✅ `useDriverLocation` hook — geolocation API with permission handling
6. ✅ POD upload API integration (`POST /api/driver/legs/:id/pod` with FormData)
7. ✅ Driver active jobs filtering (only shows jobs with `IN_TRANSIT` leg)
8. ✅ Fleet manager shipment list with leg count badges
9. ✅ Leg status badges (color-coded: gray/blue/green for ASSIGNED/IN_TRANSIT/COMPLETED)
10. ✅ "Start Leg" and "Complete Leg" button states (disabled when inappropriate status)

---

## Technical Decisions & Patterns

### Architecture

- **HashRouter** (not BrowserRouter) — required for deployment without server-side rewrites
- **Strict TypeScript** — all components use typed props, no `any` allowed
- **API clients per role** — `src/api/driverApi.ts`, `importerApi.ts`, etc. with typed axios wrappers
- **Layout hierarchy** — `{Role}Layout` wraps `<Outlet />` for role-specific nav + context providers
- **Formatting-only commits** — when editing files with divergent formatting, do a separate `npx prettier --write` commit FIRST, then the content commit, to keep diffs reviewable

### Code Organization

- **Pages** in `src/pages/{role}/{feature}.tsx` — one file per route
- **Components** organized by scope:
  - `src/components/ui/` — pure UI (Button, Card, Table, Modal)
  - `src/components/{role}/` — role-specific widgets (DriverJobCard)
  - `src/components/{domain}/` — domain-specific (StatusTimeline, DriverMap, PodPhotos)
- **Types** mirror backend models exactly — copy from backend's Mongoose schemas, convert to TypeScript interfaces
- **Hooks** prefix with `use` — `useAuth`, `useDriverLocation`, `useShipmentTracking`

### Map Integration (Leaflet)

- **Component**: `react-leaflet` with OpenStreetMap tiles
- **Markers**: Driver position (blue icon), pickup/delivery (red/green icons)
- **Polyline**: `TrackingEvent` history in blue, route plan in dashed gray
- **Viewport**: Auto-fit bounds to include all markers + polyline when data changes

### POD Photo Handling

- **Upload**: Uses `<input type="file" accept="image/*" capture="environment">` for mobile camera
- **Validation**: Check file size (<5MB) and type (image/*) before upload
- **Display**: `PodPhotos` component shows thumbnails with click-to-expand modal
- **Required**: No "Skip POD" option — complete leg button disabled until photo uploaded

### Live GPS Tracking

- **Hook**: `useDriverLocation` requests permission, starts `watchPosition`, sends ping every ~15s
- **Backend filter**: Only sends pings when driver has an active `IN_TRANSIT` leg
- **Error handling**: Show friendly message for permission denied, no GPS signal, etc.
- **Battery**: Uses `enableHighAccuracy: true` only when leg is active; stops when leg completes

### Container Linkage

- **API pattern**: Backend adds sibling fields (`container` alongside `containerId`) instead of populating in place, avoiding "Objects are not valid as a React child" crashes when existing code renders the raw id
- **Input**: Fleet managers enter containerNumber (case-insensitive, server uppercases/trims)
- **Display**: Show `shipment.container?.containerNumber` with size/type/status badges, not the raw ObjectId
- **Validation**: Backend returns 404 for unknown container numbers with the number echoed in the error message

---

## Known Issues / Tech Debt

### High Priority

- [ ] **Map bounds** — sometimes fails to auto-fit when polyline is empty (race condition on first render)
- [ ] **POD upload retry** — if upload fails, user has to re-select photo (should cache file in state)
- [ ] **Live location permission** — prompt appears every session; should persist permission state in localStorage

### Medium Priority

- [ ] **Shipment detail tabs** — all tabs load data on mount (should lazy-load per tab)
- [ ] **Driver handover modal** — doesn't auto-close after 5s (user must manually dismiss)
- [ ] **Leg status badges** — text overlaps on mobile when leg description is long

### Low Priority / Future

- [ ] **Dark mode** — no dark mode support yet (all colors are light mode)
- [ ] **Offline mode** — GPS pings queue in memory when offline, but don't persist across page refresh
- [ ] **Map clustering** — when 50+ trucks shown on importer "nearby trucks" map, performance degrades

---

## Conventions & Standards

### TypeScript

```typescript
// ✅ Good: Explicit types, no any
interface DriverJobCardProps {
  job: Job;
  onClick: (jobId: string) => void;
}

export function DriverJobCard({ job, onClick }: DriverJobCardProps) {
  // ...
}

// ❌ Bad: any, implicit types
export function DriverJobCard({ job, onClick }: any) {
  // ...
}
```

### API Integration

```typescript
// ✅ Good: Typed response, error handling, loading state
const [jobs, setJobs] = useState<Job[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  async function fetch() {
    try {
      const data = await driverApi.getActiveJobs();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }
  fetch();
}, []);

// ❌ Bad: No error handling, no loading state
useEffect(() => {
  driverApi.getActiveJobs().then(setJobs);
}, []);
```

### Tailwind Classes

```typescript
// ✅ Good: Responsive, semantic, composed
<div className="p-6 space-y-4 md:flex md:space-y-0 md:space-x-4">
  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
    Submit
  </button>
</div>

// ❌ Bad: Inline styles, hardcoded colors
<div style={{ padding: '24px', display: 'flex' }}>
  <button style={{ backgroundColor: '#2563eb', color: 'white' }}>
    Submit
  </button>
</div>
```

---

## TODOs & Backlog

### High Priority (This Sprint)

- [ ] Container linkage UI (KAN-61)
- [ ] Add leg form validation (prevent when `PENDING_APPROVAL`)
- [ ] POD photo gallery on importer approval screen
- [ ] Fix map bounds auto-fit race condition

### Medium Priority (Next Sprint)

- [ ] Driver job history page with filters (date range, status)
- [ ] Fleet manager earnings dashboard (placeholder for Phase 4)
- [ ] Importer load posting form redesign (multi-step wizard)
- [ ] Admin analytics dashboard (shipment volume, active users)

### Low Priority / Ideas

- [ ] Dark mode support
- [ ] Export shipment data as CSV/PDF
- [ ] Push notifications for job status changes (requires backend work)
- [ ] Offline mode with IndexedDB caching

---

## Useful References

### Internal Documentation

- **System Overview**: `.github/SYSTEM_OVERVIEW.md` (read this first every session)
- **Backend SYSTEM_OVERVIEW**: `../korecha-backend-demo/.github/SYSTEM_OVERVIEW.md` (for API contracts)
- **Team Reference**: `/Users/macm3/Desktop/korecha_team_reference.txt` (business model, roles, ERD)

### Key Files to Check

- **Routes**: `src/App.tsx` — all route definitions
- **Auth**: `src/hooks/useAuth.ts` — login/logout/token management
- **API Base**: `src/api/index.ts` — axios config, interceptors
- **Types**: `src/types/job.ts`, `shipment.ts`, `user.ts` — match backend models

### External Resources

- [React 19 Docs](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [react-leaflet](https://react-leaflet.js.org/)
- [Vite](https://vite.dev)

---

## Tips for Working with Korecha Frontend

### 1. Always Load Context First

Before starting any task:
1. Read `.github/SYSTEM_OVERVIEW.md` (system architecture + backend API contracts)
2. Read `.github/korecha-state.md` (current work, decisions, known issues)
3. Check Jira ticket details if working on a specific KAN-XX task

### 2. Match Backend Types Exactly

When creating TypeScript interfaces, copy from backend Mongoose schemas:
- Backend `Job` model → Frontend `Job` interface
- Backend status enums → Frontend string literal types
- Backend nested objects → Frontend nested interfaces

### 3. Test Across Roles

A feature often spans multiple roles:
- Load posting affects: importer (create), fleet (receive offer), driver (execute)
- Shipment tracking affects: importer (view progress), fleet (add legs), driver (update status)

Test the full workflow across role portals, not just the feature you built.

### 4. Mobile-First for Driver Pages

Driver pages are used on phones in trucks/ports:
- Large touch targets (minimum 44px × 44px)
- Clear visual hierarchy (big text for primary actions)
- Camera integration (use `capture="environment"` for rear camera)
- Offline-friendly (show cached data when API fails)

### 5. GPS Tracking Gotchas

- **Permissions**: Always check `navigator.geolocation` before calling
- **Battery drain**: Stop `watchPosition` when driver completes leg
- **Accuracy**: Filter out pings with `accuracy > 100m` (low quality)
- **Backend filter**: Only send pings when driver has `IN_TRANSIT` leg

### 6. Error Messages

Show user-friendly errors, not raw API responses:
```typescript
// ✅ Good
catch (err) {
  if (axios.isAxiosError(err) && err.response?.status === 404) {
    setError('Job not found. It may have been cancelled.');
  } else {
    setError('Unable to load job. Please try again.');
  }
}

// ❌ Bad
catch (err) {
  setError(err.message); // Could be "Network Error" or cryptic backend message
}
```

---

## Two-File Memory System (Why This Exists)

**The Problem**: Copilot has ZERO built-in memory. Every session starts fresh.

**The Solution**: Two markdown files that the agent reads at session start:

1. **SYSTEM_OVERVIEW.md** — Permanent knowledge (rarely changes):
   - System architecture, domain model, API contracts
   - Business rules (mode determination, fleet manager role)
   - Status state machines, workflows
   - Branching/Jira conventions

2. **korecha-state.md** (this file) — Current work state (changes frequently):
   - What's in progress, recently completed, next up
   - Technical decisions, known issues, TODOs
   - Current sprint context

By reading both files at the start of every session, the agent gets **instant photographic memory** of:
- The entire Korecha system (frontend + backend)
- Current work state and priorities
- Established patterns and conventions

**Keep this file updated!** After completing a feature:
1. Move it from "In Progress" to "Recently Completed"
2. Update the "Last Updated" date at the top
3. Add new technical decisions as you make them
4. Log known issues when you discover them
5. Update "Next Up" priorities if they changed

**This file IS tracked in Git** — commit it with your feature branches so the entire team (and the agent in future sessions) stays aligned on current work state. This creates a living history of the project's evolution.
