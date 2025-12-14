import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {MatSnackBar} from "@angular/material/snack-bar";
import {environment} from "../../../environments/environment";

export interface PivotRow {
  municipality: string;
  [quality: string]: string | number;
}
export type StatisticTableData = {
  data: StatisticData[];
  isLoading: boolean;
  isDownloading: boolean;
}
export type StatisticData = {
  "id": number,
  "referenceYear": number,
  "status": "IN_PROGRESS" | "COMPLETED" | "FAILED" | "PENDING" | "RUNNING",
  "fileUrl": string,
  "createdBy": string,
  "createdAt": string,
  "completedAt": string,
  "remarks": string,
  "lastUpdatedBy": string
}
export type StatisticsForMunicipalityAndBuildingQuality = {
  data: Array<StatisticsForMunicipalityAndBuildingQualityData>,
  isLoading: boolean
}
export type StatisticsForMunicipalityAndBuildingQualityData = {
  "municipality": string,
  "quality": string,
  "totalBuildings": number
}
export type StatisticsForMunicipalityAndDwellingQuality = {
  data: Array<StatisticsForMunicipalityAndDwellingQualityData>,
  isLoading: boolean
}
export type StatisticsForMunicipalityAndDwellingQualityData = {
  "municipality": string,
  "quality": string,
  "totalDwellings": number
}
export type StatisticsGenerationStatusResponse = {
  downloadJobDTO: {
    "id": number,
    "referenceYear": number,
    "status": "IN_PROGRESS" | "COMPLETED" | "FAILED" | "PENDING" | "RUNNING",
    "fileUrl": string,
    "createdBy": string,
    "createdAt": string,
    "completedAt": string,
    "remarks": string,
    "lastUpdatedBy": string
  }
}

@Injectable({
  providedIn: 'root'
})
export class StatisticExportService {
  private httpClient = inject(HttpClient);
  private matSnackBar = inject(MatSnackBar);

  public statisticsTableData = signal<StatisticTableData>({
    data: [],
    isLoading: false,
    isDownloading: false,
  });
  public statisticsForMunicipalityAndBuildingQuality = signal<StatisticsForMunicipalityAndBuildingQuality>({
    data: [],
    isLoading: false,
  });
  public statisticsForMunicipalityAndDwellingQuality = signal<StatisticsForMunicipalityAndDwellingQuality>({
    data: [],
    isLoading: false,
  });
  public statisticsGenerationData = signal({
    step: 0,
    generationStatus: null as "IN_PROGRESS" | "COMPLETED" | "FAILED" | "PENDING" | "RUNNING" | null,
    jobId: null as number | null,
  });

  public getAllStatistics() {
    this.statisticsTableData.update(state => ({...state, isLoading: true}));
    this.httpClient.get<{ downloadJobsDTO: StatisticData[] }>(environment.base_url + '/qms/buildings/annual-snapshots').subscribe({
      next: (data) => {
        this.statisticsTableData.set({data: data.downloadJobsDTO, isLoading: false, isDownloading: false});
      },
      error: () => {
        this.matSnackBar.open('Error fetching statistics', 'Close', { duration: 3000 });
        this.statisticsTableData.update(state => ({...state, isLoading: false}));
      }
    });
  }

  public downloadFile(fileUrl: string) {
    this.statisticsTableData.update(state => ({...state, isDownloading: true}));
    const url = environment.base_url + fileUrl;
    this.httpClient.post(url, {}, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = fileUrl.split('/').pop() || 'download';
        link.click();
        window.URL.revokeObjectURL(link.href);
        this.statisticsTableData.update(state => ({...state, isDownloading: false}));
      },
      error: () => {
        this.matSnackBar.open('Error downloading file', 'Close', { duration: 3000 });
      }
    });
  }

  public getStatisticsForMunicipalityAndBuildingQuality() {
    this.statisticsForMunicipalityAndBuildingQuality.update(state => ({...state, isLoading: true}));
    const url = environment.base_url + "/qms/buildings/bld-quality-stats";
    this.httpClient.get<{ statsDTO: Array<StatisticsForMunicipalityAndBuildingQualityData> }>(url).subscribe({
      next: (data) => {
        this.statisticsForMunicipalityAndBuildingQuality.set({data: data.statsDTO, isLoading: false});
      },
      error: () => {
        this.matSnackBar.open('Error fetching municipality and building quality statistics', 'Close', { duration: 3000 });
        this.statisticsForMunicipalityAndBuildingQuality.update(state => ({...state, isLoading: false}));
      }
    });
  }

  public getStatisticsForMunicipalityAndDwellingQuality() {
    this.statisticsForMunicipalityAndDwellingQuality.update(state => ({...state, isLoading: true}));
    const url = environment.base_url + "/qms/buildings/dwl-quality-stats";
    this.httpClient.get<{ statsDTO: Array<StatisticsForMunicipalityAndDwellingQualityData> }>(url).subscribe({
      next: (data) => {
        this.statisticsForMunicipalityAndDwellingQuality.set({data: data.statsDTO, isLoading: false});
      },
      error: () => {
        this.matSnackBar.open('Error fetching municipality and dwelling quality statistics', 'Close', { duration: 3000 });
        this.statisticsForMunicipalityAndDwellingQuality.update(state => ({...state, isLoading: false}));
      }
    });
  }

  public startDataSnapshotCreation(year: number, remarks: string, createdBy: string) {
    const url = environment.base_url + '/qms/buildings/annual-snapshot';
    const request = {
      referenceYear: year,
      createdBy: createdBy,
      remarks: remarks,
    }
    this.httpClient.post<{ downloadJobId: number }>(url, request).subscribe({
      next: (data) => {
        this.statisticsGenerationData.update(state => ({...state, jobId: data.downloadJobId, generationStatus: "IN_PROGRESS"}));
        this.checkSnapshotGenerationStatus();
        this.matSnackBar.open('Data snapshot generation started', 'Close', { duration: 3000 });
      },
      error: () => {
        this.matSnackBar.open('Error starting data snapshot generation', 'Close', { duration: 3000 });
      }
    });
  }

  public checkSnapshotGenerationStatus() {
    if (this.statisticsGenerationData().jobId === null) {
      this.matSnackBar.open('No snapshot generation job in progress', 'Close', { duration: 3000 });
      return;
    }
    const url = environment.base_url + '/qms/buildings/annual-snapshot/' + this.statisticsGenerationData().jobId;
    this.httpClient.get<StatisticsGenerationStatusResponse>(url).subscribe({
      next: (data) => {
        this.statisticsGenerationData.update(state => ({...state, generationStatus: data.downloadJobDTO.status}));
        if (data.downloadJobDTO.status !== 'COMPLETED' && data.downloadJobDTO.status !== 'FAILED') {
          setTimeout(() => this.checkSnapshotGenerationStatus(), 5000);
        }
      },
      error: () => {
        this.matSnackBar.open('Error checking snapshot generation status', 'Close', { duration: 3000 });
      }
    });
  }

  public goToStep(step: number) {
    this.statisticsGenerationData.update(state => ({...state, step}));
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
    })
  }
}
