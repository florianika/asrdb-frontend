import {Injectable, OnDestroy} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {JwtHelperService} from '@auth0/angular-jwt';
import {JWT, Role, SigninResponse} from 'src/app/model/JWT.model';
import {Router} from '@angular/router';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class AuthStateService implements OnDestroy {

  private readonly TOKEN_STORAGE_KEY = 'asrdb_jwt';
  private readonly SIGNIN_URL = '/auth/signin';
  private readonly SIGNOUT_URL = "/auth/signuout";


  private tokens: SigninResponse | null;
  private isLoggedIn: BehaviorSubject<boolean>;
  private helper = new JwtHelperService();

  private subscription = new BehaviorSubject(false);

  constructor(private router: Router, private httpClient: HttpClient) {
    const item = localStorage.getItem(this.TOKEN_STORAGE_KEY);
    this.tokens = item ? JSON.parse(item) : null;
    this.isLoggedIn = new BehaviorSubject(this.isTokenValid());
  }

  ngOnDestroy() {
    this.subscription.next(true);
    this.subscription.complete();
  }

  logout() {
    this.httpClient.post(environment.base_url + this.SIGNOUT_URL, {
      "UserId": this.getNameId()
    }).subscribe({
      next: () => {
        this.logoutUser();
      },
      error: () => {
        this.logoutUser();
      }
    });
  }

  setLoginState(loginState: boolean) {
    this.isLoggedIn?.next(loginState);
  }

  getLoginState(): boolean {
    return this.isLoggedIn.value;
  }

  getLoginStateAsObservable() {
    return this.isLoggedIn.asObservable();
  }

  isTokenValid(): boolean {
    let isTokenValid = false;
    try {
      if (this.tokens) {
        isTokenValid = !this.helper.isTokenExpired(this.tokens.idToken);
      }
    } catch(e) {
      console.error(e);
    }
    this.setLoginState(isTokenValid);
    return isTokenValid;
  }

  isAdmin() {
    return this.isTokenValid() && this.getDecodedJWT()?.role === "ADMIN";
  }

  setJWT(newJWT: SigninResponse) {
    this.tokens = newJWT;
    localStorage.setItem(this.TOKEN_STORAGE_KEY, JSON.stringify(this.tokens));
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

  getNameId(): string | undefined {
    return this.getDecodedJWT()?.nameid;
  }

  private getDecodedJWT(): JWT | null {
    if (!this.tokens) {
      void this.router.navigateByUrl(this.SIGNIN_URL);
      return null;
    }
    return this.helper.decodeToken<JWT>(this.tokens.idToken);
  }

  private logoutUser() {
    this.setLoginState(false);
    localStorage.removeItem(this.TOKEN_STORAGE_KEY);
    void this.router.navigateByUrl(this.SIGNIN_URL);
  }
}
