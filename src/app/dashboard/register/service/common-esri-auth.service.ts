import { Injectable, OnDestroy } from '@angular/core';

import esriId from '@arcgis/core/identity/IdentityManager';
import { AuthStateService } from 'src/app/common/services/auth-state.service';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { Subject } from 'rxjs/internal/Subject';
import {environment} from "../../../../environments/environment";

@Injectable()
export class CommonEsriAuthService implements OnDestroy {
  private ESRI_AUTH_KEY = 'ESRI-AUTH';
  private subscription = new Subject<boolean>();

  constructor(private authState: AuthStateService) {
    this.authState.getLoginStateAsObservable()
      .pipe(takeUntil(this.subscription))
      .subscribe((loginState: boolean) => {
        if (!loginState) {
          localStorage.removeItem(this.ESRI_AUTH_KEY);
        }
      });
    this.initializeAuth();
  }

  ngOnDestroy(): void {
    this.subscription.next(true);
    this.subscription.complete();
  }

  getTokenForResource(): string {
    const credentials = localStorage.getItem(this.ESRI_AUTH_KEY);
    if (credentials) {
      const parsedCredentials = JSON.parse(credentials);
      return parsedCredentials.token;
    }
    return '';
  }

  private initializeAuth(): void {
    void this.initEsriConfig();
  }

  private async initEsriConfig() {
    const token = await esriId.generateToken({
      server: environment.portal_url,
      tokenServiceUrl: 'https://salstatstaging.tddev.it/portal/sharing/rest/generateToken'
    } as __esri.ServerInfo, {
      username: 'salstatuser',
      password: 'EZ]3J*BsiXwtY+^'
    });
    localStorage.setItem(this.ESRI_AUTH_KEY, JSON.stringify(token));
  }
}
