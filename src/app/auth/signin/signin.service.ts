import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observer } from 'rxjs';
import { AuthStateService } from 'src/app/common/services/auth-state.service';
import { environment } from 'src/environments/environment';

@Injectable()
export class SigninService {

  constructor(private authStateService: AuthStateService, private httpClient: HttpClient) { }

  signin(loginData: Partial<{ email: string | null, password: string | null }>) {
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

  private signinObserver = {
    next: (token: string) => {
      this.authStateService.setJWT(token);
      this.authStateService.setLoginState(true);
    },
    error: (error) => {
      console.log(error);
      console.error(error);
      this.authStateService.setLoginState(false);
    }
  } as Observer<string>;
}
