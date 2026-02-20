import { computed, Injectable, Signal, signal } from '@angular/core';
import { Role } from '../../model/RolePermissions.model';

export type AuthRefreshState = 'idle' | 'refreshing' | 'failed';

export type AuthSessionSnapshot = {
  isLoggedIn: boolean;
  role: Role | null;
  municipality: number | null;
  nameId: string | null;
};

@Injectable({
  providedIn: 'root',
})
export class AuthSessionStore {
  private readonly _session = signal<AuthSessionSnapshot>({
    isLoggedIn: false,
    role: null,
    municipality: null,
    nameId: null,
  });
  private readonly _refreshState = signal<AuthRefreshState>('idle');

  readonly session: Signal<AuthSessionSnapshot> = computed(() =>
    this._session()
  );
  readonly role: Signal<Role | null> = computed(() => this._session().role);
  readonly refreshState: Signal<AuthRefreshState> = computed(() =>
    this._refreshState()
  );
  readonly isRefreshing: Signal<boolean> = computed(
    () => this._refreshState() === 'refreshing'
  );

  setSession(session: AuthSessionSnapshot): void {
    this._session.set(session);
  }

  patchSession(sessionPatch: Partial<AuthSessionSnapshot>): void {
    this._session.update(current => ({
      ...current,
      ...sessionPatch,
    }));
  }

  setRefreshState(state: AuthRefreshState): void {
    this._refreshState.set(state);
  }
}
