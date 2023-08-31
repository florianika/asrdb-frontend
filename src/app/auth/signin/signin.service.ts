import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observer } from 'rxjs';
import { AuthStateService } from 'src/app/common/services/auth-state.service';

@Injectable()
export class SigninService {

  constructor(private authStateService: AuthStateService, private httpClient: HttpClient) { }

  signin(loginData: Partial<{ email: string | null, password: string | null }>) {
    const formData = new FormData();
    formData.append('email', loginData.email ?? '');
    formData.append('password', loginData.password ?? '');

    this.httpClient.post<string>('', formData).subscribe(this.signinObserver);
  }

  createSigninForm() {
    return new FormGroup({
      email: new FormControl('', [Validators.email]),
      password: new FormControl('')
    });
  }

  private signinObserver = {
    next: (token) => {
      this.authStateService.setJWT(token);
      this.authStateService.setLoginState(true);
    },
    error: (error) => {
      console.error(error);
      this.authStateService.setLoginState(false);
    }
  } as Observer<string>;
}
