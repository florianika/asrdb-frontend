import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStateService } from './auth-state.service';

@Injectable({
  providedIn: 'root'
})
export class GuardAdminService {
  private readonly SIGNIN_PAGE_URL = '/auth/signin';

  constructor(
    private authStateService: AuthStateService,
    private router: Router
  ) { }

  public canActivate(): boolean {
    return true;
    const isLoggedIn = this.authStateService.isTokenValid();
    const isAdmin = this.authStateService.isAdmin();
    if (!isLoggedIn) {
      void this.router.navigateByUrl(this.SIGNIN_PAGE_URL);
    }
    else if (!isAdmin) {
      void this.router.navigateByUrl('403');
    }
    return isLoggedIn;
  }
}
