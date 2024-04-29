import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BehaviorSubject, Observer } from 'rxjs';
import { AuthStateService } from 'src/app/common/services/auth-state.service';
import { SigninResponse } from 'src/app/model/JWT.model';
import { environment } from 'src/environments/environment';

export type Credentials = { username: string, password: string };

@Injectable()
export class SigninService {
  private signingIn = new BehaviorSubject(false);
  private signinObserver = {
    next: (signinResponse: SigninResponse) => {
      this.getEsriCredentials(signinResponse);
    },
    error: (error) => {
      console.error(error);
      this.signingIn.next(false);
      this.authStateService.setLoginState(false);
      this.matSnack.open('Username or password not correct', 'Ok', {
        duration: 3000
      });
    }
  } as Observer<SigninResponse>;

  constructor(
    private authStateService: AuthStateService,
    private httpClient: HttpClient,
    private router: Router,
    private matSnack: MatSnackBar) { }

  signin(loginData: Partial<{ email: string | null, password: string | null }>) {
    this.signingIn.next(true);
    const data = {
      email: loginData.email,
      password: loginData.password
    };
    this.httpClient.post<SigninResponse>(environment.base_url + '/auth/login', JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json'
      }
    }).subscribe(this.signinObserver);
  }

  createSigninForm() {
    return new FormGroup({
      email: new FormControl('', [Validators.email]),
      password: new FormControl('')
    });
  }

  getEsriCredentials(signinResponse: SigninResponse) {
    this.httpClient.get<Credentials>(environment.base_url + '/auth/gis/credentials')
      .subscribe({
      next: async (credentials) => {
        try {
          await this.authStateService.initEsriConfig(credentials);
          void this.router.navigateByUrl('/dashboard');
          this.authStateService.setJWT(signinResponse);
          this.authStateService.setLoginState(true);
          this.signingIn.next(false);
        } catch (error) {
          this.handleError(error);
        }
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  private handleError(error: any) {
    console.error(error);
    this.signingIn.next(false);
    this.authStateService.setLoginState(false);
    this.matSnack.open('Could not load credentials. Please try again.', 'Ok', {
      duration: 3000
    });
  }

  get signingInAsObservable() {
    return this.signingIn.asObservable();
  }
}
