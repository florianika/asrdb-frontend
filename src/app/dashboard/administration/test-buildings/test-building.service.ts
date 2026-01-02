import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';

export const TEST_JOB_ID = 'testJobId';

export type TestBuildingInput = {
  runUpdates: boolean;
  startAt: string;
};

@Injectable({
  providedIn: 'root',
})
export class TestBuildingService {
  private matSnackBar = inject(MatSnackBar);
  private httpClient = inject(HttpClient);

  public testBuildingSignal = signal({
    jobId: '',
    status: '',
    isRunning: false,
  });

  public testAllBuildings(input: TestBuildingInput) {
    const url = environment.base_url + '/qms/buildings/run-test-job/all';
    this.httpClient.post<{ jobId: string }>(url, input).subscribe({
      next: response => {
        this.testBuildingSignal.set({
          jobId: response.jobId,
          status: 'STARTED',
          isRunning: true,
        });

        this.matSnackBar.open(
          $localize`Test job started successfully`,
          $localize`Close`,
          { duration: 3000 }
        );

        this.updateUrlWithJobId(response.jobId);
        this.checkStatus();
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
    const url = environment.base_url + '/qms/buildings/run-test-job/untested';
    this.httpClient.post<{ jobId: string }>(url, input).subscribe({
      next: response => {
        this.testBuildingSignal.set({
          jobId: response.jobId,
          status: 'STARTED',
          isRunning: true,
        });

        this.matSnackBar.open(
          $localize`Test job started successfully`,
          $localize`Close`,
          { duration: 3000 }
        );

        this.updateUrlWithJobId(response.jobId);
        this.checkStatus();
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

    const url = environment.base_url + `/qms/buildings/status-test-job/${id}`;
    this.httpClient.get<{ status: string }>(url).subscribe({
      next: response => {
        const isRunning = response.status === 'RUNNING';
        this.testBuildingSignal.set({
          jobId: id,
          status: response.status,
          isRunning,
        });

        if (isRunning) {
          setTimeout(() => this.checkStatus(), 5000);
        }
      },
      error: error => {
        const message = error?.error?.message
          ? error.error.message
          : $localize`Failed to fetch test job status`;

        this.matSnackBar.open(message, $localize`Close`, {
          duration: 3000,
        });

        this.testBuildingSignal.set({
          jobId: id,
          status: 'FAILED',
          isRunning: false,
        });
      },
    });
  }

  public updateJobIdFromUrl(jobId: string) {
    this.testBuildingSignal.update(state => ({
      ...state,
      jobId,
      isRunning: true,
    }));
    this.checkStatus();
  }

  private updateUrlWithJobId(jobId: string) {
    const url = new URL(window.location.href);
    const hash = url.hash;
    url.searchParams.set(TEST_JOB_ID, jobId);
    const newUrl = url.toString() + hash;
    window.history.replaceState({}, '', newUrl);
  }
}
