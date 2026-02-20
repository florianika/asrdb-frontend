# Dependency Injection Provider Scope Policy

## Purpose
Prevent accidental duplicate service instances and inconsistent state behavior across modules, routes, and components.

## Rules
1. Use `@Injectable({ providedIn: 'root' })` for shared application services.
2. Do not re-provide root services in `providers` of `@NgModule`, `@Component`, or route records.
3. Use feature/component/route providers only for intentionally isolated lifecycle state.
4. If isolated scope is required, do not keep `providedIn: 'root'` on that service.
5. Keep one intended injector scope per service and document scope decisions in PRs.

## Allowed Exception Pattern
Use local providers only when instance isolation is required and state must be reset with component/route teardown.

## PR Checklist
1. If a service appears in a `providers` array, verify whether it is root-provided.
2. Remove duplicate provisioning for root services.
3. Verify affected flows still behave correctly with a single injector scope.

## Automated Guard
Run `npm run check:di-scope` to detect root services re-provided in local `providers` arrays.
