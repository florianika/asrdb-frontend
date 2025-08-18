import {Injectable, inject, signal} from '@angular/core';
import {HttpClient} from "@angular/common/http";

export type FieldWorkClosureStatistic = {
  "municipality": string,
  "quality": string,
  "review": string,
  "totalBuildings": number
};

export type FieldWorkClosureStatisticsResponse = {
  loading: boolean;
  stats: FieldWorkClosureStatistic[];
  status: string;
  step: number; // Optional step field to track progress
}

@Injectable({
  providedIn: 'root'
})
export class FieldWorkClosureService {
  private httpClient: HttpClient = inject<any>(HttpClient);

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
            status: 'SUCCESS'
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
            status: 'SUCCESS',
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
}
