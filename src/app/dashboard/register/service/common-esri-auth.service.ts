import { Injectable, OnDestroy } from '@angular/core';

import esriId from '@arcgis/core/identity/IdentityManager';
import esriConfig from '@arcgis/core/config';
import { AuthStateService } from 'src/app/common/services/auth-state.service';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { Subject } from 'rxjs/internal/Subject';

type Credential = {
  'userId': string;
  'server': string;
  'token': string;
  'expires': number;
  'validity': number;
  'ssl': boolean;
  'creationTime': number;
  'scope': string;
  'resources': string[];
};

type ServerInfo = {
  'adminTokenServiceUrl': string;
  'currentVersion': number;
  'hasServer': boolean;
  'owningSystemUrl': string;
  'server': string;
  'tokenServiceUrl': string;
};

type Credentials = {
  'serverInfos': ServerInfo[],
  'oAuthInfos': [],
  'credentials': Credential[]
}

@Injectable()
export class CommonEsriAuthService implements OnDestroy {
  private ESRI_AUTH_KEY = 'ESRI-AUTH';
  private portalUrl = 'https://gislab.teamdev.it/portal';
  private apiKey = '7pVCdD54JxE7lOPm';
  private subscription = new Subject<boolean>();

  constructor(private authState: AuthStateService) {
    this.authState.getLoginStateAsObservable()
      .pipe(takeUntil(this.subscription))
      .subscribe((loginState: boolean) => {
        // if (!loginState) {
        //   localStorage.removeItem(this.ESRI_AUTH_KEY);
        // }
      });
    this.inizializeAuth();
  }

  ngOnDestroy(): void {
    this.subscription.next(true);
    this.subscription.complete();
  }

  getTokenForResource(url: string): string {
    const credentials = localStorage.getItem(this.ESRI_AUTH_KEY);
    if (credentials) {
      const parsedCredentials: Credentials = JSON.parse(credentials);
      const credential = parsedCredentials.credentials.find((c) => c.resources.includes(url));
      return credential ? credential.token : '';
    }
    return '';
  }

  private inizializeAuth(): void {
    this.initIdentityProvider();
    this.initEsriConfig();
    this.registerOAuth();
    esriId.on('credential-create', () => {
      localStorage.setItem(this.ESRI_AUTH_KEY, JSON.stringify(esriId.toJSON()));
    });
  }

  private initEsriConfig() {
    esriConfig.portalUrl = this.portalUrl;
    esriConfig.apiKey = this.apiKey;
  }

  private initIdentityProvider() {
    const config = localStorage.getItem(this.ESRI_AUTH_KEY);
    if (config) {
      esriId.initialize(JSON.parse(config));
    }
  }

  private registerOAuth() {
    // const oAuthInfo = new OAuthInfo({
    //   portalUrl: portalUrl,
    //   appId: apiKey,
    //   flowType: "auto", // default that uses two-step flow
    //   popup: true
    // });
    // esriId.registerOAuthInfos([oAuthInfo]);
  }
}
