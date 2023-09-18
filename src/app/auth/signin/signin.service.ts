import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, Observer } from 'rxjs';
import { AuthStateService } from 'src/app/common/services/auth-state.service';
import { environment } from 'src/environments/environment';

@Injectable()
export class SigninService {
  private signingIn = new BehaviorSubject(false);
  private signinObserver = {
    next: (token: string) => {
      this.authStateService.setJWT(token);
      this.authStateService.setLoginState(true);
      this.router.navigateByUrl('/dashboard');
      this.signingIn.next(false);
    },
    error: (error) => {
      console.error(error);
      this.signingIn.next(false);
      this.authStateService.setLoginState(false);
    }
  } as Observer<string>;

  constructor(private authStateService: AuthStateService, private httpClient: HttpClient,  private router: Router) { }

  signin(loginData: Partial<{ email: string | null, password: string | null }>) {
    this.signingIn.next(true);
    const data = {
      email: loginData.email,
      password: loginData.password
    };
    this.httpClient.post<string>(environment.base_url + '/auth/signin', JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json"
      }
    }).subscribe(this.signinObserver);
  }

  createSigninForm() {
    return new FormGroup({
      email: new FormControl('', [Validators.email]),
      password: new FormControl('')
    });
  }

  get signingInAsObservable() {
    return this.signingIn.asObservable();
  }
}
