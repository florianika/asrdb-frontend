import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { JWT } from 'src/app/model/JWT.model';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {

  private readonly TOKEN_STORAGE_KEY = 'asrdb_jwt';

  private JWT: string | null;
  private isLoggedIn: BehaviorSubject<boolean>;
  private helper = new JwtHelperService();

  constructor() {
    this.JWT = localStorage.getItem(this.TOKEN_STORAGE_KEY);
    this.isLoggedIn = new BehaviorSubject(this.isTokenValid());
  }

  setLoginState(loginState: boolean) {
    this.isLoggedIn.next(loginState);
  }

  getLoginState(): boolean {
    return this.isLoggedIn.value;
  }

  getLoginStateAsObservable() {
    return this.isLoggedIn.asObservable();
  }

  isTokenValid(): boolean {
    if (this.JWT) {
      return !this.helper.isTokenExpired(this.JWT);
    }
    return false;
  }

  setJWT(newJWT: any) {
    this.JWT = newJWT;
  }

  getemail(): string {
    if (!this.JWT) {
      return '';
    }
    const jwtToken = this.helper.decodeToken<JWT>(this.JWT);
    return jwtToken?.email ?? '';
  }

  getName(): string {
    if (!this.JWT) {
      return '';
    }
    const jwtToken = this.helper.decodeToken<JWT>(this.JWT);
    return jwtToken?.name ?? '';
  }

  getSurname(): string {
    if (!this.JWT) {
      return '';
    }
    const jwtToken = this.helper.decodeToken<JWT>(this.JWT);
    return jwtToken?.surname ?? '';
  }

  getFullName(): string {
    return this.getName() + ' ' + this.getSurname();
  }
}
