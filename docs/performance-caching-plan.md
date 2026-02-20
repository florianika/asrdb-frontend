# Performance and Caching Plan

## Goal

Reduce request volume, duplicate reads, and perceived latency in high-traffic dashboard flows without changing business behavior.

## Current Findings

- Existing cache patterns are limited and local:
  - `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/common/service/common-entity-structure.service.ts`
  - `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/common/components/register-map/wmts-capabilities.service.ts`
- Main read hotspots with repeated query work:
  - `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/common/service/common-building.service.ts`
  - `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/common/service/common-entrance.service.ts`
  - `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/common/service/common-dwellings.service.ts`
  - `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/common/service/common-street.service.ts`
- Register table has multiple startup load triggers:
  - `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/register/register-table-view/register-table/register-table.component.ts`

## Constraints

- Do not cache auth-sensitive endpoints (for example `/Auth/2fa/login`, `/Auth/2fa/verify`).
- Caching must be in-memory only for this phase (no localStorage/sessionStorage persistence for API payloads).
- Mutation calls must invalidate relevant caches immediately.

---

## Chunk 1: Query Caching Foundation

### Scope

Shared read-path caching utilities for dashboard entity queries.

### Tasks

- [ ] Add a small in-memory cache helper for observable requests:
  - key-based lookup
  - TTL support (default 15s)
  - in-flight dedupe (`shareReplay(1)`)
  - explicit invalidation methods
- [ ] Define stable query-key generation for entity filters (sorted key/value serialization).
- [ ] Add unit tests for cache behavior:
  - hit within TTL
  - miss after TTL
  - single network call for concurrent subscribers
  - manual invalidation

### Effort

0.5-1 day

### Exit Criteria

- [ ] Repeated identical queries within TTL return cached value.
- [ ] Concurrent identical queries share one network call.

---

## Chunk 2: Entity Service Integration

### Scope

`common-building`, `common-entrance`, `common-dwellings`, `common-street`.

### Tasks

- [ ] Integrate read caching into:
  - `getBuildingData`, `getBuildingMunicipality`, `getBuildingStats`
  - `getEntranceData`
  - `getDwellings`
  - `getStreets`, `getAllStreetsForMunicipality`
- [ ] Add cache invalidation hooks after successful mutations:
  - `createFeature`
  - `updateFeature`
  - `deleteFeature`
  - `resetStatus`
- [ ] Keep mutation requests uncached.
- [ ] Preserve existing error behavior and snack bar messaging.

### Effort

0.75-1 day

### Exit Criteria

- [ ] Navigation and filter toggles produce fewer duplicate entity reads.
- [ ] Data refreshes correctly after create/update/delete/reset actions.

---

## Chunk 3: Service-Level Performance Optimizations

### Scope

Reduce avoidable work per request cycle.

### Tasks

- [ ] Reuse a single `FeatureLayer` instance per service (instead of constructing on each getter access).
- [ ] Parallelize count/data/global-id query work where safe.
- [ ] Skip expensive global-id query when caller does not need it.
- [ ] Add lightweight timing logs in dev mode for key reads (optional guard behind `isDevMode()`).

### Effort

0.5-0.75 day

### Exit Criteria

- [ ] Lower median response time in register table loads.
- [ ] Lower per-navigation ArcGIS query count.

---

## Chunk 4: Register Table Duplicate-Load Cleanup

### Scope

`register-table.component` startup and reload behavior.

### Tasks

- [ ] Remove duplicate initial load triggers.
- [ ] Ensure one deterministic load path for:
  - initial render
  - filter change
  - sort/page change
  - manual reload
- [ ] Add/update smoke test to assert one startup data fetch.

### Effort

0.25-0.5 day

### Exit Criteria

- [ ] Initial table open performs a single data fetch sequence.
- [ ] No regressions in sort/pagination/filter flows.

---

## Validation and Rollout

### Tasks

- [ ] Run:
  - `npx tsc -p tsconfig.app.json --noEmit`
  - `npx tsc -p tsconfig.spec.json --noEmit`
  - `npm run build`
  - targeted `npm test -- --watch=false --browsers=ChromeHeadless --include=...`
- [ ] Compare before/after request counts in browser Network tab for:
  - register table navigation
  - entity detail open/close cycles
  - street list + merge flow
- [ ] Document measured wins in this file.

### Effort

0.5 day

---

## Estimated Total Effort

2-3 working days

## Success Metrics

- 30-60% fewer duplicate read requests in register/street flows.
- No stale data after mutation flows.
- No auth/2FA behavior changes.
