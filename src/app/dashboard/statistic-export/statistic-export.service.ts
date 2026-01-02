import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { catchError, Observable, Observer, of, zip } from 'rxjs';
import { User } from '../../model/User.model';

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

@Injectable({
  providedIn: 'root',
})
export class StatisticExportService {
  private httpClient = inject(HttpClient);
  private matSnackBar = inject(MatSnackBar);

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
      | 'IN_PROGRESS'
      | 'COMPLETED'
      | 'FAILED'
      | 'PENDING'
      | 'RUNNING'
      | null,
    jobId: null as number | null,
  });

  public getAllStatistics() {
    this.statisticsTableData.update(state => ({ ...state, isLoading: true }));
    this.httpClient
      .get<{
        downloadJobsDTO: StatisticData[];
      }>(environment.base_url + '/qms/buildings/annual-snapshots')
      .subscribe({
        next: data => {
          const rows = data.downloadJobsDTO;
          const requests: Observable<RowUserDetails>[] = [];
          rows.forEach(row => {
            const request = this.getUserDetailsRequest(
              row.createdBy,
              row.lastUpdatedBy,
              row.id
            );
            requests.push(request);
          });
          zip(...requests).subscribe({
            next: (response: RowUserDetails[]) => {
              const rowUserDetailsMap = new Map<number, RowUserDetails>();
              response.forEach(rowDetails => {
                rowUserDetailsMap.set(rowDetails.rowId, rowDetails);
              });
              const enrichedRows = rows.map(row => {
                const userDetails = rowUserDetailsMap.get(row.id);
                return {
                  ...row,
                  createdBy: userDetails ? userDetails.createUserText : '',
                  lastUpdatedBy: userDetails ? userDetails.updateUserText : '',
                };
              });
              this.statisticsTableData.set({
                data: enrichedRows,
                isLoading: false,
                isDownloading: false,
                downloadRowId: null,
              });
            },
            error: () => {
              this.matSnackBar.open(
                $localize`Error fetching user details for statistics`,
                $localize`Close`,
                { duration: 3000 }
              );
              this.statisticsTableData.update(state => ({
                ...state,
                isLoading: false,
              }));
            },
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
        link.download =
          fileUrl.split('/').pop() ||
          $localize`download`;
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
    const url = environment.base_url + '/qms/buildings/annual-snapshot';
    const request = { referenceYear: year, createdBy, remarks };
    this.httpClient.post<{ downloadJobId: number }>(url, request).subscribe({
      next: data => {
        this.statisticsGenerationData.update(state => ({
          ...state,
          jobId: data.downloadJobId,
          generationStatus: 'IN_PROGRESS',
        }));
        this.checkSnapshotGenerationStatus();
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
    if (this.statisticsGenerationData().jobId === null) {
      this.matSnackBar.open(
        $localize`No snapshot generation job in progress`,
        $localize`Close`,
        { duration: 3000 }
      );
      return;
    }
    const url =
      environment.base_url +
      '/qms/buildings/annual-snapshot/' +
      this.statisticsGenerationData().jobId;
    this.httpClient.get<StatisticsGenerationStatusResponse>(url).subscribe({
      next: data => {
        this.statisticsGenerationData.update(state => ({
          ...state,
          generationStatus: data.downloadJobDTO.status,
        }));
        if (
          data.downloadJobDTO.status !== 'COMPLETED' &&
          data.downloadJobDTO.status !== 'FAILED'
        ) {
          setTimeout(() => this.checkSnapshotGenerationStatus(), 5000);
        }
      },
      error: () => {
        this.matSnackBar.open(
          $localize`Error checking snapshot generation status`,
          $localize`Close`,
          { duration: 3000 }
        );
      },
    });
  }

  public goToStep(step: number) {
    this.statisticsGenerationData.update(state => ({ ...state, step }));
  }

  public reset() {
    this.statisticsGenerationData.set({
      step: 0,
      generationStatus: null,
      jobId: null,
    });
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
    const requests: Observable<UserDetails>[] = [];
    const createUserDetailsRequest = this.fetchUserDetails(createUser, rowId);
    const updateUserDetailsRequest = this.fetchUserDetails(updateUser, rowId);
    requests.push(createUserDetailsRequest);
    requests.push(updateUserDetailsRequest);
    return new Observable<RowUserDetails>(observer => {
      zip(...requests).subscribe({
        next: (response: UserDetails[]) => {
          const createUserDetail = response[0];
          const updateUserDetail = response[1];
          observer.next({
            rowId,
            createUserText: createUserDetail.userText,
            updateUserText: updateUserDetail.userText,
          });
          observer.complete();
        },
        error: err => {
          console.error(err);
          observer.error(err);
        },
      });
    });
  }

  private fetchUserDetails(
    user: string,
    rowId: number
  ): Observable<UserDetails> {
    if (!user) return of({ rowId, userText: '' });
    return new Observable<UserDetails>((observer: Observer<any>) => {
      this.httpClient
        .get<UserDetailsResponse>(`${environment.base_url}/auth/users/${user}`)
        .pipe(
          catchError(error => {
            console.error('Error fetching user details:', error);
            return of(null);
          })
        )
        .subscribe({
          next: response => {
            const userDetail = response?.userDTO;
            const userText =
              `${userDetail?.name ?? ''} ${userDetail?.lastName ?? ''}`.trim();
            observer.next({ rowId, userText });
            observer.complete();
          },
        });
    });
  }
}
