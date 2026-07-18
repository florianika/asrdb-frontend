import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import {
  Observable,
  Subject,
  catchError,
  forkJoin,
  map,
  of,
  switchMap,
  takeUntil,
} from 'rxjs';
import { User } from '../../model/User.model';
import { AsyncOrchestrationService } from '../common/service/async-orchestration.service';

export interface PivotRow {
  municipality: string;
  [quality: string]: string | number;
}
export type StatisticTableData = {
  data: StatisticData[];
  isLoading: boolean;
  isDownloading: boolean;
  downloadRowId: number | null;
};
export type StatisticData = {
  id: number;
  referenceYear: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PENDING' | 'RUNNING';
  fileUrl: string;
  createdBy: string;
  createdAt: string;
  completedAt: string;
  remarks: string;
  lastUpdatedBy: string;
};
export type StatisticsForMunicipalityAndBuildingQuality = {
  data: Array<StatisticsForMunicipalityAndBuildingQualityData>;
  isLoading: boolean;
};
export type StatisticsForMunicipalityAndBuildingQualityData = {
  municipality: string;
  quality: string;
  totalBuildings: number;
};
export type StatisticsForMunicipalityAndDwellingQuality = {
  data: Array<StatisticsForMunicipalityAndDwellingQualityData>;
  isLoading: boolean;
};
export type StatisticsForMunicipalityAndDwellingQualityData = {
  municipality: string;
  quality: string;
  totalDwellings: number;
};
export type StatisticsGenerationStatusResponse = {
  downloadJobDTO: {
    id: number;
    referenceYear: number;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PENDING' | 'RUNNING';
    fileUrl: string;
    createdBy: string;
    createdAt: string;
    completedAt: string;
    remarks: string;
    lastUpdatedBy: string;
  };
};
export type UserDetailsResponse = {
  userDTO: User;
};
export type UserDetails = {
  rowId: number;
  userText: string;
};
export type RowUserDetails = {
  rowId: number;
  createUserText: string;
  updateUserText: string;
};

@Injectable()
export class StatisticExportService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private snapshotStatusPollingStop$ = new Subject<void>();
  private httpClient = inject(HttpClient);
  private matSnackBar = inject(MatSnackBar);
  private asyncOrchestration = inject(AsyncOrchestrationService);

  public statisticsTableData = signal<StatisticTableData>({
    data: [],
    isLoading: false,
    isDownloading: false,
    downloadRowId: null as number | null,
  });
  public statisticsForMunicipalityAndBuildingQuality =
    signal<StatisticsForMunicipalityAndBuildingQuality>({
      data: [],
      isLoading: false,
    });
  public statisticsForMunicipalityAndDwellingQuality =
    signal<StatisticsForMunicipalityAndDwellingQuality>({
      data: [],
      isLoading: false,
    });
  public statisticsGenerationData = signal({
    step: 0,
    generationStatus: null as
      'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PENDING' | 'RUNNING' | null,
    jobId: null as number | null,
  });

  ngOnDestroy(): void {
    this.cancelSnapshotGenerationPolling();
    this.destroy$.next();
    this.destroy$.complete();
    this.snapshotStatusPollingStop$.complete();
  }

  public cancelSnapshotGenerationPolling(resetGenerationData = false) {
    this.asyncOrchestration.resetPolling(this.snapshotStatusPollingStop$);
    if (resetGenerationData) {
      this.statisticsGenerationData.set({
        step: 0,
        generationStatus: null,
        jobId: null,
      });
    }
  }

  public getAllStatistics() {
    this.statisticsTableData.update(state => ({ ...state, isLoading: true }));
    this.httpClient
      .get<{
        downloadJobsDTO: StatisticData[];
      }>(environment.base_url + '/qms/buildings/annual-snapshots')
      .pipe(
        switchMap(({ downloadJobsDTO: rows }) => {
          if (rows.length === 0) {
            return of([] as StatisticData[]);
          }

          return forkJoin(
            rows.map(row =>
              this.getUserDetailsRequest(
                row.createdBy,
                row.lastUpdatedBy,
                row.id
              )
            )
          ).pipe(
            map(userDetails => {
              const detailsByRow = new Map(
                userDetails.map(details => [details.rowId, details])
              );
              return rows.map(row => {
                const details = detailsByRow.get(row.id);
                return {
                  ...row,
                  createdBy: details?.createUserText ?? '',
                  lastUpdatedBy: details?.updateUserText ?? '',
                };
              });
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: data => {
          this.statisticsTableData.set({
            data,
            isLoading: false,
            isDownloading: false,
            downloadRowId: null,
          });
        },
        error: () => {
          this.matSnackBar.open(
            $localize`Error fetching statistics`,
            $localize`Close`,
            { duration: 3000 }
          );
          this.statisticsTableData.update(state => ({
            ...state,
            isLoading: false,
          }));
        },
      });
  }

  public downloadFile(fileUrl: string, rowId: number) {
    this.statisticsTableData.update(state => ({
      ...state,
      isDownloading: true,
      downloadRowId: rowId,
    }));
    const url = environment.base_url + fileUrl;
    this.httpClient.post(url, {}, { responseType: 'blob' }).subscribe({
      next: blob => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = fileUrl.split('/').pop() || $localize`download`;
        link.click();
        window.URL.revokeObjectURL(link.href);
        this.statisticsTableData.update(state => ({
          ...state,
          isDownloading: false,
          downloadRowId: null,
        }));
      },
      error: () => {
        this.matSnackBar.open(
          $localize`Error downloading file`,
          $localize`Ok`,
          { duration: 3000 }
        );
        this.statisticsTableData.update(state => ({
          ...state,
          isDownloading: false,
          downloadRowId: null,
        }));
      },
    });
  }

  public getStatisticsForMunicipalityAndBuildingQuality() {
    this.statisticsForMunicipalityAndBuildingQuality.update(state => ({
      ...state,
      isLoading: true,
    }));
    const url = environment.base_url + '/qms/buildings/bld-quality-stats';
    this.httpClient
      .get<{
        statsDTO: Array<StatisticsForMunicipalityAndBuildingQualityData>;
      }>(url)
      .subscribe({
        next: data => {
          this.statisticsForMunicipalityAndBuildingQuality.set({
            data: data.statsDTO,
            isLoading: false,
          });
        },
        error: () => {
          this.matSnackBar.open(
            $localize`Error fetching municipality and building quality statistics`,
            $localize`Ok`,
            { duration: 3000 }
          );
          this.statisticsForMunicipalityAndBuildingQuality.update(state => ({
            ...state,
            isLoading: false,
          }));
        },
      });
  }

  public getStatisticsForMunicipalityAndDwellingQuality() {
    this.statisticsForMunicipalityAndDwellingQuality.update(state => ({
      ...state,
      isLoading: true,
    }));
    const url = environment.base_url + '/qms/buildings/dwl-quality-stats';
    this.httpClient
      .get<{
        statsDTO: Array<StatisticsForMunicipalityAndDwellingQualityData>;
      }>(url)
      .subscribe({
        next: data => {
          this.statisticsForMunicipalityAndDwellingQuality.set({
            data: data.statsDTO,
            isLoading: false,
          });
        },
        error: () => {
          this.matSnackBar.open(
            $localize`Error fetching municipality and dwelling quality statistics`,
            $localize`Ok`,
            { duration: 3000 }
          );
          this.statisticsForMunicipalityAndDwellingQuality.update(state => ({
            ...state,
            isLoading: false,
          }));
        },
      });
  }

  public startDataSnapshotCreation(
    year: number,
    remarks: string,
    createdBy: string
  ) {
    this.cancelSnapshotGenerationPolling();
    const url = environment.base_url + '/qms/buildings/annual-snapshot';
    const request = { referenceYear: year, createdBy, remarks };
    this.httpClient.post<{ downloadJobId: number }>(url, request).subscribe({
      next: data => {
        this.statisticsGenerationData.update(state => ({
          ...state,
          jobId: data.downloadJobId,
          generationStatus: 'IN_PROGRESS',
        }));
        this.startSnapshotGenerationStatusPolling(data.downloadJobId);
        this.matSnackBar.open(
          $localize`Data snapshot generation started`,
          $localize`Ok`,
          { duration: 3000 }
        );
      },
      error: () => {
        this.matSnackBar.open(
          $localize`Error starting data snapshot generation`,
          $localize`Ok`,
          { duration: 3000 }
        );
      },
    });
  }

  public checkSnapshotGenerationStatus() {
    const jobId = this.statisticsGenerationData().jobId;
    if (jobId === null) {
      this.matSnackBar.open(
        $localize`No snapshot generation job in progress`,
        $localize`Close`,
        { duration: 3000 }
      );
      return;
    }
    this.startSnapshotGenerationStatusPolling(jobId);
  }

  private startSnapshotGenerationStatusPolling(jobId: number) {
    this.cancelSnapshotGenerationPolling();
    const url =
      environment.base_url + '/qms/buildings/annual-snapshot/' + jobId;

    this.asyncOrchestration
      .createPollingStream({
        destroy$: this.destroy$,
        stop$: this.snapshotStatusPollingStop$,
        request: () =>
          this.httpClient.get<StatisticsGenerationStatusResponse>(url),
        onError: () => {
          this.matSnackBar.open(
            $localize`Error checking snapshot generation status`,
            $localize`Close`,
            { duration: 3000 }
          );
          this.cancelSnapshotGenerationPolling();
        },
      })
      .subscribe({
        next: data => {
          const status = data.downloadJobDTO.status;
          this.statisticsGenerationData.update(state => ({
            ...state,
            generationStatus: status,
          }));

          if (status === 'COMPLETED' || status === 'FAILED') {
            this.cancelSnapshotGenerationPolling();
          }
        },
      });
  }

  public goToStep(step: number) {
    this.statisticsGenerationData.update(state => ({ ...state, step }));
  }

  public reset() {
    this.cancelSnapshotGenerationPolling(true);
    this.statisticsForMunicipalityAndDwellingQuality.set({
      data: [],
      isLoading: false,
    });
    this.statisticsForMunicipalityAndBuildingQuality.set({
      data: [],
      isLoading: false,
    });
    this.statisticsTableData.set({
      data: [],
      isLoading: true,
      isDownloading: false,
      downloadRowId: null,
    });
  }

  private getUserDetailsRequest(
    createUser: string,
    updateUser: string,
    rowId: number
  ) {
    return forkJoin({
      createUser: this.fetchUserDetails(createUser, rowId),
      updateUser: this.fetchUserDetails(updateUser, rowId),
    }).pipe(
      map(({ createUser: createDetails, updateUser: updateDetails }) => ({
        rowId,
        createUserText: createDetails.userText,
        updateUserText: updateDetails.userText,
      }))
    );
  }

  private fetchUserDetails(
    user: string,
    rowId: number
  ): Observable<UserDetails> {
    if (!user) return of({ rowId, userText: '' });
    return this.httpClient
      .get<UserDetailsResponse>(`${environment.base_url}/admin/users/${user}`)
      .pipe(
        map(response => {
          const userDetail = response.userDTO;
          return {
            rowId,
            userText:
              `${userDetail.name ?? ''} ${userDetail.lastName ?? ''}`.trim(),
          };
        }),
        catchError(() => of({ rowId, userText: '' }))
      );
  }
}
