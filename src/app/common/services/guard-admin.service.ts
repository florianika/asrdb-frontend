import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { AuthStateService } from './auth-state.service';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GuardAdminService {
  constructor(
    private authStateService: AuthStateService,
    private router: Router
  ) {}

  public canActivate(): Observable<boolean | UrlTree> {
    return this.authStateService.isUserLoggedIn().pipe(
      map(isLoggedIn => {
        if (!isLoggedIn) {
          return this.router.parseUrl('/auth/signin');
        }

        return this.authStateService.isAdmin() ||
          this.authStateService.isSupervisor()
          ? true
          : this.router.parseUrl('/403');
      })
    );
  }
}
