## ASRDB Frontend Quality Hardening Plan (Chunked)

## Summary

This is the final hardening plan split into execution chunks so we can deliver safely without destabilizing production behavior.  
Each chunk has `Critical`, `Important`, `Good to have`, and `Exit criteria`.

## Working Model

1. Complete chunks in order.
2. Do not start `Good to have` before all `Critical` in the same chunk.
3. Merge only when chunk exit criteria are all green.
4. Keep PRs small and module-scoped.

## Chunk 0: Quality Gate Foundation

### Scope

`core`, `tooling`, `CI`, `lint`, `tests`

### Critical

- [x] Enforce green `build`, `lint`, and `test` as merge blockers.
- [x] Add initial smoke specs so `/Users/reipano/Personal/asrdb-frontend/tsconfig.spec.json` has valid test inputs.
- [x] Remove insecure dev host-check flags from `/Users/reipano/Personal/asrdb-frontend/package.json`.

### Important

- [x] Keep lint file patterns and ignores stable (`dist` excluded).
- [x] Add lint rule preventing `rxjs/internal/*` imports.

### Good to have

- [x] Add pre-push script for `npm run build && npm run lint`.

### Exit criteria

- [x] `npm run build` passes.
- [x] `npm run lint` passes.
- [x] `npm test -- --watch=false` passes.

---

## Chunk 1: Auth and Session Hardening

### Scope

`auth`, `common/services`

### Critical

- [x] Normalize provider scope for `SigninV2Service` and `ForgotPasswordService` (remove dual `root` + component provider pattern).
- [x] Refactor `/Users/reipano/Personal/asrdb-frontend/src/app/common/services/auth-state.service.ts` to remove hidden navigation side effects from token decode paths.
- [x] Replace global `localStorage.clear()`/`sessionStorage.clear()` with scoped key removal.

### Important

- [x] Replace manual subscription management in `/Users/reipano/Personal/asrdb-frontend/src/app/auth/signin-v2/signin-v2.service.ts` with typed observable chains.
- [x] Remove `EventEmitter` self-unsubscribe in `/Users/reipano/Personal/asrdb-frontend/src/app/auth/signin-v2/two-fa-token-verify/two-fa-token-verify.component.ts`.

### Good to have

- [x] Introduce auth signal store (`session`, `refreshState`, `role`) with readonly facade.

### Exit criteria

- [x] Guard flow tested for expired token, refresh success, refresh failure.
- [x] No duplicate auth service instances at runtime.
- [x] No `any` in signin-v2 request/response contracts.

---

## Chunk 2: DI Scope Consistency Across Modules

### Scope

`dashboard/*`, shared feature services

### Critical

- [x] Remove duplicate service provisioning for root services in modules/components/routing.
- [x] Fix scope collisions for:
      `FieldWorkService`, `FieldWorkClosureService`, `QualityManagementService`,
      `EmailTemplateManagementService`, `TestBuildingService`,
      `CommonBuildingService`, `CommonEntranceService`, `CommonDwellingService`.

### Important

- [x] Document provider policy (see `/Users/reipano/Personal/asrdb-frontend/docs/di-provider-policy.md`):
      `root` for global state,
      feature/component providers only when isolated lifecycle is required.

### Good to have

- [x] Add lint/custom check for accidental re-providing of `providedIn: 'root'` services.

### Exit criteria

- [x] Single intended injector scope per service.
- [x] No module/provider duplication for root services.

---

## Chunk 3: Register Module Correctness and Lifecycle

### Scope

`dashboard/register`, delete dialogs, details views

### Critical

- [x] Fix non-cleaned subscriptions in `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/register/register-view-details-v2/register-view-details.service.ts`.
- [x] Implement destroy lifecycle in `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/register/register-view-details-v2/register-view-details-v2.component.ts` and call cleanup.
- [x] Fix wrong state write `selectedDwelling` in entrance service close path.
- [x] Fix hidden-field contamination:
      `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/register/register-form/dwelling-details-form/dwelling-details-form.component.ts` currently mutates `STREET_HIDDEN_FIELDS`.

### Important

- [x] Add missing `OnDestroy` + teardown in `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/register/register-form/register-form.component.ts`.
- [x] Fix delete dialog flow in `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/common/components/entity-delete-confirmation-doalog/entity-delete-confirmation-dialog.component.ts`.

### Good to have

- [x] Split large register classes into store + mapper + API adapter layers.

### Exit criteria

- [x] Repeated navigation in/out of details pages does not duplicate requests.
- [x] Delete flows trigger single reload and cleanly close dialogs.
- [x] Hidden field behavior is deterministic.

---

## Chunk 4: Shared Map and ArcGIS Reliability

### Scope

`dashboard/common/components/register-map`, shared entity services

### Critical

- [x] Fix entrance click mapping bug in `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/common/components/register-map/map-interaction.service.ts` to use building link field.
- [x] Remove root-scoped long-lived map service leak patterns in `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/register/register-form/entity-management-map.service.ts`.
- [x] Add teardown for map subscriptions in `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/register/register-form/building-creation/building-creation.component.ts`.

### Important

- [x] Replace broad ArcGIS `any` with typed DTOs and adapters.
- [x] Normalize map query/filter helpers into reusable typed utilities.

### Good to have

- [x] Add map integration tests for building vs entrance selection.

### Exit criteria

- [x] No map event subscription leak after route changes.
- [x] Correct filter IDs applied for building and entrance clicks.
- [x] ArcGIS typed boundaries introduced for core flows.

---

## Chunk 5: Field-Work, Statistics, and Admin Async Control

### Scope

`field-work`, `statistic-export`, `administration`

### Critical

- [x] Replace recursive `setTimeout` polling with cancellable observable polling and explicit stop conditions.
- [x] Add component/service destroy cancellation for running jobs and status polling.

### Important

- [x] Fix teardown gaps in:
      `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/field-work/field-work-table/field-work-table.component.ts`,
      `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/administration/user-management/user-management.component.ts`,
      `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/administration/email-template-management/email-template-management-table/email-template-management-table.component.ts`.

### Good to have

- [x] Standardize async orchestration pattern for all long-running jobs.

### Exit criteria

- [x] Navigating away stops all polling.
- [x] No stale loading states after cancellation.
- [x] Long-running flows survive refresh/reentry safely.

---

## Chunk 6: Quality and Street Modules Cleanup

### Scope

`quality-management`, `street-management`

### Critical

- [x] Fix quality table init-order bug where filter loads before `entity` is set:
      `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/quality-management/quality-management-table/quality-management-table.component.ts`.
- [x] Fix create/edit route consistency in `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/quality-management/quality-management-routing.module.ts`.
- [x] Remove wrong hidden field definitions for street in `/Users/reipano/Personal/asrdb-frontend/src/app/common/data/hidden-fields.ts`.

### Important

- [x] Break oversized street table logic into focused services.
- [x] Eliminate stringly filter logic and improve typed filter contracts.

### Good to have

- [x] Add e2e smoke for quality rule add/edit and street merge flow.

### Exit criteria

- [x] Quality add/edit path works deterministically.
- [x] Street filter/form behavior is type-safe and stable.

---

## Chunk 7: Signal-First State Migration

### Scope

Cross-cutting component/service state architecture

### Critical

- [x] Standardize on signal stores for feature state where practical.
- [x] Replace mixed `BehaviorSubject + local mutable state + signal` combos in high-churn modules.

### Important

- [x] Introduce `computed` selectors and readonly state exposure patterns.
- [x] Increase `OnPush` adoption beyond current baseline.

### Good to have

- [x] Add migration guide and patterns doc for future contributors.

### Exit criteria

- [x] Signal-based stores used in core workflows.
- [x] Clear write paths and predictable reactivity boundaries.

---

## Chunk 8: Type Safety and RxJS Hygiene

### Scope

Whole app quality debt

### Critical

- [x] Remove all `rxjs/internal/*` imports.
- [x] Remove highest-risk `any` usage from `register`, `common`, and `street-management`.
- [x] Convert self-subscribing services to return typed observables/promises at boundaries where appropriate.

### Important

- [x] Add strict DTO mappers for API responses.
- [x] Remove dead/unused imports and service fields.

### Good to have

- [x] Introduce lightweight typed API client wrappers.

### Exit criteria

- [x] `@typescript-eslint/no-explicit-any` debt significantly reduced in core modules.
- [x] No internal RxJS imports remain.

---

## Public API and Type Changes

1. Service methods that currently self-subscribe should return typed `Observable<T>` or `Promise<T>` where orchestration belongs to caller layer.
2. ArcGIS response handling should pass through typed adapter interfaces.
3. Feature stores should expose readonly state and explicit mutation methods.
4. Provider scope policy becomes explicit and enforced.

## Required Test Matrix

1. Auth: expired token, refresh path, role-based guards.
2. Register: details navigation loop, delete cascade, map click correctness.
3. Field-work: open/close flow with cancellable polling.
4. Statistics: snapshot lifecycle, cancellation, retry handling.
5. Administration: user/template table refresh correctness.
6. Quality/Street: rule create/edit route + street form/filter behavior.
7. Lint/type: no `rxjs/internal/*`, no regressions in strict mode.

## Assumptions

1. Angular 18 stack remains.
2. No backend contract rewrite unless required for correctness.
3. Module boundaries stay; internals are refactored.
4. Build, lint, test must all be green before release freeze.
