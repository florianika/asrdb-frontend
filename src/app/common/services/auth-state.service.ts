import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { JWT, Role } from 'src/app/model/JWT.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {

  private readonly TOKEN_STORAGE_KEY = 'asrdb_jwt';
  private readonly SIGNIN_PAGE_URL = '/auth/signin';

  private JWT: string | null;
  private isLoggedIn: BehaviorSubject<boolean>;
  private helper = new JwtHelperService();

  constructor(private router: Router) {
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

  setJWT(newJWT: string) {
    this.JWT = newJWT;
    localStorage.setItem(this.TOKEN_STORAGE_KEY, this.JWT);
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
    return jwtToken?.surname ?? '';
  }

  getFullName(): string {
    return this.getName() + ' ' + this.getSurname();
  }

  getRole(): Role | undefined {
    const jwtToken = this.getDecodedJWT();
    return jwtToken?.role;
  }

  private getDecodedJWT(): JWT | null {
    if (!this.JWT) {
      this.router.navigateByUrl(this.SIGNIN_PAGE_URL);
      return null;
    }
    return this.helper.decodeToken<JWT>(this.JWT);
  }
}
