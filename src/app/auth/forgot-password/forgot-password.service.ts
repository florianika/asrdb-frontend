import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {MatSnackBar} from "@angular/material/snack-bar";
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class ForgotPasswordService {
  private loading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.loading.asObservable();
  constructor(private httpClient: HttpClient, private matSnack: MatSnackBar) { }

  sendResetPasswordEmail(email: string) {
    this.loading.next(true);
    // Simulate an HTTP request to reset the password
    return this.httpClient.post(environment.base_url + '/auth/forget-password', { email }).subscribe({
      next: () => {
        this.loading.next(false);
        this.matSnack.open('Please check the email for instructions on how to reset the password', 'OK', {
          duration: 5000,
        });
      },
      error: () => {
        this.loading.next(false);
        this.matSnack.open('An error occurred while trying to reset the password. Please try again later.', 'OK', {
          duration: 5000,
        });
      }
    });
  }

  resetPassword(token: string, newPassword: string) {
    this.loading.next(true);
    return this.httpClient.post(environment.base_url + '/auth/reset-password', { token, newPassword }).subscribe({
      next: () => {
        this.loading.next(false);
        this.matSnack.open('Your password has been successfully reset.', 'OK', {
          duration: 5000,
        });
      },
      error: () => {
        this.loading.next(false);
        this.matSnack.open('An error occurred while trying to reset the password. Please try again later.', 'OK', {
          duration: 5000,
        });
      }
    });
  }
}
