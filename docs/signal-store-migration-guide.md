# Signal Store Migration Guide

This project is migrating feature state to a signal-first pattern.
Use this guide when converting services that currently mix `BehaviorSubject`, mutable fields, and writable shared signals.

## Target Pattern

1. Keep one private state signal per service:
   `private readonly state = signal<FeatureState>(initialState);`
2. Expose readonly selectors with `computed`:
   `readonly loading = computed(() => this.state().loading);`
3. Keep all writes inside service methods:
   `private patchState(patch: Partial<FeatureState>) { ... }`
4. Let components read selectors and call intent methods:
   `service.moveCurrentStep(-1)` instead of `service.state.update(...)`.

## Migration Steps

1. Define a typed `FeatureState` with all feature state in one place.
2. Replace internal `BehaviorSubject`s with `state` + `computed` selectors.
3. Add explicit write methods for all user actions and async flows.
4. Update components to:
   - read readonly selectors
   - call service methods for mutations
5. Add `ChangeDetectionStrategy.OnPush` where component data is signal-driven.

## Rules of Thumb

- Keep selectors small and composable.
- Do not expose writable signals from services.
- Prefer method names that describe intent (`setCurrentStep`, `toggleStatus`).
- Keep side effects (HTTP, navigation, snackbars) in service methods, not template-bound logic.
