import { Injectable, OnDestroy } from '@angular/core';

import { AuthStateService } from 'src/app/common/services/auth-state.service';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { Subject } from 'rxjs/internal/Subject';

export const ESRI_AUTH_KEY = 'ESRI-AUTH';

@Injectable()
export class CommonEsriAuthService implements OnDestroy {
  private subscription = new Subject<boolean>();

  constructor(private authState: AuthStateService) {
    this.authState.getLoginStateAsObservable()
      .pipe(takeUntil(this.subscription))
      .subscribe((loginState: boolean) => {
        if (!loginState) {
          localStorage.removeItem(ESRI_AUTH_KEY);
        }
      });
  }

  ngOnDestroy(): void {
    this.subscription.next(true);
    this.subscription.complete();
  }

  getTokenForResource(): string {
    const credentials = localStorage.getItem(ESRI_AUTH_KEY);
    if (credentials) {
      const parsedCredentials = JSON.parse(credentials);
      return parsedCredentials.token;
    }
    return '';
  }
}
