import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  isDevMode,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import {
  Subject,
  catchError,
  merge,
  of as observableOf,
  switchMap,
  takeUntil,
} from 'rxjs';
import { Chip } from '../../../common/standalone-components/chip/chip.component';
import { CommonRegisterHelperService } from '../../common/service/common-helper.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  Street,
  StreetFilter,
  StreetFilterKey,
  StreetFilterOption,
  StreetFilterValues,
} from '../../register/model/street';
import { CommonStreetService } from '../../common/service/common-street.service';
import {
  AuthStateService,
  DEFAULT_MUNICIPALITY,
} from '../../../common/services/auth-state.service';
import { StreetManagementFormComponent } from '../street-management-form/street-management-form.component';
import { StreetManagementTableFilterComponent } from './street-management-table-filter/street-management-table-filter.component';
import { MUNICIPALITIES } from '../../../common/data/municipalities';
import { StreetManagementTableFilterService } from './street-management-table-filter.service';
import { StreetManagementTableSelectionService } from './street-management-table-selection.service';

const FILTER_KEY = 'streetManagementTableFilter';

type StreetQueryResponse = {
  count: number;
  data: {
    fields: Array<Record<string, unknown>>;
    features: Array<{ attributes: Street }>;
  };
};

@Component({
    selector: 'asrdb-street-management-table',
    templateUrl: './street-management-table.component.html',
    styleUrls: ['./street-management-table.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class StreetManagementTableComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private selectedStreets = new Set<string>();

  private columns = [
    'StrSelected',
    'StrMunicipality',
    'StrType',
    'StrNameCore',
    'StrNameFull',
    'StrAddressID',
    'StrEntranceCount',
  ];

  private readonly STR_FIELDS = [
    'GlobalID',
    'StrMunicipality',
    'StrType',
    'StrNameCore',
    'StrNameFull',
    'StrAddressID',
  ];
  private destroy$ = new Subject<void>();

  displayedColumns: string[] = this.columns.concat(['actions']);
  data: Street[] = [];
  fields: Array<Record<string, unknown>> = [];
  resultsLength = 0;
  isLoadingResults = false;
  streetEntranceMap: Map<string, number> = new Map<string, number>();

  private readonly defaultMunicipality =
    this.authState.getMunicipality() ?? DEFAULT_MUNICIPALITY;

  filterConfig: StreetFilter = {
    filter: this.streetFilterService.getDefaultFilterValues(
      this.defaultMunicipality
    ),
    options: {
      StrType: [],
      StrMunicipality: this.mapMunicipalitiesToOptions(MUNICIPALITIES),
    },
  };

  get filterChips(): Chip[] {
    return this.streetFilterService.buildFilterChips(
      this.filterConfig.filter,
      (column, value) => this.getValueFromStatus(column, value)
    );
  }

  constructor(
    private authState: AuthStateService,
    private commonStreetService: CommonStreetService,
    private commonBuildingRegisterHelper: CommonRegisterHelperService,
    private streetFilterService: StreetManagementTableFilterService,
    private streetSelectionService: StreetManagementTableSelectionService,
    private changeDetectorRef: ChangeDetectorRef,
    private matDialog: MatDialog,
    private matSnack: MatSnackBar
  ) {}

  ngOnInit() {
    try {
      const rawConfig = localStorage.getItem(FILTER_KEY);
      if (rawConfig) {
        const parsedConfig = JSON.parse(rawConfig) as
          | Partial<StreetFilter>
          | { filter?: Partial<StreetFilterValues> };
        this.filterConfig = {
          ...this.filterConfig,
          filter: this.streetFilterService.normalizeFilterValues(
            parsedConfig?.filter,
            this.defaultMunicipality
          ),
        };
      }
    } catch (e) {
      console.error(
        $localize`Error parsing filter from localStorage`,
        e
      );
    }

    this.loadStreets()
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          console.log(err);
          return observableOf(null);
        })
      )
      .subscribe(res => this.handleResponse(res));
  }

  ngAfterViewInit() {
    this.sort.sortChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => (this.paginator.pageIndex = 0));
    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.loadStreets())
      )
      .subscribe(res => this.handleResponse(res));
    this.sort.active = 'StrNameCore';
    this.sort.direction = 'desc';
    this.sort.sortChange.emit({
      active: this.sort.active,
      direction: this.sort.direction,
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getValueFromStatus(column: StreetFilterKey, code: string): string {
    if (column === 'StrMunicipality') {
      return String(this.getMunicipality(column, code));
    }
    return String(
      this.commonBuildingRegisterHelper.getValueFromStatus(
        this.fields,
        column,
        code
      )
    );
  }

  reload() {
    this.loadStreets()
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => this.handleResponse(res));
  }

  remove($event: Chip) {
    if (!this.isStreetFilterKey($event.column)) {
      return;
    }

    this.filterConfig = {
      ...this.filterConfig,
      filter: this.streetFilterService.removeFilterValue(
        this.filterConfig.filter,
        $event.column,
        $event.value
      ),
    };
    this.persistFilter();
    this.reload();
  }

  openFilter() {
    this.matDialog
      .open(StreetManagementTableFilterComponent, {
        data: JSON.parse(JSON.stringify(this.filterConfig)),
        width: '700px',
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((newFilterConfig: StreetFilter | null) =>
        this.handlePopupClose(newFilterConfig)
      );
  }

  addStreet() {
    this.matDialog
      .open(StreetManagementFormComponent, {
        data: {
          municipality:
            this.authState.getMunicipality() ?? DEFAULT_MUNICIPALITY,
        },
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.reload();
      });
  }

  editStreetDetails(globalId: string) {
    this.matDialog
      .open(StreetManagementFormComponent, {
        data: {
          id: globalId,
        },
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.reload();
      });
  }

  toggleSelected(globalId: string) {
    if (this.selectedStreets.has(globalId)) {
      this.selectedStreets.delete(globalId);
    } else {
      this.selectedStreets.add(globalId);
    }

    this.isLoadingResults = true;
    this.syncSelectedStreetsWithMap();
  }

  isSelected(globalId: string): boolean {
    return this.selectedStreets.has(globalId);
  }

  getEntranceCount(globalId: string): number {
    return this.streetEntranceMap.get(globalId) || 0;
  }

  private handlePopupClose(newFilterConfig: StreetFilter | null) {
    if (!newFilterConfig) {
      return;
    }

    this.filterConfig = {
      ...newFilterConfig,
      filter: this.streetFilterService.normalizeFilterValues(
        newFilterConfig.filter,
        this.defaultMunicipality
      ),
      options: {
        ...newFilterConfig.options,
        StrMunicipality: this.mapMunicipalitiesToOptions(MUNICIPALITIES),
      },
    };
    this.persistFilter();
    this.reload();
  }

  private loadStreets() {
    this.isLoadingResults = true;
    const filter = this.streetFilterService.createStreetQuery(
      this.filterConfig.filter,
      this.paginator?.pageIndex ?? 0,
      this.paginator?.pageSize ?? 10,
      this.STR_FIELDS,
      {
        active: this.sort?.active,
        direction: this.sort?.direction,
      }
    );

    return this.commonStreetService.getStreets(filter).pipe(
      catchError(err => {
        console.log(err);
        return observableOf(null);
      })
    );
  }

  private handleResponse(res: StreetQueryResponse | null) {
    if (isDevMode()) {
      console.log('Streets: ', res);
    }

    if (!res?.data?.features) {
      this.matSnack.open(
        $localize`Could not load result. Please try again`,
        $localize`Ok`,
        { duration: 3000 }
      );
      this.isLoadingResults = false;
      this.data = [];
      this.streetEntranceMap.clear();
      this.changeDetectorRef.markForCheck();
      return;
    }

    if (res.data.fields?.length) {
      this.fields = res.data.fields;
    }

    this.resultsLength = res.count;
    this.data = res.data.features.map(feature => feature.attributes);
    this.prepareFilter();
    this.syncSelectedStreetsWithMap();
    this.loadEntranceCountsForVisibleStreets();
  }

  private loadEntranceCountsForVisibleStreets() {
    const ids = this.data
      .map(street => street.GlobalID)
      .filter((globalId): globalId is string => !!globalId);

    this.streetSelectionService
      .loadEntranceCountByStreet(ids)
      .pipe(takeUntil(this.destroy$))
      .subscribe(counts => {
        this.streetEntranceMap = counts;
        this.changeDetectorRef.markForCheck();
      });
  }

  private syncSelectedStreetsWithMap() {
    const selectedIds = Array.from(this.selectedStreets);

    this.streetSelectionService
      .syncRegisterMapSelection(selectedIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.handleLoadFinish();
      });
  }

  private handleLoadFinish() {
    this.isLoadingResults = false;
    this.persistFilter();
    this.changeDetectorRef.markForCheck();
  }

  private prepareFilter() {
    const options = this.getStreetTypeOptions();
    this.filterConfig = {
      ...this.filterConfig,
      options: {
        StrType: options.length ? options : this.filterConfig.options.StrType,
        StrMunicipality: this.mapMunicipalitiesToOptions(MUNICIPALITIES),
      },
    };
  }

  private getStreetTypeOptions(): StreetFilterOption[] {
    const field = this.commonBuildingRegisterHelper.getField(
      this.fields,
      'StrType'
    ) as { domain?: { codedValues?: Array<{ name: string; code: number }> } };

    if (!field?.domain?.codedValues?.length) {
      return [];
    }

    return field.domain.codedValues.map(codeValue => ({
      name: codeValue.name,
      code: codeValue.code,
    }));
  }

  private getMunicipality(column: StreetFilterKey, code: number | string) {
    return this.commonBuildingRegisterHelper.getMunicipality(
      this.fields,
      column,
      code
    );
  }

  private persistFilter() {
    localStorage.setItem(
      FILTER_KEY,
      JSON.stringify({ filter: this.filterConfig.filter })
    );
  }

  private isStreetFilterKey(column: string): column is StreetFilterKey {
    return Object.prototype.hasOwnProperty.call(this.filterConfig.filter, column);
  }

  private mapMunicipalitiesToOptions(
    municipalities: ReadonlyArray<{ name: string; code: number }>
  ): StreetFilterOption[] {
    return municipalities.map(municipality => ({
      name: municipality.name,
      code: municipality.code,
    }));
  }
}
