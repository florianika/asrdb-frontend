import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Log } from '../model/log';
import { environment } from 'src/environments/environment';
import {EntityType} from "../../../quality-management/quality-management-config";
import {AuthStateService} from "../../../../common/services/auth-state.service";
import {MatSnackBar} from "@angular/material/snack-bar";

export const EXECUTING = 1;
export const NOT_EXECUTING = 2;

@Injectable()
export class RegisterLogService {
  private readonly LOGS_URL = '/qms/outputlogs/buildings/';
  private readonly EXECUTE_RULES = '/qms/check/buildings';
  private readonly RESOLVE_LOG = '/qms/outputlogs/resolve/';

  private loadedLogs = new BehaviorSubject<Log[]>([]);
  public get logs() {
    return this.loadedLogs.asObservable();
  }
  public get logsValue() {
    return this.loadedLogs.getValue();
  }

  private isLoading = new BehaviorSubject<boolean>(false);
  public get isLoadingResults() {
    return this.isLoading.asObservable();
  }

  private isResolving = new BehaviorSubject<boolean>(false);
  public get isResolvingLog() {
    return this.isResolving.asObservable();
  }

  private isExecuting = new BehaviorSubject<number | null>(null);
  public get isExecutingRules() {
    return this.isExecuting.asObservable();
  }

  constructor(
    private httpClient: HttpClient,
    private authState: AuthStateService,
    private matSnack: MatSnackBar) {
  }

  public loadLogs(buildingId: string) {
    this.isLoading.next(true);
    this.httpClient
      .get<{processOutputLogDto: Log[]}>(environment.base_url + this.LOGS_URL + buildingId.replace('{', '').replace('}', ''))
      .subscribe({
        next: (data) => {
          // TODO: verify this
          // I am assuming that the processOutputLogDTO will hold all logs
          // This means that if processOutputLogDTO has more data than loadedLogs, then the process is not finished.
          // If the returned response has the same data as what is already loaded,
          // // I will assume that the process has finished.
          if (data.processOutputLogDto.length !== this.loadedLogs.value.length) {
            setTimeout(() => {
              this.loadLogs(buildingId);
            }, 3000);
            this.isExecuting.next(EXECUTING);
          } else {
            this.isExecuting.next(NOT_EXECUTING);
          }
          this.loadedLogs.next(data.processOutputLogDto);
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
        next: () => {
          this.isExecuting.next(EXECUTING);
          this.loadLogs(buildingId)
        },
        error: (err) => {
          console.log(err);
          this.matSnack.open('Action could not be performed', 'Ok', {
            duration: 3000
          });
          this.isExecuting.next(NOT_EXECUTING);
        },
      })
  }

  public resolveLog(logId: string, buildingId: string) {
    this.isResolving.next(true);
    this.httpClient.patch(environment.base_url + this.RESOLVE_LOG + logId, null)
      .subscribe({
        next: () => {
          this.isResolving.next(false);
          this.loadLogs(buildingId);
        },
        error: (err) => {
          this.isResolving.next(false);
          this.matSnack.open('Action could not be performed', 'Ok', {
            duration: 3000
          });
          console.log(err);
        }
      })
  }

  public getLogForVariable(entityType: EntityType, variable: string): Log | undefined {
    return this.loadedLogs.value.find(log => log.entityType === entityType && log.variable === variable);
  }

  public getAllLogs(entityType?: EntityType): Log[] {
    return this.loadedLogs.value.filter(log => {
      if (entityType) {
        return log.entityType === entityType;
      }
      return true;
    });
  }
}
