import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  finalize,
  map,
  Observable,
  of,
  switchMap,
  tap,
  timer,
} from 'rxjs';
import { Log } from '../model/log';
import { EntityType } from '../../../quality-management/quality-management-config';
import { AuthStateService } from '../../../../common/services/auth-state.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonBuildingService } from '../../../common/service/common-building.service';
import { QmsApiClientService } from '../../../common/service/qms-api-client.service';
import {
  BUILDING_ENTITY,
  DWELLING_ENTITY,
  ENTRANCE_ENTITY,
} from '../../../../common/constants/common-constants';

export const EXECUTING = 1;
export const NOT_EXECUTING = 2;

type LogResponse = {
  processOutputLogDto: Log[];
};

type ExecuteRulesPayload = {
  BuildingIds: string[];
  ExecutionUser: string;
};

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
    private qmsApiClient: QmsApiClientService,
    private authState: AuthStateService,
    private matSnack: MatSnackBar
  ) {}

  public loadLogsAfterExecution(buildingId: string): Observable<Log[]> {
    const previousLength = this.loadedLogs.value.length;
    this.isLoading.next(true);
    return this.fetchLogs(buildingId).pipe(
      tap(logs => {
        this.loadedLogs.next(logs);
        this.isExecuting.next(
          logs.length !== previousLength ? EXECUTING : NOT_EXECUTING
        );
      }),
      switchMap(logs => {
        if (logs.length === previousLength) {
          return this.loadBuildingQuality(buildingId).pipe(map(() => logs));
        }
        return timer(3000).pipe(switchMap(() => this.loadLogs(buildingId)));
      }),
      catchError(err => {
        console.error(err);
        this.isExecuting.next(NOT_EXECUTING);
        return of(this.loadedLogs.value);
      }),
      finalize(() => this.isLoading.next(false))
    );
  }

  public loadLogs(buildingId: string): Observable<Log[]> {
    this.isLoading.next(true);
    return this.fetchLogs(buildingId).pipe(
      tap(logs => {
        this.loadedLogs.next(logs);
        this.isExecuting.next(NOT_EXECUTING);
      }),
      switchMap(logs =>
        this.loadBuildingQuality(buildingId).pipe(map(() => logs))
      ),
      catchError(err => {
        console.error(err);
        this.isExecuting.next(NOT_EXECUTING);
        return of(this.loadedLogs.value);
      }),
      finalize(() => this.isLoading.next(false))
    );
  }

  private fetchLogs(buildingId: string): Observable<Log[]> {
    return this.qmsApiClient
      .get<LogResponse>(this.LOGS_URL + this.cleanId(buildingId))
      .pipe(map(response => response.processOutputLogDto ?? []));
  }

  private loadBuildingQuality(buildingId: string): Observable<string> {
    return this.commonBuildingService.getBuildingQuality(buildingId).pipe(
      tap(quality => this.buildingQuality.next(quality ?? '')),
      map(quality => quality ?? ''),
      catchError(err => {
        console.error(err);
        this.buildingQuality.next('');
        return of('');
      })
    );
  }

  private cleanId(id: string): string {
    return id.replace('{', '').replace('}', '');
  }

  public executeRulesForMultipleBuildings(
    buildingIds: string[]
  ): Observable<void> {
    this.isExecuting.next(EXECUTING);
    const data: ExecuteRulesPayload = {
      BuildingIds: buildingIds.map(id => this.cleanId(id)),
      ExecutionUser: this.authState.getNameId() ?? '',
    };
    return this.qmsApiClient
      .postJson<ExecuteRulesPayload, void>(this.EXECUTE_RULES, data)
      .pipe(
        tap(() => {
          this.isExecuting.next(EXECUTING);
          this.matSnack.open(
            $localize`Started testing buildings data`,
            $localize`Ok`,
            { duration: 2000 }
          );
        }),
        map(() => void 0),
        catchError(err => {
          console.error(err);
          this.matSnack.open(
            $localize`Action could not be performed`,
            $localize`Ok`,
            { duration: 3000 }
          );
          this.isExecuting.next(NOT_EXECUTING);
          return of(void 0);
        })
      );
  }

  public executeRules(buildingId: string, loadLogs = true): Observable<void> {
    this.isExecuting.next(EXECUTING);
    const data: ExecuteRulesPayload = {
      BuildingIds: [this.cleanId(buildingId)],
      ExecutionUser: this.authState.getNameId() ?? '',
    };
    return this.qmsApiClient
      .postJson<ExecuteRulesPayload, void>(this.EXECUTE_RULES, data)
      .pipe(
        tap(() => this.isExecuting.next(EXECUTING)),
        switchMap(() => {
          if (loadLogs) {
            return this.loadLogsAfterExecution(buildingId).pipe(
              map(() => void 0)
            );
          }
          this.matSnack.open(
            $localize`Started testing building data`,
            $localize`Ok`,
            { duration: 2000 }
          );
          return of(void 0);
        }),
        catchError(err => {
          console.error(err);
          this.matSnack.open(
            $localize`Action could not be performed`,
            $localize`Ok`,
            { duration: 3000 }
          );
          this.isExecuting.next(NOT_EXECUTING);
          return of(void 0);
        })
      );
  }

  public resolveLog(logId: string, buildingId: string): Observable<void> {
    this.isResolving.next(true);
    return this.qmsApiClient.patch<void>(this.RESOLVE_LOG + logId, null).pipe(
      switchMap(() => this.executeRules(buildingId)),
      catchError(err => {
        this.matSnack.open(
          $localize`Action could not be performed`,
          $localize`Ok`,
          { duration: 3000 }
        );
        console.error(err);
        return of(void 0);
      }),
      finalize(() => this.isResolving.next(false))
    );
  }

  public unresolveLog(logId: string, buildingId: string): Observable<void> {
    this.isResolving.next(true);
    return this.qmsApiClient.patch<void>(this.UNRESOLVE_LOG + logId, null).pipe(
      switchMap(() => this.executeRules(buildingId)),
      catchError(err => {
        this.matSnack.open(
          $localize`Action could not be performed`,
          $localize`Ok`,
          { duration: 3000 }
        );
        console.error(err);
        return of(void 0);
      }),
      finalize(() => this.isResolving.next(false))
    );
  }

  public getLogForVariable(
    entityType: EntityType,
    variable: string,
    id?: string
  ): Log | undefined {
    if (!id) return undefined;
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
      if (entityType) return log.entityType === entityType;
      return true;
    });
  }
}
