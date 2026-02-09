import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { catchError, of } from 'rxjs';
import { MatStepper } from '@angular/material/stepper';
import { AuthStateService } from '../../common/services/auth-state.service';
import { Credentials } from '../signin/signin.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
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

  public login(username: string, password: string, stepper: MatStepper) {
    this.loginSignal.set({
      userId: '',
      isLoggingIn: true,
    });
    const data = {
      email: username,
      password: password,
    };
    const url = environment.base_url + '/Auth/2fa/login';
    const subscription = this.httpClient
      .post(url, data)
      .pipe(
        catchError(error => {
          console.error(error);
          this.matSnack.open('Username or password not correct', 'Ok', {
            duration: 3000,
          });
          return of(null);
        })
      )
      .subscribe({
        next: response => {
          if (response) {
            const userId = (response as any).userId;
            this.loginSignal.set({
              userId: userId,
              isLoggingIn: false,
            });
            stepper.next();
          } else {
            this.loginSignal.set({
              userId: '',
              isLoggingIn: false,
            });
          }
          subscription.unsubscribe();
        },
        complete: () => {
          subscription.unsubscribe();
        }
      });
  }

  public verify2FA(token: string) {
    this.verify2FASignal.set({
      isVerifying: true,
    });
    const data = {
      userId: this.loginSignal().userId,
      code: token,
    };
    const url = environment.base_url + '/Auth/2fa/verify';
    const subscription = this.httpClient
      .post(url, data)
      .pipe(
        catchError(error => {
          console.error(error);
          this.matSnack.open('2FA token not correct', 'Ok', {
            duration: 3000,
          });
          return of(null);
        })
      )
      .subscribe({
        next: response => {
          if (response) {
            this.authStateService.setJWT(response as any);
            this.getEsriCredentials();
            this.verify2FASignal.set({
              isVerifying: false,
            });
            // Handle successful 2FA verification, e.g., navigate to dashboard
          } else {
            this.verify2FASignal.set({
              isVerifying: false,
            });
          }
          subscription.unsubscribe();
        },
        complete: () => {
          subscription.unsubscribe();
        }
      });
  }

  private getEsriCredentials() {
    this.httpClient
      .get<Credentials>(environment.base_url + '/auth/gis/login')
      .subscribe({
        next: async credentials => {
          try {
            this.authStateService.initEsriConfig(credentials);
            void this.router.navigateByUrl('/dashboard');
            this.authStateService.setLoginState(true);
            this.verify2FASignal.set({
              isVerifying: false,
            });
          } catch (error) {
            this.handleError(error);
          }
        },
        error: error => {
          this.handleError(error);
        },
      });
  }

  private handleError(error: any) {
    console.error(error);
    this.verify2FASignal.set({
      isVerifying: false,
    });
    this.authStateService.setLoginState(false);
    this.matSnack.open('Could not load credentials. Please try again.', 'Ok', {
      duration: 3000,
    });
  }
}
