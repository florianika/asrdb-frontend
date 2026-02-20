import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

@Injectable()
export class ForgotPasswordService {
  private loading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.loading.asObservable();
  constructor(
    private httpClient: HttpClient,
    private matSnack: MatSnackBar,
    private router: Router
  ) {}

  sendResetPasswordEmail(email: string) {
    this.loading.next(true);
    return this.httpClient
      .post(environment.base_url + '/auth/forget-password', { email })
      .subscribe({
        next: () => {
          this.loading.next(false);
          this.matSnack.open(
            $localize`Please check the email for instructions on how to reset the password.`,
            $localize`OK`,
            { duration: 5000 }
          );
        },
        error: () => {
          this.loading.next(false);
          this.matSnack.open(
            $localize`An error occurred while trying to reset the password. Please try again later.`,
            $localize`OK`,
            { duration: 5000 }
          );
        },
      });
  }

  resetPassword(token: string, newPassword: string) {
    this.loading.next(true);
    return this.httpClient
      .post(environment.base_url + '/auth/reset-password', {
        token,
        newPassword,
      })
      .subscribe({
        next: () => {
          this.loading.next(false);
          this.matSnack.open(
            $localize`Your password has been successfully reset.`,
            $localize`OK`,
            { duration: 5000 }
          );
          void this.router.navigateByUrl('/auth/signin');
        },
        error: () => {
          this.loading.next(false);
          this.matSnack.open(
            $localize`An error occurred while trying to reset the password. Please try again later.`,
            $localize`OK`,
            { duration: 5000 }
          );
        },
      });
  }
}
