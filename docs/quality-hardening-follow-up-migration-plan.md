## ASRDB Frontend Follow-up Migration Plan (Post Chunk 7)

## Summary

This follow-up plan covers the remaining state-architecture migration work after chunk 7.
It keeps the same execution model as the main hardening plan and focuses on:

- removing mixed state patterns (`BehaviorSubject` + mutable fields + writable public signals)
- enforcing readonly signal-store boundaries
- removing component-side writes into service state
- increasing `OnPush` adoption in affected flows

Current inventory snapshot:

- `17` files still use `BehaviorSubject` (`51` usages)
- `13` service-level public writable signals (`public ... = signal(...)`)
- `8` component-side writes into service signals (`.update(...)` in component files)

## Working Model

1. Complete chunks in order.
2. Do not start `Good to have` before all `Critical` in the same chunk.
3. Merge only when chunk exit criteria are all green.
4. Keep PRs small and module-scoped.
5. Use `/Users/reipano/Personal/asrdb-frontend/docs/signal-store-migration-guide.md` as the source migration pattern.

---

## Chunk 9: Field-Work Signal Boundary Cleanup

### Scope

`dashboard/field-work` closure and statistics flows

### Critical

- [ ] Convert `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/field-work/field-work-closure/field-work-closure.service.ts` to private state + readonly selectors (`computed`) and explicit write methods.
- [ ] Replace component-side writes to `fieldWorkStatistics.update(...)` with service intent methods in:
      `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/field-work/field-work-closure/field-work-closure-modal.component.ts`,
      `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/field-work/field-work-closure/steps/step-1-field-work-closure-statistics/step-1-field-work-closure-statistics.component.ts`,
      `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/field-work/field-work-closure/steps/step-2-field-work-closure-email/step-2-field-work-closure-email.component.ts`.
- [ ] Convert `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/field-work/field-work-statistic.service.ts` to readonly signal selectors with service-owned writes only.
- [ ] Remove component-side writes to statistics state in `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/field-work/filed-work-form/field-work-form-step3/field-work-form-step3.component.ts`.

### Important

- [ ] Add `ChangeDetectionStrategy.OnPush` where safe for affected field-work closure and step components.
- [ ] Normalize step transitions to service methods (`setStep`, `nextStep`, `previousStep`) only.

### Good to have

- [ ] Add smoke tests for closure step transitions and polling cancellation.

### Exit criteria

- [ ] No `fieldWorkStatistics.update(...)` calls remain in component files.
- [ ] All closure and statistics writes are routed through service methods.
- [ ] Polling cancellation behavior remains stable on navigation/destroy.

### Estimated effort

`2-3` dev days

---

## Chunk 10: Register Details Signal-Store Hardening

### Scope

`dashboard/register/register-view-details-v2`

### Critical

- [ ] Convert `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/register/register-view-details-v2/register-view-details.service.ts` to private state + readonly selectors.
- [ ] Convert `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/register/register-view-details-v2/entrance/entrance-details.service.ts` to private state + readonly selectors.
- [ ] Convert `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/register/register-view-details-v2/dwelling/dwelling-details.service.ts` to private state + readonly selectors.
- [ ] Remove component-side writes to service signals in:
      `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/register/register-view-details-v2/entrance/entrance-list/entrance-list.component.ts`,
      `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/register/register-view-details-v2/dwelling/dwelling-list/dwelling-list.component.ts`.

### Important

- [ ] Replace direct signal writes in effects with explicit service methods where possible (reduce `allowSignalWrites` usage).
- [ ] Add `OnPush` to impacted register details components where input/output patterns are stable.

### Good to have

- [ ] Split structure/section mapping logic into pure helper functions for easier testing.

### Exit criteria

- [ ] No component writes to `viewData.update(...)`, `dwellingStructure.update(...)`, or `entranceStructure.update(...)`.
- [ ] Register details workflows still support open/edit/delete/reload without state regressions.
- [ ] Cleanup/destroy behavior remains deterministic during repeated route transitions.

### Estimated effort

`4-6` dev days

---

## Chunk 11: Signal Service Normalization (Stats/Admin/Auth v2)

### Scope

`statistic-export`, `administration/test-buildings`, `auth/signin-v2`

### Critical

- [ ] Convert `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/statistic-export/statistic-export.service.ts` to one private state signal with readonly selectors and service-owned writes.
- [ ] Convert `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/administration/test-buildings/test-building.service.ts` to private state + readonly selectors.
- [ ] Convert `/Users/reipano/Personal/asrdb-frontend/src/app/auth/signin-v2/signin-v2.service.ts` writable public signals (`loginSignal`, `verify2FASignal`) to readonly selector exposure with intent methods.

### Important

- [ ] Replace custom `Observable` wrappers and `Observer<any>` usage in statistic-export with typed observable chains.
- [ ] Add `OnPush` in related consumers where feasible after selector migration.

### Good to have

- [ ] Add smoke tests for snapshot generation polling and signin-v2 step transitions.

### Exit criteria

- [ ] No writable public signal exposure remains in these services.
- [ ] Polling and async status flows preserve existing user behavior.
- [ ] Typing is improved at service boundaries (no new `any`).

### Estimated effort

`3-4` dev days

---

## Chunk 12: BehaviorSubject Migration (Medium Coupling)

### Scope

`administration`, `common/service`, legacy auth flows

### Critical

- [ ] Convert `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/administration/user-management/user-management.service.ts` from `BehaviorSubject` to signal store.
- [ ] Convert `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/administration/email-template-management/email-template-management.service.ts` from `BehaviorSubject` to signal store.
- [ ] Convert `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/common/service/common-entity-structure.service.ts` from `BehaviorSubject` to signal store.
- [ ] Convert `/Users/reipano/Personal/asrdb-frontend/src/app/auth/signin/signin.service.ts` from `BehaviorSubject` to signal store.
- [ ] Convert `/Users/reipano/Personal/asrdb-frontend/src/app/auth/signup/signup.service.ts` from `BehaviorSubject` to signal store.
- [ ] Convert `/Users/reipano/Personal/asrdb-frontend/src/app/auth/forgot-password/forgot-password.service.ts` from `BehaviorSubject` to signal store.

### Important

- [ ] Keep compatibility observables only where existing component contracts require them.
- [ ] Add readonly selector exposure and explicit write methods in each migrated service.

### Good to have

- [ ] Consolidate or deprecate legacy auth (`signin`/`signup`) if `signin-v2` is fully adopted.

### Exit criteria

- [ ] No `BehaviorSubject` remains in the services listed in this chunk.
- [ ] Existing screens continue to function without template-level regressions.

### Estimated effort

`4-6` dev days

---

## Chunk 13: High-Coupling State Migration (Auth/Register/Map)

### Scope

`common/services/auth-state`, register table/log/delete/map flows

### Critical

- [ ] Convert `/Users/reipano/Personal/asrdb-frontend/src/app/common/services/auth-state.service.ts` (`BehaviorSubject`-based auth and refresh state) to a signal-store architecture while preserving refresh semantics.
- [ ] Convert `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/register/register-table-view/register-delete.service.ts` to signal store with explicit action methods.
- [ ] Convert `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/register/register-table-view/register-filter.service.ts` to signal store with readonly selectors.
- [ ] Convert `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/register/register-log-view/register-log-table/register-log.service.ts` to signal store and replace ad-hoc execution polling with cancellable orchestration.
- [ ] Convert `/Users/reipano/Personal/asrdb-frontend/src/app/dashboard/register/register-form/entity-management-map.service.ts` (`municipality` `BehaviorSubject`) to signal-store pattern.

### Important

- [ ] Preserve auth guard, refresh, and interceptor compatibility during auth-state migration.
- [ ] Keep register delete/filter/log API behavior stable under high-frequency user interactions.

### Good to have

- [ ] Add integration smoke scenarios for:
      auth refresh + guarded navigation,
      register delete/reload,
      rule execution log refresh,
      map municipality switching.

### Exit criteria

- [ ] No `BehaviorSubject` remains in chunk-13 services.
- [ ] Auth refresh and route-guard behavior match current production semantics.
- [ ] Register table/log/map flows remain deterministic through repeated interactions.

### Estimated effort

`7-10` dev days

---

## Roll-up Effort

- High-impact next wave (`Chunk 9` + `Chunk 10` + `Chunk 11`): `9-13` dev days.
- Full remaining migration (`Chunk 9` through `Chunk 13`): `20-29` dev days.

## Execution Notes

- Keep each PR module-scoped and under ~`300-500` LOC net change where possible.
- Run `npm run build` on Node 20 for every chunk.
- For service migrations, prioritize:
  1. private `state` signal
  2. readonly `computed` selectors
  3. intent-based write methods
  4. component migration away from direct state writes
