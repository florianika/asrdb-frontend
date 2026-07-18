import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  isDevMode,
  OnDestroy,
} from '@angular/core';
import { AuthStateService } from 'src/app/common/services/auth-state.service';
import { Chip } from '../../common/standalone-components/chip/chip.component';
import { BuildingFilter } from '../register/model/building';
import {
  FILTER_REGISTER,
  RegisterFilterService,
} from '../register/register-table-view/register-filter.service';
import { CommonRegisterHelperService } from '../common/service/common-helper.service';
import { CommonBuildingService } from '../common/service/common-building.service';
import { catchError, of, Subject, takeUntil } from 'rxjs';
import { RegisterFilterComponent } from '../common/components/register-filter/register-filter.component';
import { MatDialog } from '@angular/material/dialog';
import { QueryFilter } from '../register/model/query-filter';
import { FilterHelper } from '../common/helper/filter-helper';
import { FieldWorkService } from '../field-work/field-work.service';
import { Router } from '@angular/router';
import { LoggerService } from '../../common/services/logger.service';

@Component({
  selector: 'asrdb-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class OverviewComponent implements OnDestroy {
  private destroy = new Subject();
  private lastCanBeClosedCheckFieldWorkId: number | null = null;
  public fields = [];
  public filterObservable = this.registerFilterService.filterObservable;
  public fieldWorkState = this.fieldWorkService.fieldWorkState;
  public fieldWorkCanBeClosed = this.fieldWorkService.canBeClosed;

  constructor(
    private authState: AuthStateService,
    private registerFilterService: RegisterFilterService,
    private commonBuildingService: CommonBuildingService,
    private commonBuildingRegisterHelper: CommonRegisterHelperService,
    private matDialog: MatDialog,
    private filterHelper: FilterHelper,
    private changeDetectionRef: ChangeDetectorRef,
    private fieldWorkService: FieldWorkService,
    private router: Router,
    private logger: LoggerService
  ) {
    this.commonBuildingService
      .getAttributesMetadata()
      .pipe(takeUntil(this.destroy))
      .subscribe(fields => {
        this.fields = fields;
        filterHelper.init(fields);
        registerFilterService.prepareFilter(fields);
        this.changeDetectionRef.detectChanges();
      });

    this.registerFilterService.filterObservable.subscribe(() => {
      this.reload();
    });

    this.fieldWorkService.getActiveFieldWork();

    effect(() => {
      const fieldWorkId =
        this.fieldWorkState().activeFieldWork?.fieldWorkId ?? null;
      if (!fieldWorkId) {
        this.lastCanBeClosedCheckFieldWorkId = null;
        return;
      }
      if (this.lastCanBeClosedCheckFieldWorkId === fieldWorkId) {
        return;
      }
      this.lastCanBeClosedCheckFieldWorkId = fieldWorkId;
      this.fieldWorkService.canFieldWorkBeClosed(fieldWorkId);
    });
  }

  ngOnDestroy() {
    this.destroy.next(true);
    this.destroy.complete();
  }

  get user() {
    return this.authState.getFullName();
  }

  getFilterChips(filters: BuildingFilter): Chip[] {
    return Object.entries(filters.filter)
      .filter(([, value]) => {
        return Array.isArray(value) ? value.length : !!value;
      })
      .reduce(this.filterHelper.getFilterChipStructure, [] as Chip[]);
  }

  openFilter() {
    this.matDialog
      .open(RegisterFilterComponent, {
        data: JSON.parse(
          JSON.stringify(this.registerFilterService.getFilter())
        ),
        width: '700px',
      })
      .afterClosed()
      .subscribe((newFilterConfig: BuildingFilter | null) =>
        this.handlePopupClose(newFilterConfig)
      );
  }

  remove($event: Chip) {
    const filterCopy = this.filterHelper.removeFilterValue(
      $event,
      this.registerFilterService.getFilter()
    );
    this.registerFilterService.updateFilter(filterCopy, FILTER_REGISTER);
  }

  getValueFromStatus(column: string, code: string | string[]) {
    if (Array.isArray(code)) {
      return code.map(c =>
        this.commonBuildingRegisterHelper.getValueFromStatus(
          this.fields,
          column,
          c
        )
      );
    }
    if (column === 'BldMunicipality') {
      return this.getMunicipality(column, code);
    }
    return this.commonBuildingRegisterHelper.getValueFromStatus(
      this.fields,
      column,
      code
    );
  }

  getMunicipality(column: string, code: number | string) {
    return this.commonBuildingRegisterHelper.getMunicipality(
      this.fields,
      column,
      code
    );
  }

  closeFieldWork() {
    void this.router.navigate(['/dashboard/field-work'], {
      queryParams: {
        action: 'close',
        fieldWorkId: this.fieldWorkState().activeFieldWork?.fieldWorkId,
      },
    });
  }

  private reload() {
    this.loadBuildings()
      .pipe(takeUntil(this.destroy))
      .subscribe(res => this.handleResponse(res));
  }

  private loadBuildings() {
    const filter = {
      where: this.registerFilterService.prepareWhereCase(),
    } as Partial<QueryFilter>;
    return this.commonBuildingService.getBuildingData(filter).pipe(
      catchError(err => {
        this.logger.error('Could not load overview statistics', err);
        return of(null);
      })
    );
  }

  private handleResponse(res: any) {
    if (isDevMode()) {
      this.logger.debug('Overview statistics loaded', { result: res });
    }
    if (!res) {
      return;
    }
    this.registerFilterService.updateGlobalIds(res.globalIds);
    this.changeDetectionRef.markForCheck();
  }

  private handlePopupClose(newFilterConfig: BuildingFilter | null) {
    if (newFilterConfig) {
      this.registerFilterService.updateFilter(newFilterConfig, FILTER_REGISTER);
    }
  }
}
