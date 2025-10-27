import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Log } from '../model/log';
import { environment } from 'src/environments/environment';
import { EntityType } from '../../../quality-management/quality-management-config';
import { AuthStateService } from '../../../../common/services/auth-state.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonBuildingService } from '../../../common/service/common-building.service';
import { CommonEntranceService } from '../../../common/service/common-entrance.service';
import { CommonDwellingService } from '../../../common/service/common-dwellings.service';
import {
  BUILDING_ENTITY,
  DWELLING_ENTITY,
  ENTRANCE_ENTITY,
} from '../../../../common/constants/common-constants';

export const EXECUTING = 1;
export const NOT_EXECUTING = 2;

@Injectable()
export class RegisterLogService {
  private readonly LOGS_URL = '/qms/outputlogs/buildings/';
  private readonly EXECUTE_RULES = '/qms/check/buildings';
  private readonly RESOLVE_LOG = '/qms/outputlogs/resolve/';
  private readonly UNRESOLVE_LOG = '/qms/outputlogs/pend/';

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

  private buildingQuality = new BehaviorSubject<string>('');
  public get bldQuality() {
    return this.buildingQuality.asObservable();
  }

  constructor(
    private commonBuildingService: CommonBuildingService,
    private commonEntranceService: CommonEntranceService,
    private commonDwellingService: CommonDwellingService,
    private httpClient: HttpClient,
    private authState: AuthStateService,
    private matSnack: MatSnackBar
  ) {}

  public loadLogsAfterExecution(buildingId: string) {
    this.isLoading.next(true);
    this.httpClient
      .get<{
        processOutputLogDto: Log[];
      }>(
        environment.base_url +
        this.LOGS_URL +
        buildingId.replace('{', '').replace('}', '')
      )
      .subscribe({
        next: data => {
          if (
            data.processOutputLogDto.length !== this.loadedLogs.value.length
          ) {
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
        error: err => {
          console.log(err);
          this.isLoading.next(false);
          this.isExecuting.next(NOT_EXECUTING);
        },
      });
    this.loadBuildingQuality(buildingId);
  }

  public loadLogs(buildingId: string) {
    this.isLoading.next(true);
    this.httpClient
      .get<{
        processOutputLogDto: Log[];
      }>(
        environment.base_url +
          this.LOGS_URL +
          buildingId.replace('{', '').replace('}', '')
      )
      .subscribe({
        next: data => {
          this.loadedLogs.next(data.processOutputLogDto);
          this.isLoading.next(false);
          this.isExecuting.next(NOT_EXECUTING);
        },
        error: err => {
          console.log(err);
          this.isLoading.next(false);
          this.isExecuting.next(NOT_EXECUTING);
        },
      });
    this.loadBuildingQuality(buildingId);
  }

  private loadBuildingQuality(buildingId: string) {
    this.commonBuildingService.getBuildingQuality(buildingId).subscribe({
      next: quality => {
        this.buildingQuality.next(quality ?? '');
      },
      error: err => {
        console.error(err);
      },
    });
  }

  public executeRulesForMultipleBuildings(buildingIds: string[]) {
    this.isExecuting.next(EXECUTING);
    const data = {
      BuildingIds: buildingIds.map(buildingId =>
        buildingId.replace('{', '').replace('}', '')
      ),
      ExecutionUser: this.authState.getNameId(),
    };
    this.httpClient
      .post(environment.base_url + this.EXECUTE_RULES, JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .subscribe({
        next: () => {
          this.isExecuting.next(EXECUTING);
          this.matSnack.open('Started testing buildings data', 'Ok', {
            duration: 2000,
          });
        },
        error: err => {
          console.log(err);
          this.matSnack.open('Action could not be performed', 'Ok', {
            duration: 3000,
          });
          this.isExecuting.next(NOT_EXECUTING);
        },
      });
  }

  public executeRules(buildingId: string, loadLogs = true) {
    this.isExecuting.next(EXECUTING);
    const data = {
      BuildingIds: [buildingId.replace('{', '').replace('}', '')],
      ExecutionUser: this.authState.getNameId(),
    };
    this.httpClient
      .post(environment.base_url + this.EXECUTE_RULES, JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .subscribe({
        next: () => {
          this.isExecuting.next(EXECUTING);
          if (loadLogs) {
            this.loadLogsAfterExecution(buildingId);
          }
          if (!loadLogs) {
            this.matSnack.open('Started testing building data', 'Ok', {
              duration: 2000,
            });
          }
        },
        error: err => {
          console.log(err);
          this.matSnack.open('Action could not be performed', 'Ok', {
            duration: 3000,
          });
          this.isExecuting.next(NOT_EXECUTING);
        },
      });
  }

  public resolveLog(logId: string, buildingId: string) {
    this.isResolving.next(true);
    this.httpClient
      .patch(environment.base_url + this.RESOLVE_LOG + logId, null)
      .subscribe({
        next: () => {
          this.isResolving.next(false);
          this.executeRules(buildingId);
        },
        error: err => {
          this.isResolving.next(false);
          this.matSnack.open('Action could not be performed', 'Ok', {
            duration: 3000,
          });
          console.log(err);
        },
      });
  }

  public unresolveLog(logId: string, buildingId: string) {
    this.isResolving.next(true);
    this.httpClient
      .patch(environment.base_url + this.UNRESOLVE_LOG + logId, null)
      .subscribe({
        next: () => {
          this.isResolving.next(false);
          this.executeRules(buildingId);
        },
        error: err => {
          this.isResolving.next(false);
          this.matSnack.open('Action could not be performed', 'Ok', {
            duration: 3000,
          });
          console.log(err);
        },
      });
  }

  public getLogForVariable(
    entityType: EntityType,
    variable: string,
    id?: string
  ): Log | undefined {
    if (!id) {
      return undefined;
    }
    const cleanedID = id.replace('{', '').replace('}', '').toLowerCase();
    const matchID = (log: Log): boolean => {
      return entityType === BUILDING_ENTITY
        ? log.bldId === cleanedID
        : entityType === ENTRANCE_ENTITY
          ? log.entId === cleanedID
          : entityType === DWELLING_ENTITY
            ? log.dwlId === cleanedID
            : false;
    };
    return this.loadedLogs.value.find(
      log =>
        (log.qualityAction !== 'QUE' || log.qualityStatus === 'PENDING') &&
        log.entityType === entityType &&
        log.variable === variable &&
        matchID(log)
    );
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
