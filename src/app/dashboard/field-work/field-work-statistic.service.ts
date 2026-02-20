import { Injectable, OnDestroy, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthStateService } from '../../common/services/auth-state.service';
import { HttpClient } from '@angular/common/http';
import {
  Subject,
  catchError,
  of,
  takeUntil,
} from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AsyncOrchestrationService } from '../common/service/async-orchestration.service';

export type FieldWorkExecuteJobRequest = {
  id: number;
  createdUser: string;
};

export type FieldWorkExecuteJobResponse = {
  jobId: number;
};

export type FieldWorkJobExecutionStatusResponse = {
  status: string;
};

export type FieldWorkStatisticsResult = {
  statisticsDTO: FieldWorkStatistics[];
};

export type FieldWorkStatistics = {
  municipality: number;
  ruleStatistics: number;
  bldStatistics: number;
};

@Injectable()
export class FieldWorkStatisticService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private stopStatusPolling$ = new Subject<void>();

  public statistics = signal({
    loading: false,
    statistics: [] as FieldWorkStatistics[],
  });

  constructor(
    private authStateService: AuthStateService,
    private httpClient: HttpClient,
    private matSnackBar: MatSnackBar,
    private asyncOrchestration: AsyncOrchestrationService
  ) {}

  ngOnDestroy(): void {
    this.cancelStatusPolling(true);
    this.destroy$.next();
    this.destroy$.complete();
    this.stopStatusPolling$.complete();
  }

  public cancelStatusPolling(resetLoading = false) {
    this.asyncOrchestration.resetPolling(this.stopStatusPolling$);
    if (resetLoading) {
      this.statistics.update(state => ({ ...state, loading: false }));
    }
  }

  public startFieldWorkJobExecution(fieldWorkId: number) {
    this.cancelStatusPolling();
    this.statistics.set({ loading: true, statistics: [] });
    const url = `${environment.base_url}/qms/fieldwork/${fieldWorkId}/execute-job`;
    const request: FieldWorkExecuteJobRequest = {
      id: fieldWorkId,
      createdUser: this.authStateService.getNameId() || 'anonymous',
    };

    this.httpClient
      .post<FieldWorkExecuteJobResponse>(url, request)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error(error);
          this.matSnackBar.open(
            $localize`Failed to start field work job execution`,
            $localize`Close`,
            { duration: 3000 }
          );
          return of(null);
        })
      )
      .subscribe((res: FieldWorkExecuteJobResponse | null) => {
        if (!res) {
          this.statistics.set({ loading: false, statistics: [] });
          return;
        }
        this.matSnackBar.open(
          $localize`Job started with ID: ${res.jobId}`,
          $localize`Close`,
          { duration: 3000 }
        );
        this.startStatusPolling(res.jobId);
      });
  }

  public getFieldWorkJobExecutionStatus(jobId: number) {
    this.startStatusPolling(jobId);
  }

  private startStatusPolling(jobId: number) {
    this.cancelStatusPolling();
    this.statistics.set({ loading: true, statistics: [] });
    const url = `${environment.base_url}/qms/fieldwork/job/${jobId}/status`;

    this.asyncOrchestration
      .createPollingStream({
        destroy$: this.destroy$,
        stop$: this.stopStatusPolling$,
        request: () =>
          this.httpClient.get<FieldWorkJobExecutionStatusResponse>(url),
        onError: error => {
          console.error(error);
          this.matSnackBar.open(
            $localize`Failed to get field work job execution status`,
            $localize`Close`,
            { duration: 3000 }
          );
          this.statistics.set({ loading: false, statistics: [] });
          this.cancelStatusPolling();
        },
      })
      .subscribe((res: FieldWorkJobExecutionStatusResponse) => {
        if (res.status === 'COMPLETED') {
          this.cancelStatusPolling();
          this.matSnackBar.open(
            $localize`Field work job execution completed successfully`,
            $localize`Close`,
            { duration: 3000 }
          );
          this.getFieldWorkStatistics(jobId);
        } else if (res.status === 'FAILED') {
          this.matSnackBar.open(
            $localize`Field work job execution failed`,
            $localize`Close`,
            { duration: 3000 }
          );
          this.cancelStatusPolling();
          this.statistics.set({ loading: false, statistics: [] });
        }
      });
  }

  public getFieldWorkStatistics(jobId: number) {
    this.statistics.set({ loading: true, statistics: [] });
    const url = `${environment.base_url}/qms/fieldwork/job/${jobId}/results`;

    this.httpClient
      .get<FieldWorkStatisticsResult>(url)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error(error);
          this.matSnackBar.open(
            $localize`Failed to get field work statistics`,
            $localize`Close`,
            { duration: 3000 }
          );
          return of(null);
        })
      )
      .subscribe((res: FieldWorkStatisticsResult | null) => {
        if (!res) {
          this.statistics.set({ loading: false, statistics: [] });
          return;
        }
        this.statistics.set({
          loading: false,
          statistics: res.statisticsDTO ?? [],
        });
      });
  }
}
