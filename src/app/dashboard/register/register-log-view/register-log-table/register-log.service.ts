import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Log } from '../model/log';
import { environment } from 'src/environments/environment';
import {EntityType} from "../../../quality-management/quality-management-config";
import {AuthStateService} from "../../../../common/services/auth-state.service";

export const EXECUTING = 1;
export const NOT_EXECUTING = 2;

@Injectable()
export class RegisterLogService {
  private readonly LOGS_URL = '/qms/outputlogs/buildings/';
  private readonly EXECUTE_RULES = '/qms/check/buildings'; //TODO: Add correct URL

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

  constructor(private httpClient: HttpClient, private authState: AuthStateService) {
  }

  public loadLogs(buildingId: string) {
    this.isLoading.next(true);
    this.httpClient
      .get<{processOutputLogDTO: Log[]}>(environment.base_url + this.LOGS_URL + buildingId.replace('{', '').replace('}', ''))
      .subscribe({
        next: (data) => {
          // TODO: verify this
          // I am assuming that the processOutputLogDTO will hold all logs
          // This means that if processOutputLogDTO has more data than loadedLogs, then the process is not finished.
          // If the returned response has the same data as what is already loaded,
          // // I will assume that the process has finished.
          if (data.processOutputLogDTO.length !== this.loadedLogs.value.length) {
            setTimeout(() => {
              this.loadLogs(buildingId);
            }, 3000);
          } else {
            this.isExecuting.next(EXECUTING);
          }
          this.loadedLogs.next(data.processOutputLogDTO);
          this.isLoading.next(false);
        },
        error: (err) => {
          console.log(err);
          this.isLoading.next(false);
          this.isExecuting.next(NOT_EXECUTING);
        },
      });
  }

  public executeRules(buildingId: string) {
    const data = {
      BuildingIds: [buildingId.replace('{', '').replace('}', '')],
      ExecutionUser: this.authState.getNameId()
    }
    this.httpClient
      .post(environment.base_url + this.EXECUTE_RULES, JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .subscribe({
        next: (data) => {
          this.isExecuting.next(EXECUTING);
          this.loadLogs(buildingId)
        },
        error: (err) => {
          console.log(err);
          this.isExecuting.next(NOT_EXECUTING);
        },
      })
  }

  public getLogForVariable(entityType: EntityType, variable: string): Log | undefined {
    return this.loadedLogs.value.find(log => log.EntityType === entityType && log.Variable === variable);
  }

  public getAllLogs(entityType?: EntityType): Log[] {
    return this.loadedLogs.value.filter(log => {
      if (entityType) {
        return log.EntityType === entityType;
      }
      return true;
    });
  }
}
