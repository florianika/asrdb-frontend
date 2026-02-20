import { Injectable } from '@angular/core';
import { EMPTY, Observable, Subject, catchError, switchMap, takeUntil, timer } from 'rxjs';

export type PollingConfig<T> = {
  destroy$: Observable<void>;
  stop$: Observable<void>;
  request: () => Observable<T>;
  onError?: (error: unknown) => void;
  intervalMs?: number;
};

@Injectable({
  providedIn: 'root',
})
export class AsyncOrchestrationService {
  private readonly DEFAULT_INTERVAL_MS = 5000;

  createPollingStream<T>(config: PollingConfig<T>): Observable<T> {
    return timer(0, config.intervalMs ?? this.DEFAULT_INTERVAL_MS).pipe(
      takeUntil(config.destroy$),
      takeUntil(config.stop$),
      switchMap(() =>
        config.request().pipe(
          catchError(error => {
            config.onError?.(error);
            return EMPTY;
          })
        )
      )
    );
  }

  resetPolling(stop$: Subject<void>) {
    stop$.next();
  }
}
