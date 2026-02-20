import { HttpClient } from '@angular/common/http';
import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';
import {
  Subject,
  catchError,
  takeUntil,
} from 'rxjs';
import { AsyncOrchestrationService } from '../../common/service/async-orchestration.service';

export const TEST_JOB_ID = 'testJobId';

export type TestBuildingInput = {
  runUpdates: boolean;
  startAt: string;
};

@Injectable({
  providedIn: 'root',
})
export class TestBuildingService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private statusPollingStop$ = new Subject<void>();
  private matSnackBar = inject(MatSnackBar);
  private httpClient = inject(HttpClient);
  private asyncOrchestration = inject(AsyncOrchestrationService);

  public testBuildingSignal = signal({
    jobId: '',
    hangfireJobId: '',
    status: '',
    isRunning: false,
  });

  ngOnDestroy(): void {
    this.cancelStatusPolling();
    this.destroy$.next();
    this.destroy$.complete();
    this.statusPollingStop$.complete();
  }

  public cancelStatusPolling(resetRunning = false) {
    this.asyncOrchestration.resetPolling(this.statusPollingStop$);
    if (resetRunning) {
      this.testBuildingSignal.update(state => ({
        ...state,
        isRunning: false,
      }));
    }
  }

  public testAllBuildings(input: TestBuildingInput) {
    this.cancelStatusPolling();
    const url = environment.base_url + '/qms/buildings/run-test-job/all';
    this.httpClient.post<{ jobId: string, hangfireJobId: string }>(url, input).subscribe({
      next: response => {
        this.testBuildingSignal.set({
          jobId: response.jobId,
          hangfireJobId: response.hangfireJobId,
          status: 'STARTED',
          isRunning: true,
        });

        this.matSnackBar.open(
          $localize`Test job started successfully`,
          $localize`Close`,
          { duration: 3000 }
        );

        this.updateUrlWithJobId(response.jobId);
        this.startStatusPolling(response.jobId);
      },
      error: error => {
        const message = error?.error?.message
          ? error.error.message
          : $localize`Failed to start test job`;

        this.matSnackBar.open(message, $localize`Close`, {
          duration: 3000,
        });
      },
    });
  }

  public testUntestedBuildings(input: TestBuildingInput) {
    this.cancelStatusPolling();
    const url = environment.base_url + '/qms/buildings/run-test-job/untested';
    this.httpClient.post<{ jobId: string, hangfireJobId: string }>(url, input).subscribe({
      next: response => {
        this.testBuildingSignal.set({
          jobId: response.jobId,
          hangfireJobId: response.hangfireJobId,
          status: 'STARTED',
          isRunning: true,
        });

        this.matSnackBar.open(
          $localize`Test job started successfully`,
          $localize`Close`,
          { duration: 3000 }
        );

        this.updateUrlWithJobId(response.jobId);
        this.startStatusPolling(response.jobId);
      },
      error: error => {
        const message = error?.error?.message
          ? error.error.message
          : $localize`Failed to start test job`;

        this.matSnackBar.open(message, $localize`Close`, {
          duration: 3000,
        });
      },
    });
  }

  public checkStatus() {
    const id = this.testBuildingSignal().jobId;
    if (!id) return;
    this.startStatusPolling(id);
  }

  private startStatusPolling(jobId: string) {
    this.cancelStatusPolling();
    const url = environment.base_url + `/qms/buildings/status-test-job/${jobId}`;
    this.asyncOrchestration
      .createPollingStream({
        destroy$: this.destroy$,
        stop$: this.statusPollingStop$,
        request: () =>
          this.httpClient.get<{ status: string; hangfireJobId: string }>(url),
        onError: error => {
          const message = (error as { error?: { message?: string } })?.error
            ?.message
            ? (error as { error: { message: string } }).error.message
            : $localize`Failed to fetch test job status`;

          this.matSnackBar.open(message, $localize`Close`, {
            duration: 3000,
          });

          this.testBuildingSignal.set({
            jobId,
            hangfireJobId: '',
            status: 'FAILED',
            isRunning: false,
          });
          this.cancelStatusPolling();
        },
      })
      .subscribe({
        next: response => {
          const isRunning = response.status === 'RUNNING';
          this.testBuildingSignal.set({
            jobId,
            hangfireJobId: response.hangfireJobId,
            status: response.status,
            isRunning,
          });

          if (!isRunning) {
            this.cancelStatusPolling();
          }
        },
      });
  }

  public updateJobIdFromUrl(jobId: string) {
    this.cancelStatusPolling();
    this.testBuildingSignal.update(state => ({
      ...state,
      jobId,
      isRunning: true,
    }));
    this.startStatusPolling(jobId);
  }

  private updateUrlWithJobId(jobId: string) {
    const url = new URL(window.location.href);
    const hash = url.hash;
    url.searchParams.set(TEST_JOB_ID, jobId);
    const newUrl = url.toString() + hash;
    window.history.replaceState({}, '', newUrl);
  }
}
