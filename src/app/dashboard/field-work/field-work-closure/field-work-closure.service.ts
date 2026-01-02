import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthStateService } from '../../../common/services/auth-state.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export type FieldWorkClosureStatistic = {
  municipality: string;
  quality: string;
  review: string;
  totalBuildings: number;
};

export type FieldWorkClosureStatisticsResponse = {
  loading: boolean;
  stats: FieldWorkClosureStatistic[] | FieldWorkClosureStatus[];
  status: string;
  step: number; // Optional step field to track progress
};

export type FieldWorkClosureStatus = {
  municipalityCode: number;
  municipalityName: string;
  approvedBuildings: number;
  fieldworkBuildings: number;
  progressPercent: number;
  status: string;
};

@Injectable({
  providedIn: 'root',
})
export class FieldWorkClosureService {
  private httpClient: HttpClient = inject<any>(HttpClient);
  private auth = inject(AuthStateService);
  private matSnackBar = inject(MatSnackBar);

  public fieldWorkStatistics = signal<FieldWorkClosureStatisticsResponse>({
    loading: false,
    stats: [],
    status: '',
    step: 0,
  });

  constructor() {}

  public executeFieldWorkClosureStatistics(fieldWorkId: string) {
    this.fieldWorkStatistics.set({
      ...this.fieldWorkStatistics(),
      loading: true,
      status: '',
      step: 0,
    });

    this.httpClient
      .post<{
        jobId: string;
      }>(
        `${environment.base_url}/qms/fieldwork/${fieldWorkId}/run-test-job`,
        {}
      )
      .subscribe({
        next: ({ jobId }) =>
          this.loadFieldWorkClosureStatus(fieldWorkId, jobId),
        error: error => {
          console.error(
            $localize`Error fetching field work closure statistics:`,
            error
          );
          this.fieldWorkStatistics.update(prev => ({
            ...prev,
            loading: false,
          }));
        },
      });
  }

  public loadFieldWorkClosureStatus(fieldWorkId: string, jobId: string) {
    this.fieldWorkStatistics.set({
      ...this.fieldWorkStatistics(),
      loading: true,
      status: '',
      step: 0,
    });

    this.httpClient
      .get<{
        status: string;
      }>(`${environment.base_url}/qms/fieldwork/job/${jobId}/status`)
      .subscribe({
        next: ({ status }) => {
          if (status === 'RUNNING') {
            setTimeout(
              () => this.loadFieldWorkClosureStatus(fieldWorkId, jobId),
              5000
            );
            return;
          }
          this.loadFieldWorkClosureStatistics(fieldWorkId);
        },
        error: error => {
          console.error(
            $localize`Error fetching field work closure status:`,
            error
          );
          this.fieldWorkStatistics.update(prev => ({
            ...prev,
            loading: false,
          }));
        },
      });
  }

  public loadFieldWorkClosureStatistics(fieldWorkId: string) {
    this.fieldWorkStatistics.set({
      ...this.fieldWorkStatistics(),
      loading: true,
      status: '',
      step: 0,
    });

    this.httpClient
      .get<{
        statsDTO: FieldWorkClosureStatistic[];
      }>(`${environment.base_url}/qms/fieldwork/stats`)
      .subscribe({
        next: stats => {
          this.fieldWorkStatistics.update(prev => ({
            ...prev,
            stats: stats.statsDTO,
            loading: false,
            status: '',
          }));
        },
        error: error => {
          console.error(
            $localize`Error fetching field work closure statistics:`,
            error
          );
          this.fieldWorkStatistics.update(prev => ({
            ...prev,
            loading: false,
            status: 'ERROR',
          }));
        },
      });
  }

  public assignClosureEmail(emailId: number, fieldWorkId: string) {
    this.fieldWorkStatistics.update(prev => ({
      ...prev,
      loading: true,
      status: '',
    }));

    this.httpClient
      .patch(
        `${environment.base_url}/qms/fieldwork/${fieldWorkId}/email/template/close`,
        { EmailTemplateId: emailId }
      )
      .subscribe({
        next: () => {
          this.fieldWorkStatistics.update(prev => ({
            ...prev,
            loading: false,
            status: '',
            step: prev.step ? prev.step + 1 : 1,
          }));
        },
        error: error => {
          console.error(
            $localize`Error assigning closure email:`,
            error
          );
          this.fieldWorkStatistics.update(prev => ({
            ...prev,
            loading: false,
            status: 'ERROR',
          }));
        },
      });
  }

  public closeFieldWork(fieldWorkId: number) {
    const url = `${environment.base_url}/qms/fieldwork/close`;
    this.fieldWorkStatistics.update(prev => ({
      ...prev,
      loading: true,
      status: '',
    }));

    this.httpClient
      .post(url, {
        fieldWorkId,
        updatedUser: this.auth.getNameId(),
      })
      .subscribe({
        next: () => this.checkClosureStatus(fieldWorkId),
        error: error => {
          console.error(
            $localize`Error closing field work:`,
            error
          );
          this.matSnackBar.open(
            error.error?.message ||
              $localize`Error during field work closure`,
            $localize`Close`,
            { duration: 5000 }
          );
          this.fieldWorkStatistics.update(prev => ({
            ...prev,
            loading: false,
            status: 'ERROR',
          }));
        },
      });
  }

  private checkClosureStatus(fieldWorkId: number) {
    const url = `${environment.base_url}/qms/fieldwork/${fieldWorkId}/progress`;
    this.httpClient
      .get<{ progressDTO: FieldWorkClosureStatus[] }>(url)
      .subscribe({
        next: ({ progressDTO }) => {
          this.fieldWorkStatistics.update(prev => ({
            ...prev,
            stats: progressDTO,
            loading: false,
            status: 'CLOSED',
            step: prev.step ? prev.step + 1 : 1,
          }));
          this.matSnackBar.open(
            $localize`Field work closed successfully`,
            $localize`Close`,
            { duration: 5000 }
          );
        },
        error: error => {
          console.error(
            $localize`Error checking closure status:`,
            error
          );
          this.matSnackBar.open(
            error.message ||
              $localize`Error during field work closure`,
            $localize`Close`,
            { duration: 5000 }
          );
          this.fieldWorkStatistics.update(prev => ({
            ...prev,
            loading: false,
            status: 'ERROR',
          }));
        },
      });
  }
}
