import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { AuthStateService } from '../../common/services/auth-state.service';
import { EsriCredentials } from '../../model/EsriCredentials.model';
import { Router } from '@angular/router';
import { SigninResponse } from '../../model/JWT.model';

type SigninV2LoginRequest = {
  email: string;
  password: string;
};

type SigninV2LoginResponse = {
  userId: string;
};

type SigninV2VerifyRequest = {
  userId: string;
  code: string;
};

@Injectable()
export class SigninV2Service {
  private matSnack = inject(MatSnackBar);
  private authStateService = inject(AuthStateService);
  private router = inject(Router);

  public loginSignal = signal({
    userId: '',
    isLoggingIn: false,
  });

  public verify2FASignal = signal({
    isVerifying: false,
  });

  constructor(private httpClient: HttpClient) {}

  public login(username: string, password: string): Observable<boolean> {
    this.loginSignal.set({
      userId: '',
      isLoggingIn: true,
    });

    const data: SigninV2LoginRequest = {
      email: username,
      password,
    };

    const url = environment.base_url + '/Auth/2fa/login';
    return this.httpClient
      .post<SigninV2LoginResponse>(url, data)
      .pipe(
        catchError(error => {
          this.handleLoginError(error);
          return of<SigninV2LoginResponse | null>(null);
        })
      )
      .pipe(
        tap(response => {
          if (!response?.userId) {
            this.loginSignal.set({
              userId: '',
              isLoggingIn: false,
            });
            return;
          }

          this.loginSignal.set({
            userId: response.userId,
            isLoggingIn: false,
          });
        }),
        map(response => !!response?.userId)
      );
  }

  public verify2FA(token: string): Observable<boolean> {
    this.verify2FASignal.set({
      isVerifying: true,
    });

    const userId = this.loginSignal().userId;
    if (!userId) {
      this.verify2FASignal.set({ isVerifying: false });
      this.authStateService.setLoginState(false);
      this.matSnack.open('Session expired. Please sign in again.', 'Ok', {
        duration: 3000,
      });
      return of(false);
    }

    const data: SigninV2VerifyRequest = {
      userId,
      code: token,
    };
    const url = environment.base_url + '/Auth/2fa/verify';

    return this.httpClient.post<SigninResponse>(url, data).pipe(
      catchError(error => {
        this.handle2FATokenError(error);
        return of<SigninResponse | null>(null);
      }),
      switchMap(response => {
        if (!response) {
          return of(false);
        }

        this.authStateService.setJWT(response);
        return this.getEsriCredentials();
      }),
      finalize(() => {
        this.verify2FASignal.set({ isVerifying: false });
      })
    );
  }

  private getEsriCredentials(): Observable<boolean> {
    return this.httpClient
      .get<EsriCredentials>(environment.base_url + '/auth/gis/login')
      .pipe(
        tap(credentials => {
          this.authStateService.initEsriConfig(credentials);
          this.authStateService.setLoginState(true);
          void this.router.navigateByUrl('/dashboard');
        }),
        map(() => true),
        catchError(error => {
          this.handleCredentialError(error);
          return of(false);
        })
      );
  }

  private handleLoginError(error: unknown): void {
    console.error(error);
    this.loginSignal.set({
      userId: '',
      isLoggingIn: false,
    });
    this.matSnack.open('Username or password not correct', 'Ok', {
      duration: 3000,
    });
  }

  private handle2FATokenError(error: unknown): void {
    console.error(error);
    this.authStateService.setLoginState(false);
    this.matSnack.open('2FA token not correct', 'Ok', {
      duration: 3000,
    });
  }

  private handleCredentialError(error: unknown): void {
    console.error(error);
    this.authStateService.setLoginState(false);
    this.matSnack.open('Could not load credentials. Please try again.', 'Ok', {
      duration: 3000,
    });
  }
}
