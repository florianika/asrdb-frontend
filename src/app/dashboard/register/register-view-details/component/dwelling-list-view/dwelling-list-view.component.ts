import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  Input,
  isDevMode,
  OnChanges,
  OnDestroy,
  OnInit, SimpleChanges,
  ViewChild, ViewContainerRef
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {catchError, merge, of as observableOf, Subject, switchMap, takeUntil} from 'rxjs';
import {Chip, ChipComponent} from 'src/app/common/standalone-components/chip/chip.component';
import {
  EntranceListViewFilterComponent
} from '../entrance-list-view/entrance-list-view-filter/entrance-list-view-filter.component';
import {CommonEntranceService} from '../../../service/common-entrance.service';
import {DwellingFilter} from '../../../model/dwelling';
import {QueryFilter} from '../../../model/query-filter';
import {CommonDwellingService} from '../../../service/common-dwellings.service';
import {CommonRegisterHelperService} from '../../../service/common-helper.service';
import {DwellingDetailsComponent} from './dwelling-details/dwelling-details.component';
import {
  DwellingDetailsFormComponent
} from '../../../register-form/dwelling-details-form/dwelling-details-form.component';
import {Entrance} from '../../../model/entrance';
import {RegisterLogService} from "../../../register-log-view/register-log-table/register-log.service";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatSnackBar, MatSnackBarModule} from "@angular/material/snack-bar";

@Component({
  selector: 'asrdb-dwelling-list-view',
  templateUrl: './dwelling-list-view.component.html',
  styleUrls: ['./dwelling-list-view.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CommonDwellingService, CommonEntranceService],
  imports: [
    MatIconModule,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatMenuModule,
    ChipComponent,
    MatProgressSpinnerModule,
    CommonModule,
    EntranceListViewFilterComponent,
    MatTooltipModule,
    MatSnackBarModule
  ]
})
export class DwellingListViewComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @Input() entranceId?: string;
  @Input() buildingNumber?: number;
  @Input() entrances: Entrance[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private columns = [
    'GlobalID',
    'StreetName',
    'BldNumber',
    'EntNumber',
    'DwlFloor',
    'DwlApartNumber',
    'DwlStatus',
    'DwlType',
    'DwlQuality'
  ];

  private readonly DWL_FIELDS = [
    'GlobalID',
    'DwlFloor',
    'DwlApartNumber',
    'DwlStatus',
    'DwlType',
    'DwlQuality'
  ];
  private subscriber = new Subject();

  displayedColumns: string[] = this.columns.concat(['actions']);
  data: any[] = [];
  fields: any[] = [];
  resultsLength = 0;
  isLoadingResults = false;
  streetName: string = '';
  entranceNumber: string = '';

  // TODO: Add correct filter
  filterConfig: DwellingFilter = {
    filter: {
      DwlFloor: 0,
      DwlApartNumber: 0,
      GlobalID: '',
      DwlStatus: '',
      DwlType: '',
      DwlEntranceID: ''
    },
    options: {
      DwlStatus: [] as any[],
      DwlType: [] as any[]
    }
  };

  get filterChips(): Chip[] {
    return Object
      .entries(this.filterConfig.filter)
      .filter(([, value]) => !!value)
      .map(([key, value]): any => ({ column: key, value: this.getValueFromStatus(key, value.toString()) }));
  }

  constructor(
    private commonDwellingBuildingService: CommonDwellingService,
    private commonEntranceBuildingService: CommonEntranceService,
    private commonBuildingRegisterHelper: CommonRegisterHelperService,
    private changeDetectorRef: ChangeDetectorRef,
    private registerLogService: RegisterLogService,
    private viewContainerRef: ViewContainerRef,
    private matDialog: MatDialog,
    private matSnack: MatSnackBar
    ) {
  }

  ngOnInit() {
    if (this.entranceId) {
      this.loadDwellingsForEntrances(this.entranceId);
      this.loadDwellings().pipe(
        takeUntil(this.subscriber),
        switchMap(() => this.loadDwellings()),
      ).subscribe((res) => this.handleResponse(res));
    } else {
      this.isLoadingResults = false;
    }
  }

  ngAfterViewInit() {
    // If the user changes the sort order, reset back to the first page.
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));
    if (this.entranceId) {
      merge(this.sort.sortChange, this.paginator.page)
        .pipe(
          takeUntil(this.subscriber),
          switchMap(() => this.loadDwellings()),
        )
        .subscribe((res) => this.handleResponse(res));
      return;
    }
    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        takeUntil(this.subscriber),
        switchMap(() => this.loadDwellings()),
      )
      .subscribe((res) => this.handleResponse(res));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entranceId'] && changes['entranceId'].currentValue !== changes['entranceId'].previousValue) {
      this.loadDwellingsForEntrances(changes['entranceId'].currentValue);
      this.loadDwellings().pipe(
        takeUntil(this.subscriber),
        switchMap(() => this.loadDwellings()),
      ).subscribe((res) => this.handleResponse(res));
      const entrance = this.entrances.find(e => e.GlobalID === changes['entranceId'].currentValue);
      this.streetName = entrance?.EntAddressID ?? 'Unknown';
      this.entranceNumber = entrance?.EntEntranceNumber?.toString() ?? 'Unknown';
    }
  }

  ngOnDestroy(): void {
    this.subscriber.next(true);
    this.subscriber.complete();
  }

  getValueFromStatus(column: string, code: string) {
    return this.commonBuildingRegisterHelper.getValueFromStatus(this.fields, column, code);
  }

  addDwelling() {
    this.matDialog.open(DwellingDetailsFormComponent, {
      data: {
        entrances: this.entrances,
        logs: this.registerLogService.getAllLogs('DWELLING'),
        entranceId: this.entranceId
      },
    }).afterClosed().subscribe(() => {
      this.reload();
    });
  }

  reload() {
    if (!this.filterConfig.filter.DwlEntranceID) {
      return;
    }
    this.loadDwellings().pipe(takeUntil(this.subscriber)).subscribe((res) => this.handleResponse(res));
  }

  remove($event: Chip) {
    (this.filterConfig.filter as any)[$event.column] = '';
    this.reload();
  }

  viewDwellingDetails(globalId: string) {
    this.matDialog.open(DwellingDetailsComponent, {
      data: {
        globalId,
        logs: this.registerLogService.getAllLogs('DWELLING'),
        streetName: this.streetName,
        buildingNumber: this.buildingNumber,
        entranceNumber: this.entranceNumber
      },
    });
  }

  editDwellingDetails(globalId: string) {
    this.matDialog.open(DwellingDetailsFormComponent, {
      data: {
        entrances: this.entrances,
        id: globalId,
        entranceId: this.entranceId,
        logs: this.registerLogService.getAllLogs('DWELLING')
      }
    }).afterClosed().subscribe(() => {
      this.reload();
    });
  }

  private prepareWhereCase() {
    const conditions: string[] = [];
    Object
      .entries(this.filterConfig.filter)
      .filter(([, value]: any) => !!value)
      .map(([key, value]: any) => ({ column: key, value } as Chip))
      .forEach((filter: any) => {
        if (filter.column === 'DwlEntranceID') {
          conditions.push(filter.column + ' in ' + filter.value);
        } else {
          conditions.push(filter.column + '=' + this.getWhereConditionValue(filter.value));
        }
      });
    return conditions.length ? conditions.join(' and ') : '1=1';
  }

  private getWhereConditionValue(value: string | number) {
    return (typeof value == 'number') ? value : `'${value}'`;
  }

  private loadDwellings() {
    this.isLoadingResults = true;
    const filter = {
      start: this.paginator.pageIndex * this.paginator.pageSize,
      num: this.paginator.pageSize,
      outFields: this.DWL_FIELDS,
      where: this.prepareWhereCase(),
      orderByFields: this.sort.active ? [this.sort.active + ' ' + this.sort.direction.toUpperCase()] : undefined
    } as Partial<QueryFilter>;
    return this.commonDwellingBuildingService.getDwellings(filter).pipe(catchError((err) => {
      console.log(err);
      return observableOf(null);
    }));
  }

  private async handleResponse(res: any) {
    if (isDevMode()) {
      console.log('Dwellings: ', res);
    }
    if (!res) {
      this.matSnack.open('Could not load result. Please try again', 'Ok', {duration: 3000});
      this.isLoadingResults = false;
      this.data = [];
      this.changeDetectorRef.markForCheck();
      return;
    }
    if (res.data.fields.length) {
      this.fields = res.data.fields;
    }
    this.resultsLength = res.count;
    this.data = res.data.features.map((feature: any) => feature.attributes);
    this.isLoadingResults = false;
    this.prepareFilter();
    this.changeDetectorRef.markForCheck();
  }

  private prepareFilter() {
    this.filterConfig = {
      ...this.filterConfig,
      options: {
        DwlType: this.getOptions('DwlType').length ? this.getOptions('DwlType') : this.filterConfig.options.DwlType,
        DwlStatus: this.getOptions('DwlStatus').length ? this.getOptions('DwlStatus') : this.filterConfig.options.DwlStatus,
      }
    };
  }

  private getOptions(column: string) {
    const field = this.commonBuildingRegisterHelper.getField(this.fields, column);
    if (!field) {
      return [];
    }
    return field.domain?.codedValues?.map((codeValue: { name: string, code: string }) => {
      return {
        name: codeValue.name,
        code: codeValue.code,
      };
    });
  }

  private loadDwellingsForEntrances(entranceId: string) {
    this.filterConfig.filter.DwlEntranceID = `('${entranceId}')`;
  }
}
