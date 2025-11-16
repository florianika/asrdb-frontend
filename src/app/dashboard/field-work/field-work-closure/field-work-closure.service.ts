import {Injectable, inject, signal} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../../environments/environment";
import {AuthStateService} from "../../../common/services/auth-state.service";
import {MatSnackBar} from "@angular/material/snack-bar";

export type FieldWorkClosureStatistic = {
  "municipality": string,
  "quality": string,
  "review": string,
  "totalBuildings": number
};

export type FieldWorkClosureStatisticsResponse = {
  loading: boolean;
  stats: FieldWorkClosureStatistic[] | FieldWorkClosureStatus[];
  status: string;
  step: number; // Optional step field to track progress
};

export type FieldWorkClosureStatus = {
  "municipalityCode": number,
  "municipalityName": string,
  "approvedBuildings": number,
  "fieldworkBuildings": number,
  "progressPercent": number,
  "status": string
}


@Injectable({
  providedIn: 'root'
})
export class FieldWorkClosureService {
  private httpClient: HttpClient = inject<any>(HttpClient);
  private auth = inject(AuthStateService);
  private matSnackBar = inject(MatSnackBar)

  public fieldWorkStatistics = signal<FieldWorkClosureStatisticsResponse>({
    loading: false,
    stats: [],
    status: '',
    step: 0
  });

  constructor() { }

  public executeFieldWorkClosureStatistics(fieldWorkId: string) {
    this.fieldWorkStatistics.set({
      ...this.fieldWorkStatistics(),
      loading: true,
      status: '',
      step: 0
    });

    this.httpClient.post<{jobId: string}>(`/qms/fieldwork/${fieldWorkId}/run-test-job`, {})
      .subscribe({
        next: ({jobId}) => {
          this.loadFieldWorkClosureStatus(fieldWorkId, jobId);
        },
        error: (error: any) => {
          console.error('Error fetching field work closure statistics:', error);
          this.fieldWorkStatistics.update((prev) => ({
            ...prev,
            loading: false,
          }));
        }
      });
  }

  public loadFieldWorkClosureStatus(fieldWorkId: string, jobId: string) {
    this.fieldWorkStatistics.set({
      ...this.fieldWorkStatistics(),
      loading: true,
      status: '',
      step: 0
    });

    this.httpClient.get<{status: string}>(`/qms/fieldwork/job/${jobId}/status`)
      .subscribe({
        next: ({status}) => {
          console.log(status);
          if (status === 'RUNNING') {
            setTimeout(() => this.loadFieldWorkClosureStatus(fieldWorkId, jobId), 5000);
            return;
          }
          this.loadFieldWorkClosureStatistics(fieldWorkId);
        },
        error: (error: any) => {
          console.error('Error fetching field work closure status:', error);
          this.fieldWorkStatistics.update((prev) => ({
            ...prev,
            loading: false,
          }));
        }
      });
  }

  public loadFieldWorkClosureStatistics(fieldWorkId: string) {
    this.fieldWorkStatistics.set({
      ...this.fieldWorkStatistics(),
      loading: true,
      status: '',
      step: 0
    });

    this.httpClient.get<{ statsDTO: FieldWorkClosureStatistic[] }>(`/qms/fieldwork/stats`)
      .subscribe({
        next: (stats) => {
          console.log(stats);
          this.fieldWorkStatistics.update((prev) => ({
            ...prev,
            stats: stats.statsDTO,
            loading: false,
            status: ''
          }));
        },
        error: (error: any) => {
          console.error('Error fetching field work closure statistics:', error);
          this.fieldWorkStatistics.update((prev) => ({
            ...prev,
            loading: false,
            status: 'ERROR'
          }));
        }
      });
  }

  public assignClosureEmail(emailId: number, fieldWorkId: string) {
    this.fieldWorkStatistics.update((prev) => ({
      ...prev,
      loading: true,
      status: ''
    }));

    this.httpClient.patch(`/qms/fieldwork/${fieldWorkId}/email/template/close`, {EmailTemplateId: emailId})
      .subscribe({
        next: () => {
          this.fieldWorkStatistics.update((prev) => ({
            ...prev,
            loading: false,
            status: '',
            step: prev.step ? prev.step + 1 : 1
          }));
        },
        error: (error: any) => {
          console.error('Error assigning closure email:', error);
          this.fieldWorkStatistics.update((prev) => ({
            ...prev,
            loading: false,
            status: 'ERROR'
          }));
        }
      });
  }

  public closeFieldWork(fieldWorkId: number) {
    const url = environment.base_url + '/qms/fieldwork/close';
    this.fieldWorkStatistics.update((prev) => ({
      ...prev,
      loading: true,
      status: ''
    }));
    this.httpClient.post(url, {
      fieldWorkId: fieldWorkId,
      updatedUser: this.auth.getNameId() // This should ideally be the logged-in user
    })
      .subscribe({
        next: () => {
          this.checkClosureStatus(fieldWorkId)
        },
        error: (error: any) => {
          console.error('Error closing field work:', error);
          this.matSnackBar.open(error.error?.message || 'Error during field work closure', 'Close', { duration: 5000 });
          this.fieldWorkStatistics.update((prev) => ({
            ...prev,
            loading: false,
            status: 'ERROR'
          }));
        }
      });
  }

  private checkClosureStatus(fieldWorkId: number) {
    const url = environment.base_url + '/qms/fieldwork/{id}/progress';
    this.httpClient.get<{progressDTO: FieldWorkClosureStatus[]}>(url.replace('{id}', fieldWorkId.toString()))
      .subscribe({
        next: ({progressDTO}) => {
          this.fieldWorkStatistics.update((prev) => ({
            ...prev,
            stats: progressDTO,
            loading: false,
            status: 'CLOSED',
            step: prev.step ? prev.step + 1 : 1
          }));
          this.matSnackBar.open('Field work closed successfully', 'Close', { duration: 5000 });
        },
        error: (error: any) => {
          console.error('Error checking closure status:', error);
          this.matSnackBar.open(error.message || 'Error during field work closure', 'Close', { duration: 5000 });
          this.fieldWorkStatistics.update((prev) => ({
            ...prev,
            loading: false,
            status: 'ERROR'
          }));
        }
      });
  }
}
