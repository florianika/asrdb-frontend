import {
  effect,
  Inject,
  inject,
  Injectable,
  isDevMode,
  LOCALE_ID,
} from '@angular/core';
import { Building } from '../model/building';
import { catchError, filter, of, skipWhile, Subject, take, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  NOT_EXECUTING,
  RegisterLogService,
} from '../register-log-view/register-log-table/register-log.service';
import { CommonRegisterHelperService } from '../../common/service/common-helper.service';
import { MatDialogRef } from '@angular/material/dialog';
import { RegisterViewDetailsStore } from './register-view-details.store';
import { RegisterViewDetailsMapper } from './register-view-details.mapper';
import { RegisterViewDetailsApiAdapter } from './register-view-details-api.adapter';
import { BUILDING_ENTITY } from '../../../common/constants/common-constants';

@Injectable()
export class RegisterViewDetailsService {
  private destroy$: Subject<void> = new Subject<void>();
  private executionRefreshTimer: ReturnType<typeof setTimeout> | null = null;

  private registerLogService = inject(RegisterLogService);
  private commonBuildingRegisterHelper = inject(CommonRegisterHelperService);
  private matSnack = inject(MatSnackBar);
  private store = inject(RegisterViewDetailsStore);
  private mapper = inject(RegisterViewDetailsMapper);
  private apiAdapter = inject(RegisterViewDetailsApiAdapter);

  public viewData = this.store.viewData;
  public viewStructures = this.store.viewStructures;

  constructor(@Inject(LOCALE_ID) private locale: string) {
    effect(
      () => {
        const building = this.viewData().building;
        const logs = this.viewData().logs;
        const structure = this.viewStructures().buildingStructure;
        const loading = this.viewData().isLoading;

        if (building && logs && structure && loading) {
          this.fillSections(building.GlobalID);
        }
      },
      { allowSignalWrites: true }
    );
  }

  public cleanup() {
    if (this.executionRefreshTimer) {
      clearTimeout(this.executionRefreshTimer);
      this.executionRefreshTimer = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$ = new Subject<void>();
  }

  public init(id: string) {
    this.store.resetForLoad();
    this.loadBuildingStructure();
    this.loadBuildingData(id);
    this.loadLogs(id);
  }

  public markAsUntested(id: string, entranceId?: string) {
    this.store.resetForLoad();
    this.resetEntranceStatus(id, entranceId);
  }

  public startExecution(id: string, callback?: () => void) {
    this.registerLogService
      .executeRules(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
    this.matSnack.open(
      $localize`Started execution of quality rules`,
      $localize`Ok`,
      { duration: 5000 }
    );
    this.store.patchViewData({
      isExecutingRules: true,
      buildingFields: [],
    });

    this.registerLogService.isExecutingRules
      .pipe(
        filter(value => value === NOT_EXECUTING),
        take(1),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        if (value !== NOT_EXECUTING) {
          return;
        }

        this.executionRefreshTimer = setTimeout(() => {
          this.executionRefreshTimer = null;
          this.matSnack.open(
            $localize`Execution of quality rules finished. Reloading logs!`,
            $localize`Ok`,
            { duration: 5000 }
          );

          if (callback) {
            callback();
            this.store.patchViewData({ isExecutingRules: false });
            return;
          }

          this.store.patchViewData({ isExecutingRules: false });
          this.init(id);
        }, 1000);
      });
  }

  public rejectReviewForBuilding(dialog: MatDialogRef<unknown>) {
    this.store.patchViewData({ isUpdatingFeature: true });
    const building = this.viewData().building;

    if (!building) {
      this.store.patchViewData({ isUpdatingFeature: false });
      this.matSnack.open(
        $localize`No building loaded. Cannot reject review.`,
        $localize`Ok`,
        { duration: 3000 }
      );
      return;
    }

    this.apiAdapter
      .updateBuildingReview(building, 5)
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          console.error('Error updating feature', err);
          this.store.patchViewData({ isUpdatingFeature: false });
          this.matSnack.open(
            $localize`Could not reject review. Please try again.`,
            $localize`Ok`,
            { duration: 3000 }
          );
          return of(null);
        })
      )
      .subscribe(response => {
        if (response) {
          if (isDevMode()) {
            console.log('Feature updated', response);
          }
          this.matSnack.open(
            $localize`Review reopened successfully`,
            $localize`Ok`,
            { duration: 3000 }
          );
          dialog.close();
          this.loadBuildingData(building.GlobalID);
        }
        this.store.patchViewData({ isUpdatingFeature: false });
      });
  }

  public approveReviewForBuilding(dialog: MatDialogRef<unknown>) {
    this.store.patchViewData({ isUpdatingFeature: true });
    const building = this.viewData().building;

    if (!building) {
      this.store.patchViewData({ isUpdatingFeature: false });
      this.matSnack.open(
        $localize`No building loaded. Cannot approve review.`,
        $localize`Ok`,
        { duration: 3000 }
      );
      return;
    }

    this.apiAdapter
      .updateBuildingReview(building, 2)
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          console.error('Error updating feature', err);
          this.store.patchViewData({ isUpdatingFeature: false });
          this.matSnack.open(
            $localize`Could not approve review. Please try again.`,
            $localize`Ok`,
            { duration: 3000 }
          );
          return of(null);
        })
      )
      .subscribe(response => {
        if (response) {
          if (isDevMode()) {
            console.log('Feature updated', response);
          }
          this.matSnack.open(
            $localize`Review approved successfully`,
            $localize`Ok`,
            { duration: 3000 }
          );
          dialog.close();
          this.loadBuildingData(building.GlobalID);
        }
        this.store.patchViewData({ isUpdatingFeature: false });
      });
  }

  getMunicipality(): string | number {
    const fields = this.viewData().buildingFields;
    const building = this.viewData().building;
    if (!fields || !building) {
      return '';
    }

    return this.commonBuildingRegisterHelper.getMunicipality(
      fields,
      'BldMunicipality',
      building.BldMunicipality
    );
  }

  getValueFromStatus(column: keyof Building): string {
    const fields = this.viewData().buildingFields;
    const building = this.viewData().building;
    if (!fields || !building) {
      return '';
    }

    const value = this.commonBuildingRegisterHelper.getValueFromStatus(
      fields,
      column,
      building[column]
    );
    return String(value ?? '');
  }

  private loadBuildingData(id: string) {
    this.store.patchViewData({ isLoading: true });

    this.apiAdapter
      .loadBuildingData(id)
      .pipe(
        catchError(err => {
          console.log(err);
          this.matSnack.open(
            $localize`Could not load building. Please try again.`,
            $localize`Ok`,
            { duration: 3000 }
          );
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(response => {
        if (isDevMode()) {
          console.log('Data', response);
        }
        if (!response) {
          this.matSnack.open(
            $localize`Could not load result. Please try again`,
            $localize`Ok`,
            { duration: 3000 }
          );
          this.store.patchViewData({ isLoading: false });
          return;
        }

        const { building, fields } = this.mapper.mapBuildingDataResponse(
          response
        );

        this.store.patchViewData({
          building,
          buildingFields: fields,
        });
      });
  }

  private loadLogs(id: string) {
    this.registerLogService.isLoadingResults
      .pipe(
        skipWhile(isLoadingResult => !isLoadingResult),
        filter(isLoadingResult => !isLoadingResult),
        take(1),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.store.patchViewData({ logs: this.registerLogService.logsValue });
      });

    this.apiAdapter
      .loadLogs(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  private loadBuildingStructure() {
    this.apiAdapter
      .loadBuildingStructure()
      .pipe(takeUntil(this.destroy$))
      .subscribe(structure => {
        const mappedStructure = this.mapper.buildBuildingStructure(
          structure,
          this.locale as 'en' | 'sq'
        );
        this.store.patchViewStructures({ buildingStructure: mappedStructure });
      });
  }

  private resetBuildingStatus(id: string) {
    this.apiAdapter.resetBuildingStatus(id, () => setTimeout(() => this.init(id), 500));
  }

  private resetEntranceStatus(id: string, entranceId?: string) {
    if (entranceId) {
      this.apiAdapter.resetEntranceStatus(entranceId, () =>
        this.resetBuildingStatus(id)
      );
      return;
    }
    this.resetBuildingStatus(id);
  }

  private fillSections(id: string) {
    this.mapper.fillSections(
      this.viewStructures().buildingStructure,
      id,
      this.locale as 'en' | 'sq',
      propName => this.getDisplayValue(propName),
      (variable, logId) =>
        this.registerLogService.getLogForVariable(BUILDING_ENTITY, variable, logId)
    );
    this.store.patchViewData({ isLoading: false });
  }

  private getDisplayValue(propName: keyof Building): string {
    if (propName === 'BldMunicipality') {
      return String(this.getMunicipality());
    }
    return this.getValueFromStatus(propName);
  }
}
