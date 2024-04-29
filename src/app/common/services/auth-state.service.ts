import { Injectable, isDevMode, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { JWT, SigninResponse } from 'src/app/model/JWT.model';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Role } from 'src/app/model/RolePermissions.model';
import {Credentials} from "../../auth/signin/signin.service";
import esriId from "@arcgis/core/identity/IdentityManager";
import {ESRI_AUTH_KEY} from "../../dashboard/common/service/common-esri-auth.service";

@Injectable({
  providedIn: 'root'
})
export class AuthStateService implements OnDestroy {
  private readonly TOKEN_STORAGE_KEY = 'asrdb_jwt';
  private readonly SIGNIN_URL = '/auth/signin';
  private readonly SIGNOUT_URL = '/auth/signout';
  private readonly STOP_INTERVAL_MESSAGE = 'stopInterval';

  private tokens: SigninResponse | null;
  private isLoggedIn: BehaviorSubject<boolean>;
  private helper = new JwtHelperService();

  private subscription = new Subject<boolean>();
  private webWorker!: Worker;

  constructor(private router: Router, private httpClient: HttpClient) {
    const item = localStorage.getItem(this.TOKEN_STORAGE_KEY);
    this.tokens = item ? JSON.parse(item) : null;
    this.isLoggedIn = new BehaviorSubject(this.isTokenValid());
    this.createWebWorker();
  }

  ngOnDestroy() {
    this.subscription.next(true);
    this.subscription.complete();
    this.webWorker.postMessage(this.STOP_INTERVAL_MESSAGE)
  }

  logout() {
    this.httpClient.post(environment.base_url + this.SIGNOUT_URL, {
      'UserId': this.getNameId()
    }).pipe(takeUntil(this.subscription)).subscribe({
      next: () => {
        this.logoutUser();
      },
      error: () => {
        this.logoutUser();
      }
    });
  }

  refreshToken() {
    this.webWorker.postMessage(this.STOP_INTERVAL_MESSAGE)
    this.httpClient.post<SigninResponse>(environment.base_url + '/auth/refreshtoken', {
      'AccessToken': this.tokens?.accessToken,
      'RefreshToken': this.tokens?.refreshToken
    }).pipe(takeUntil(this.subscription))
      .subscribe({
        next: async (newToken) => {
          if (isDevMode()) {
            console.log(newToken);
          }
          if (!this.tokens) {
            this.tokens = {} as SigninResponse;
          }
          this.setJWT({
            idToken: newToken.idToken,
            accessToken: newToken.accessToken,
            refreshToken: newToken.refreshToken
          });
          this.webWorker.postMessage('');
          this.httpClient.get<Credentials>(environment.base_url + '/auth/gis/credentials')
            .subscribe({
              next: async (credentials) => {
                try {
                  await this.initEsriConfig(credentials);
                } catch (error) {
                  this.handleError(error);
                }
              },
              error: (error) => {
                this.handleError(error);
              }
            });
        },
        error: () => {
          this.logout();
        }
      });
  }

  setLoginState(loginState: boolean) {
    this.isLoggedIn?.next(loginState);
  }

  getLoginStateAsObservable() {
    return this.isLoggedIn.asObservable();
  }

  isTokenValid(): boolean {
    const isTokenValid = this.isTokenValidInternal();
    this.setLoginState(isTokenValid);
    return isTokenValid;
  }

  isAdmin() {
    return this.isTokenValid() && this.getDecodedJWT()?.role === 'ADMIN';
  }

  setJWT(newJWT: SigninResponse) {
    this.tokens = newJWT;
    localStorage.setItem(this.TOKEN_STORAGE_KEY, JSON.stringify(this.tokens));
    this.webWorker.postMessage('');
  }

  getEmail(): string {
    const jwtToken = this.getDecodedJWT();
    return jwtToken?.email ?? '';
  }

  getName(): string {
    const jwtToken = this.getDecodedJWT();
    return jwtToken?.name ?? '';
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

  getAuthorizationToken() {
    return 'Bearer ' + this.tokens?.accessToken;
  }

  private createWebWorker() {
    if (typeof Worker !== 'undefined') {
      // Create a new
      this.webWorker = new Worker(new URL('../../app.worker', import.meta.url));
      this.webWorker.onmessage = ({ data }) => {
        this.checkTokenValidity();
      };
      this.webWorker.postMessage(''); // Start interval
    } else {
      // Web Workers are not supported in this environment.
      // You should add a fallback so that your program still executes correctly.
    }
  }

  private getDecodedJWT(): JWT | null {
    if (!this.tokens) {
      void this.router.navigateByUrl(this.SIGNIN_URL);
      return null;
    }
    return this.helper.decodeToken<JWT>(this.tokens.idToken);
  }

  private logoutUser() {
    this.webWorker.postMessage(this.STOP_INTERVAL_MESSAGE)
    this.setLoginState(false);
    localStorage.removeItem(this.TOKEN_STORAGE_KEY);
    void this.router.navigateByUrl(this.SIGNIN_URL);
  }

  private isTokenValidInternal() {
    let isTokenValid = false;
    try {
      isTokenValid = !!this.tokens && !this.helper.isTokenExpired(this.tokens.idToken);
    } catch (e) {
      console.error(e);
    }
    return isTokenValid;
  }

  private tokenInNearExpired() {
    let isTokenNearlyExpired: boolean;
    try {
      const expirationDate = this.helper.getTokenExpirationDate(this.tokens!.idToken);
      const startDate = new Date();
      const seconds = ((expirationDate?.getTime() ?? 0) - startDate.getTime()) / 1000;
      if (isDevMode()) {
        console.log(`Seconds left: ${seconds}`);
      }
      isTokenNearlyExpired = seconds <= 10;
    } catch (e) {
      if (!this.router.url.includes('/auth/')) {
        console.error(e);
      }
      isTokenNearlyExpired = true;
    }
    return isTokenNearlyExpired;
  }

  private checkTokenValidity() {
    if (isDevMode()) {
      console.log(`Token is valid: ${this.isTokenValidInternal()}`);
      console.log(`Subscription is: ${this.subscription.closed}`);
    }
    if (this.tokenInNearExpired() && !this.router.url.includes('/auth/')) {
      if (isDevMode()) {
        console.log('Reloaded token');
      }
      this.refreshToken();
    } else if (this.router.url.includes('/auth/')) {
      this.webWorker.postMessage(this.STOP_INTERVAL_MESSAGE);
    }
  }

  public async initEsriConfig(credentials: Credentials) {
    const token = await esriId.generateToken({
      server: environment.portal_url,
      tokenServiceUrl: environment.token_url,
    } as __esri.ServerInfo, {
      username: credentials.username,
      password: credentials.password,
    });
    localStorage.setItem(ESRI_AUTH_KEY, JSON.stringify(token));
  }

  private handleError(error: any) {
    console.error(error);
    this.logout();
  }
}
