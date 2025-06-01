import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  isDevMode,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import {
  catchError,
  merge,
  of as observableOf,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import { Chip } from '../../../common/standalone-components/chip/chip.component';
import { CommonRegisterHelperService } from '../../common/service/common-helper.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { QueryFilter } from '../../register/model/query-filter';
import { StreetFilter } from '../../register/model/street';
import { CommonStreetService } from '../../common/service/common-street.service';
import {
  AuthStateService,
  DEFAULT_MUNICIPALITY,
} from '../../../common/services/auth-state.service';
import { StreetManagementFormComponent } from '../street-management-form/street-management-form.component';
import { StreetManagementTableFilterComponent } from './street-management-table-filter/street-management-table-filter.component';
import {MUNICIPALITIES, Municipality} from '../../../common/data/municipalities';

const FILTER_KEY = 'streetManagementTableFilter';

@Component({
  selector: 'asrdb-street-management-table',
  templateUrl: './street-management-table.component.html',
  styleUrls: ['./street-management-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreetManagementTableComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private columns = [
    'GlobalID',
    'StrMunicipality',
    'StrType',
    'StrNameCore',
    'StrNameFull',
    'StrAddressID',
  ];

  private readonly STR_FIELDS = [
    'GlobalID',
    'StrMunicipality',
    'StrType',
    'StrNameCore',
    'StrNameFull',
    'StrAddressID',
  ];
  private destroy$ = new Subject();

  displayedColumns: string[] = this.columns.concat(['actions']);
  data: any[] = [];
  fields: any[] = [];
  resultsLength = 0;
  isLoadingResults = false;

  filterConfig: StreetFilter = {
    filter: {
      StrMunicipality: this.authState.getMunicipality() ?? DEFAULT_MUNICIPALITY,
      StrType: '',
      StrNameCore: '',
      StrNameFull: '',
      GlobalID: '',
      StrAddressID: '',
    },
    options: {
      StrType: [] as any[],
      StrMunicipality: MUNICIPALITIES as any[],
    },
  };

  get filterChips(): Chip[] {
    return Object.entries(this.filterConfig.filter)
      .filter(([, value]) => !!value)
      .map(([key, value]): any => ({
        column: key,
        value: this.getValueFromStatus(key, value.toString()),
      }));
  }

  constructor(
    private authState: AuthStateService,
    private commonStreetService: CommonStreetService,
    private commonBuildingRegisterHelper: CommonRegisterHelperService,
    private changeDetectorRef: ChangeDetectorRef,
    private viewContainerRef: ViewContainerRef,
    private matDialog: MatDialog,
    private matSnack: MatSnackBar
  ) {}

  ngOnInit() {
    try {
      const filter = localStorage.getItem(FILTER_KEY);
      if (filter) {
        this.filterConfig = JSON.parse(filter);
      }
    } catch (e) {
      console.error('Error parsing filter from localStorage', e);
    }
    this.loadStreetsForMunicipality(
      this.authState.getMunicipality() ?? DEFAULT_MUNICIPALITY
    );
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
    // If the user changes the sort order, reset back to the first page.
    this.sort.sortChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => (this.paginator.pageIndex = 0));
    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.loadStreets())
      )
      .subscribe(res => this.handleResponse(res));
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  getValueFromStatus(column: string, code: string) {
    if (column === 'StrMunicipality') {
      return this.getMunicipality(column, code);
    }
    return this.commonBuildingRegisterHelper.getValueFromStatus(
      this.fields,
      column,
      code
    );
  }

  reload() {
    this.loadStreets()
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => this.handleResponse(res));
  }

  remove($event: Chip) {
    (this.filterConfig.filter as any)[$event.column] = '';
    localStorage.setItem(FILTER_KEY, JSON.stringify(this.filterConfig));
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

  private handlePopupClose(newFilterConfig: StreetFilter | null) {
    if (newFilterConfig) {
      localStorage.setItem(FILTER_KEY, JSON.stringify(newFilterConfig));
      this.filterConfig = newFilterConfig;
      this.reload();
    }
  }

  private prepareWhereCase() {
    const conditions: string[] = [];
    Object.entries(this.filterConfig.filter)
      .filter(([, value]: any) => !!value)
      .map(([key, value]: any) => ({ column: key, value }) as Chip)
      .forEach((filter: any) => {
        if (filter.column === 'GlobalID') {
          conditions.push(filter.column + ' in ' + filter.value);
        } else if (
          filter.column === 'StrNameCore' ||
          filter.column === 'StrNameFull'
        ) {
          conditions.push(filter.column + ' like ' + `'%${filter.value}%'`);
        } else if (filter.column === 'StrType') {
          conditions.push(
            filter.column + '=' + Number.parseInt(filter.value, 10)
          );
        } else {
          conditions.push(
            filter.column + '=' + this.getWhereConditionValue(filter.value)
          );
        }
      });
    return conditions.length ? conditions.join(' and ') : '1=1';
  }

  private getWhereConditionValue(value: string | number) {
    return typeof value == 'number' ? value : `'${value}'`;
  }

  private loadStreets() {
    this.isLoadingResults = true;
    const filter = {
      start:
        (this.paginator?.pageIndex ?? 0) * (this.paginator?.pageSize ?? 10),
      num: this.paginator?.pageSize ?? 10,
      outFields: this.STR_FIELDS,
      where: this.prepareWhereCase(),
      orderByFields: this.sort?.active
        ? [this.sort.active + ' ' + this.sort.direction.toUpperCase()]
        : undefined,
    } as Partial<QueryFilter>;
    return this.commonStreetService.getStreets(filter).pipe(
      catchError(err => {
        console.log(err);
        return observableOf(null);
      })
    );
  }

  private handleResponse(res: any) {
    if (isDevMode()) {
      console.log('Streets: ', res);
    }
    if (!res) {
      this.matSnack.open('Could not load result. Please try again', 'Ok', {
        duration: 3000,
      });
      this.isLoadingResults = false;
      this.data = [];
      this.changeDetectorRef.markForCheck();
      return;
    }
    if (res.data.fields.length) {
      this.fields = res.data.fields;
    }
    this.resultsLength = res.count;
    this.data = res.data.features.map((feature: {attributes: object}) => feature.attributes);
    this.isLoadingResults = false;
    this.prepareFilter();
    this.changeDetectorRef.markForCheck();
  }

  private prepareFilter() {
    this.filterConfig = {
      ...this.filterConfig,
      options: {
        StrType: this.getOptions('StrType').length
          ? this.getOptions('StrType')
          : this.filterConfig.options.StrType,
        StrMunicipality: MUNICIPALITIES as Municipality[],
      },
    };
  }

  private getOptions(column: string) {
    const field = this.commonBuildingRegisterHelper.getField(
      this.fields,
      column
    );
    if (!field) {
      return [];
    }
    return field.domain?.codedValues?.map(
      (codeValue: { name: string; code: string }) => {
        return {
          name: codeValue.name,
          code: codeValue.code,
        };
      }
    );
  }

  private getMunicipality(column: string, code: number | string) {
    return this.commonBuildingRegisterHelper.getMunicipality(
      this.fields,
      column,
      code
    );
  }

  private loadStreetsForMunicipality(municipality: number) {
    this.filterConfig.filter.StrMunicipality = municipality;
  }
}
