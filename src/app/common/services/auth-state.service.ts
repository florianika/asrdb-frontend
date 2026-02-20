import { Injectable, isDevMode, Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { ESRI_AUTH_KEY } from '../../dashboard/common/service/common-esri-auth.service';
import { EsriCredentials } from '../../model/EsriCredentials.model';
import { JWT, SigninResponse } from '../../model/JWT.model';
import { Role } from '../../model/RolePermissions.model';
import {
  AuthRefreshState,
  AuthSessionSnapshot,
  AuthSessionStore,
} from './auth-session.store';

export const DEFAULT_MUNICIPALITY = 53;
export type RefreshState = 'idle' | 'refreshing' | 'failed';
export type RefreshReason = 'guard' | 'timer' | 'esri-auth-retry';

@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  private readonly TOKEN_STORAGE_KEY = 'asrdb_jwt';
  private readonly SIGNIN_URL = '/auth/signin';
  private readonly SIGNOUT_URL = '/auth/signout';
  private readonly STOP_INTERVAL_MESSAGE = 'stopInterval';

  private tokens: SigninResponse | null;
  private isLoggedIn: BehaviorSubject<boolean>;
  private helper = new JwtHelperService();
  private subscription = new Subject<boolean>();
  private readonly refreshState = new BehaviorSubject<RefreshState>('idle');

  private webWorker!: Worker;
  private inFlightRefresh$?: Observable<boolean>;

  public readonly session: Signal<AuthSessionSnapshot>;
  public readonly role: Signal<Role | null>;
  public readonly refreshStateSignal: Signal<AuthRefreshState>;
  public readonly isRefreshingSignal: Signal<boolean>;

  constructor(
    private router: Router,
    private httpClient: HttpClient,
    private authSessionStore: AuthSessionStore = new AuthSessionStore()
  ) {
    const item = localStorage.getItem(this.TOKEN_STORAGE_KEY);
    this.tokens = item ? JSON.parse(item) : null;
    this.isLoggedIn = new BehaviorSubject(this.isTokenValid());
    this.session = this.authSessionStore.session;
    this.role = this.authSessionStore.role;
    this.refreshStateSignal = this.authSessionStore.refreshState;
    this.isRefreshingSignal = this.authSessionStore.isRefreshing;
    this.syncSessionStore();
    this.authSessionStore.setRefreshState(this.refreshState.value);
    this.createWebWorker();
  }

  logout() {
    const userId = this.getNameId();
    if (!this.tokens || !userId) {
      this.logoutUser();
      return;
    }

    this.httpClient
      .post(environment.base_url + this.SIGNOUT_URL, {
        UserId: userId,
      })
      .pipe(takeUntil(this.subscription))
      .subscribe({
        next: () => this.logoutUser(),
        error: () => this.logoutUser(),
      });
  }

  refreshToken(reason: RefreshReason = 'guard'): Observable<boolean> {
    if (this.inFlightRefresh$) {
      return this.inFlightRefresh$;
    }

    this.setRefreshState('refreshing');
    this.webWorker?.postMessage(this.STOP_INTERVAL_MESSAGE);

    this.inFlightRefresh$ = this.httpClient
      .post<SigninResponse>(environment.base_url + '/auth/refreshtoken', {
        AccessToken: this.tokens?.accessToken,
        RefreshToken: this.tokens?.refreshToken,
      })
      .pipe(
        takeUntil(this.subscription),
        tap(newToken => {
          if (isDevMode()) {
            console.log(`Token refreshed. Reason: ${reason}`);
          }
          this.setJWT({
            idToken: newToken.idToken,
            accessToken: newToken.accessToken,
            refreshToken: newToken.refreshToken,
          });
          this.webWorker?.postMessage('');
        }),
        switchMap(() =>
          this.httpClient
            .get<EsriCredentials>(environment.base_url + '/auth/gis/login')
            .pipe(
              takeUntil(this.subscription),
              tap(credentials => this.initEsriConfig(credentials)),
              map(() => true),
              catchError(error => {
                console.error(error);
                this.setRefreshState('failed');
                // JWT was refreshed successfully; map flows handle ESRI retry state.
                return of(true);
              })
            )
        ),
        tap(success => {
          if (success && this.refreshState.value !== 'failed') {
            this.setRefreshState('idle');
          }
        }),
        catchError(error => {
          console.error(error);
          this.setRefreshState('failed');
          this.logout();
          return of(false);
        }),
        finalize(() => {
          this.inFlightRefresh$ = undefined;
        }),
        shareReplay(1)
      );

    return this.inFlightRefresh$;
  }

  setLoginState(loginState: boolean) {
    this.isLoggedIn?.next(loginState);
    this.syncSessionStore();
  }

  getLoginStateAsObservable() {
    return this.isLoggedIn.asObservable();
  }

  getRefreshState$(): Observable<RefreshState> {
    return this.refreshState.asObservable();
  }

  isRefreshing$(): Observable<boolean> {
    return this.refreshState.pipe(map(state => state === 'refreshing'));
  }

  isUserLoggedIn(admin = false): Observable<boolean> {
    const authCheck$ = this.isTokenValid()
      ? of(true)
      : this.refreshToken('guard');

    return authCheck$.pipe(
      map(isAuthenticated => {
        if (!isAuthenticated) {
          this.setLoginState(false);
          return false;
        }

        if (!admin) {
          this.setLoginState(true);
          return true;
        }

        const hasAdminAccess = this.isAdmin() || this.isSupervisor();
        this.setLoginState(hasAdminAccess);
        if (!hasAdminAccess) {
          this.logout();
        }
        return hasAdminAccess;
      }),
      catchError(() => {
        this.setLoginState(false);
        this.logout();
        return of(false);
      })
    );
  }

  isTokenValid(): boolean {
    return this.isTokenValidInternal();
  }

  isAdmin() {
    return this.getDecodedJWT()?.role === 'ADMIN';
  }

  isSupervisor() {
    return this.getDecodedJWT()?.role === 'SUPERVISOR';
  }

  setJWT(newJWT: SigninResponse) {
    this.tokens = newJWT;
    localStorage.setItem(this.TOKEN_STORAGE_KEY, JSON.stringify(this.tokens));
    this.webWorker?.postMessage('');
    this.syncSessionStore();
  }

  getEmail(): string {
    const jwtToken = this.getDecodedJWT();
    return jwtToken?.email ?? '';
  }

  getName(): string {
    const jwtToken = this.getDecodedJWT();
    return jwtToken?.unique_name ?? '';
  }

  getSurname(): string {
    const jwtToken = this.getDecodedJWT();
    return jwtToken?.family_name ?? '';
  }

  getFullName(): string {
    return this.getName() + ' ' + this.getSurname();
  }

  getRole(): Role | undefined {
    const jwtToken = this.getDecodedJWT();
    return jwtToken?.role;
  }

  getNameId(): string | undefined {
    return this.getDecodedJWT()?.nameid;
  }

  getMunicipality(): number {
    try {
      const municipality = this.getDecodedJWT()?.municipality;
      if (municipality) {
        return Number.parseInt(municipality, 10);
      }
      return DEFAULT_MUNICIPALITY;
    } catch (error) {
      console.error(error);
      return DEFAULT_MUNICIPALITY;
    }
  }

  getAuthorizationToken(): string | null {
    const accessToken = this.tokens?.accessToken;
    return accessToken ? `Bearer ${accessToken}` : null;
  }

  private createWebWorker() {
    if (typeof Worker !== 'undefined') {
      this.webWorker = new Worker(new URL('../../app.worker', import.meta.url));
      this.webWorker.onmessage = () => {
        this.checkTokenValidity();
      };
      this.webWorker.postMessage('');
    }
  }

  private getDecodedJWT(): JWT | null {
    if (!this.tokens) {
      return null;
    }
    return this.helper.decodeToken<JWT>(this.tokens.idToken);
  }

  private logoutUser() {
    this.webWorker?.postMessage(this.STOP_INTERVAL_MESSAGE);
    this.tokens = null;
    localStorage.removeItem(this.TOKEN_STORAGE_KEY);
    localStorage.removeItem(ESRI_AUTH_KEY);
    sessionStorage.removeItem(this.TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(ESRI_AUTH_KEY);
    this.setLoginState(false);
    this.setRefreshState('idle');
    void this.router.navigateByUrl(this.SIGNIN_URL);
  }

  private isTokenValidInternal() {
    let isTokenValid = false;
    try {
      isTokenValid =
        !!this.tokens && !this.helper.isTokenExpired(this.tokens.idToken);
    } catch (error) {
      console.error(error);
    }
    return isTokenValid;
  }

  private isAuthTokenNearlyExpired() {
    let isTokenNearlyExpired: boolean;
    try {
      const expirationDate = this.helper.getTokenExpirationDate(
        this.tokens!.idToken
      );
      const seconds = ((expirationDate?.getTime() ?? 0) - Date.now()) / 1000;
      if (isDevMode()) {
        console.log(`Seconds left for auth token: ${seconds}`);
      }
      isTokenNearlyExpired = seconds <= 1200;
    } catch (error) {
      if (!this.router.url.includes('/auth/')) {
        console.error(error);
      }
      isTokenNearlyExpired = true;
    }
    return isTokenNearlyExpired;
  }

  private checkTokenValidity() {
    const isAuthTokenNearlyExpired = this.isAuthTokenNearlyExpired();
    const isEsriTokenNearlyExpired = this.isEsriTokenNearlyExpiry();

    if (isDevMode()) {
      console.log(`Token is valid: ${this.isTokenValidInternal()}`);
      console.log(`Subscription is: ${this.subscription.closed}`);
    }

    const shouldRefreshToken =
      isAuthTokenNearlyExpired || isEsriTokenNearlyExpired;
    if (
      shouldRefreshToken &&
      this.refreshState.value !== 'refreshing' &&
      !this.router.url.includes('/auth/')
    ) {
      if (isDevMode()) {
        console.log('Reloaded token');
      }
      this.refreshToken('timer').subscribe();
    } else if (this.router.url.includes('/auth/')) {
      this.webWorker?.postMessage(this.STOP_INTERVAL_MESSAGE);
    }
  }

  private isEsriTokenNearlyExpiry(): boolean {
    const credentials = this.getEsriCredentialsFromStorage();
    if (credentials) {
      const secondsLeft = (credentials.expires - Date.now()) / 1000;
      if (isDevMode()) {
        console.log('Time left for esri token: ', secondsLeft);
      }
      return secondsLeft < 1200;
    }
    return true;
  }

  public initEsriConfig(credentials: EsriCredentials) {
    localStorage.setItem(ESRI_AUTH_KEY, JSON.stringify(credentials));
  }

  private getEsriCredentialsFromStorage(): EsriCredentials | null {
    const credentials = localStorage.getItem(ESRI_AUTH_KEY);
    if (!credentials) {
      return null;
    }

    try {
      const parsed = JSON.parse(credentials) as EsriCredentials;
      if (!parsed?.token || !parsed?.expires) {
        return null;
      }
      return parsed;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  private syncSessionStore() {
    this.authSessionStore.setSession({
      isLoggedIn: this.isLoggedIn.value,
      role: this.getRole() ?? null,
      municipality: this.getMunicipality(),
      nameId: this.getNameId() ?? null,
    });
  }

  private setRefreshState(state: RefreshState) {
    this.refreshState.next(state);
    this.authSessionStore.setRefreshState(state);
  }
}
