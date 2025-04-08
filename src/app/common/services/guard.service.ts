import {Injectable} from '@angular/core';
import {AuthStateService} from './auth-state.service';
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class GuardService {

  constructor(
    private authStateService: AuthStateService,
  ) { }

  public canActivate(): Observable<boolean> {
    return this.authStateService.isUserLoggedIn();
  }
}
