import { Injectable, OnDestroy } from '@angular/core';
import { firstValueFrom, map, Observable, of, Subject, takeUntil } from 'rxjs';

import {
  AuthStateService,
  RefreshReason,
} from 'src/app/common/services/auth-state.service';
import { EsriCredentials } from 'src/app/model/EsriCredentials.model';

export const ESRI_AUTH_KEY = 'ESRI-AUTH';

@Injectable()
export class CommonEsriAuthService implements OnDestroy {
  private subscription = new Subject<boolean>();

  constructor(private authState: AuthStateService) {
    this.authState
      .getLoginStateAsObservable()
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
    return this.getEsriCredentials()?.token ?? '';
  }

  getEsriCredentials(): EsriCredentials | null {
    const credentials = localStorage.getItem(ESRI_AUTH_KEY);
    if (!credentials) {
      return null;
    }

    try {
      const parsedCredentials = JSON.parse(credentials) as EsriCredentials;
      if (!parsedCredentials?.token || !parsedCredentials?.expires) {
        return null;
      }
      return parsedCredentials;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  ensureEsriReady(
    minTtlSeconds = 1200,
    reason: RefreshReason = 'esri-auth-retry'
  ): Observable<boolean> {
    if (this.hasSufficientTtl(minTtlSeconds)) {
      return of(true);
    }

    return this.authState.refreshToken(reason).pipe(
      map(jwtRefreshSucceeded => {
        if (!jwtRefreshSucceeded) {
          return false;
        }
        return this.hasSufficientTtl(1);
      })
    );
  }

  async withEsriRetry<T>(op: () => Promise<T>): Promise<T> {
    try {
      return await op();
    } catch (error) {
      if (!this.isEsriAuthError(error)) {
        throw error;
      }

      const ready = await firstValueFrom(
        this.ensureEsriReady(1, 'esri-auth-retry')
      );
      if (!ready) {
        throw error;
      }

      return op();
    }
  }

  isEsriAuthError(error: unknown): boolean {
    const fallbackError = error as
      | { message?: string; details?: { message?: string }[]; code?: number }
      | undefined;

    const message = `${fallbackError?.message ?? ''} ${
      fallbackError?.details?.map(detail => detail?.message).join(' ') ?? ''
    }`.toLowerCase();

    return (
      fallbackError?.code === 498 ||
      fallbackError?.code === 499 ||
      message.includes('498') ||
      message.includes('499') ||
      message.includes('token required') ||
      message.includes('invalid token') ||
      message.includes('authentication') ||
      message.includes('not authorized')
    );
  }

  private hasSufficientTtl(minTtlSeconds: number): boolean {
    const credentials = this.getEsriCredentials();
    if (!credentials) {
      return false;
    }

    const secondsLeft = (credentials.expires - Date.now()) / 1000;
    return secondsLeft > minTtlSeconds;
  }
}
