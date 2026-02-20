# AGENTS Guide

## Project Snapshot
- App: `asrdb-frontend` (Angular 18, Material, ArcGIS, i18n)
- Purpose: dashboard/client for ASRDB workflows (overview, register, field work, quality/street/admin modules)
- Main source root: `src/`

## Environment Prerequisites
- Use Node 20 before running commands:
  - `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 20`
- Package manager: npm (lockfile is committed)

## Core Commands
- Install deps: `npm install`
- Start dev server: `npm run start`
- Start prod config dev server: `npm run start-prod`
- Build (development): `npm run build`
- Build (production): `npm run build-prod`
- Extract translations: `npm run localize`
- Lint: `npm run lint`
- Format: `npm run format`

## Architecture Map
- App shell + top-level routes:
  - `src/app/app.module.ts`
  - `src/app/app-routing.module.ts`
- Feature modules loaded under `/dashboard/*`:
  - `src/app/dashboard/dashboard-routing.module.ts`
- Auth routes/components:
  - `src/app/auth/auth-routing.module.ts`
  - `src/app/common/services/auth-state.service.ts`
  - `src/app/common/services/auth-interceptor.ts`
- Environment config:
  - `src/environments/environment.ts`
  - `src/environments/environment.development.ts`
- Localization files:
  - `src/locale/language.xlf`
  - `src/locale/language.sq.xlf`

## Current Review Findings (from this pass)
1. Guard observable completion bug (high)
- File: `src/app/common/services/auth-state.service.ts`
- `isUserLoggedIn()` calls `observer.complete()` immediately, even when refresh is async.
- This can complete route-guard observables before auth refresh emits.

2. Authorization header can become `Bearer undefined` (high)
- Files:
  - `src/app/common/services/auth-state.service.ts`
  - `src/app/common/services/auth-interceptor.ts`
- `getAuthorizationToken()` always returns a string (`'Bearer ' + token`), so missing token becomes `Bearer undefined` and is still attached to requests.

3. ESLint config patterns are incorrect for project-wide linting (high)
- File: `.eslintrc.json`
- Overrides use `*.ts` and `*.html` instead of recursive globs, so many files are parsed by wrong config and produce HTML parsing errors.
- `npm run lint` also scans `dist/` because it is not ignored.

4. Dev server uses disabled host checks (medium)
- File: `package.json`
- `start` and `start-prod` scripts pass `--disable-host-check`; unsafe for shared/untrusted networks.

5. No test suite currently present (medium)
- `npm test` fails because there are no `*.spec.ts` files.
- File: `tsconfig.spec.json` includes specs, but repo currently has none.

## Build/Quality Status (verified)
- `npm run build` on Node 20 succeeds.
- `npm run lint` currently fails with many formatting/type lint issues plus config-induced noise.
- `npm test` currently fails due missing spec inputs.

## Working Rules For Future Changes
- Always switch to Node 20 before builds/lint/tests.
- Prefer targeted edits in the feature area being changed (dashboard modules are large).
- Run at least `npm run build` after non-trivial code changes.
- If touching lint config, validate with `npm run lint` and ensure `dist/` is excluded.
- If touching auth/guard logic, test both:
  - cold start with expired token
  - admin/non-admin routing

## Recommended First Maintenance Tasks
1. Fix `.eslintrc.json` glob patterns and ignore `dist/`.
2. Fix `isUserLoggedIn()` observable lifecycle to complete only after async refresh path resolves.
3. Prevent `Authorization` header injection when token is absent.
4. Add at least smoke tests for auth state service and route guards.
