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
    const isLoggedIn = this.authStateService.isTokenValid();
    const isAdmin = this.authStateService.isAdmin();
    if (!isLoggedIn) {
      this.router.navigateByUrl(this.SIGNIN_PAGE_URL);
    }
    else if (!isAdmin) {
      this.router.navigateByUrl('403');
    }
    return isLoggedIn;
  }
}
