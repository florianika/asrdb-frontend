import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Log } from '../model/log';
import { environment } from 'src/environments/environment';

@Injectable()
export class RegisterLogService {
  private readonly LOGS_URL = '/qms/outputlogs/buildings/';
  private readonly EXECUTION_STATUS_URL = '/qms/outputlogs/buildings/'; //TODO: Add correct URL

  private loadedLogs = new BehaviorSubject<Log[]>([]);
  public get logs() {
    return this.loadedLogs.asObservable();
  }

  private isLoading = new BehaviorSubject<boolean>(false);
  public get isLoadingResults() {
    return this.isLoading.asObservable();
  }

  private isExecuting = new BehaviorSubject<number | null>(null);
  public get isExecutingRules() {
    return this.isExecuting.asObservable();
  }

  constructor(private httpClient: HttpClient) {

  }

  public getExecutionStatus(buildingId: string) {
    this.httpClient
      .get<boolean>(environment.base_url + this.EXECUTION_STATUS_URL + buildingId.replace('{', '').replace('}', ''))
      .subscribe({
        next: (status) => {
          // TODO: Remove this
          const s = Math.ceil(Math.random() + 0.5);


          // End of TODO
          this.isExecuting.next(s);
        },
        error: (err) => {
          console.log(err);
          this.isExecuting.next(0);
        },
      });
  }

  public loadLogs(buildingId: string) {
    this.isLoading.next(true);
    this.httpClient
      .get<{processOutputLogDTO: Log[]}>(environment.base_url + this.LOGS_URL + buildingId.replace('{', '').replace('}', ''))
      .subscribe({
        next: (data) => {
          this.loadedLogs.next(data.processOutputLogDTO);
          this.isLoading.next(false);
        },
        error: (err) => {
          console.log(err);
          this.isLoading.next(false);
        },
      });
  }
}
