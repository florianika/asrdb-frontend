import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthStateService } from './auth-state.service';

@Injectable({
  providedIn: 'root'
})
export class GuardService {
  private readonly LOGIN_PAGE_NAME = '/auth/signin';

  constructor(
    private authStateService: AuthStateService,
    private router: Router
  ) { }

  public canActivate(): boolean {
    const isLoggedIn = this.authStateService.isTokenValid();
    if (!isLoggedIn) {
      this.router.navigateByUrl(this.LOGIN_PAGE_NAME);
    }
    return isLoggedIn;
  }
}
