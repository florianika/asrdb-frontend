import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  isDevMode
} from '@angular/core';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {Subject, merge, takeUntil, startWith, switchMap, catchError, of as observableOf} from 'rxjs';
import {Chip, ChipComponent} from 'src/app/common/standalone-components/chip/chip.component';
import {ActivatedRoute, Router} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import {MatMenuModule} from '@angular/material/menu';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {CommonModule} from '@angular/common';
import {EntranceListViewFilterComponent} from './entrance-list-view-filter/entrance-list-view-filter.component';
import {Entrance, EntranceFilter} from '../../../model/entrance';
import {QueryFilter} from '../../../model/query-filter';
import {CommonEntranceService} from '../../../service/common-entrance.service';
import {CommonRegisterHelperService} from '../../../service/common-helper.service';
import {EntranceDetailsComponent} from './entrance-details/entrance-details.component';
import {RegisterLogService} from "../../../register-log-view/register-log-table/register-log.service";
import {MatTooltipModule} from "@angular/material/tooltip";

@Component({
  selector: 'asrdb-entrance-list-view',
  templateUrl: './entrance-list-view.component.html',
  styleUrls: ['./entrance-list-view.component.css'],
  standalone: true,
  providers: [CommonEntranceService],
  imports: [
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatMenuModule,
    MatDialogModule,
    ChipComponent,
    MatProgressSpinnerModule,
    CommonModule,
    EntranceListViewFilterComponent,
    MatTooltipModule
  ]
})
export class EntranceListViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() buildingGlobalId?: string;
  @Output() entrancesLoaded = new EventEmitter<Entrance[]>();
  @Output() entranceSelected = new EventEmitter<string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  buildingIdQueryParam?: string | null;
  selectedEntrance: string | undefined;

  private columns = [
    'EntBuildingId',
    'GlobalID',
    'EntStreetCode',
    'EntBuildingNumber',
    'EntEntranceNumber',
    'EntDwellingRecs',
    'EntDwellingExpec',
    'EntQuality',
  ];
  private subscriber = new Subject();

  displayedColumns: string[] = this.columns.concat(['actions']);
  data: any[] = [];
  fields: any[] = [];
  resultsLength = 0;
  isLoadingResults = true;

  // TODO: Add correct filter
  filterConfig: EntranceFilter = {
    filter: {
      EntBuildingNumber: 0,
      EntEntranceNumber: 0,
      EntPointStatus: '',
      GlobalID: '',
      EntBuildingId: ''
    },
    options: {
      EntPointStatus: [] as any[],
    }
  };

  get filterChips(): Chip[] {
    return Object
      .entries(this.filterConfig.filter)
      .filter(([, value]) => !!value)
      .map(([key, value]) => ({column: key, value: this.getValueFromStatus(key, value.toString())}));
  }

  constructor(
    private commonEntranceBuildingService: CommonEntranceService,
    private commonBuildingRegisterHelper: CommonRegisterHelperService,
    private matDialog: MatDialog,
    private registerLogService: RegisterLogService,
    private router: Router,
    private activatedRoute: ActivatedRoute) {
  }

  ngOnInit() {
    this.buildingIdQueryParam = this.activatedRoute.snapshot.queryParamMap.get('building');
    if (this.buildingIdQueryParam) {
      this.filterConfig.filter.EntBuildingId = this.buildingIdQueryParam?.replace('{', '').replace('}', '');
    } else if (this.buildingGlobalId) {
      this.filterConfig.filter.EntBuildingId = this.buildingGlobalId?.replace('{', '').replace('}', '');
    }
  }

  ngAfterViewInit() {
    // If the user changes the sort order, reset back to the first page.
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        takeUntil(this.subscriber),
        startWith({}),
        switchMap(() => this.loadEntrances()),
      )
      .subscribe((res) => this.handleResponse(res));
  }

  ngOnDestroy(): void {
    this.subscriber.next(true);
    this.subscriber.complete();
  }

  getTitle(column: string) {
    return this.commonBuildingRegisterHelper.getTitle(this.fields, column);
  }

  getValueFromStatus(column: string, code: string) {
    return this.commonBuildingRegisterHelper.getValueFromStatus(this.fields, column, code);
  }

  openFilter() {
    this.matDialog
      .open(EntranceListViewFilterComponent, {
        data: {filter: JSON.parse(JSON.stringify(this.filterConfig)), showBuildingIdFilter: !this.buildingGlobalId}
      }).afterClosed().subscribe((newFilterConfig: EntranceFilter | null) => this.handlePopupClose(newFilterConfig));
  }

  reload() {
    this.loadEntrances().pipe(takeUntil(this.subscriber)).subscribe((res) => this.handleResponse(res));
  }

  remove($event: Chip) {
    (this.filterConfig.filter as any)[$event.column] = '';
    this.reload();
  }

  viewEntranceDetails(globalId: string) {
    this.matDialog.open(EntranceDetailsComponent, {
      data: {
        globalId,
        logs: this.registerLogService.getAllLogs('ENTRANCE')
      }
    });
  }

  createEntrance(buildingId: string) {
    this.router.navigateByUrl('dashboard/register/form/ENTRANCE/' + buildingId);
  }


  editEntrance(buildingId: string, globalId: string) {
    this.router.navigateByUrl('dashboard/register/form/ENTRANCE/' + buildingId + '?entranceId=' + globalId);
  }

  selectEntrance(entranceId: string) {
    this.entranceSelected.emit(entranceId);
    this.selectedEntrance = entranceId;
  }

  private handlePopupClose(newFilterConfig: EntranceFilter | null) {
    if (newFilterConfig) {
      this.filterConfig = newFilterConfig;
      this.reload();
    }
  }

  private prepareWhereCase() {
    const conditions: string[] = [];
    Object
      .entries(this.filterConfig.filter)
      .filter(([, value]) => !!value)
      .map(([key, value]) => ({column: key, value} as Chip))
      .forEach(filter => {
        conditions.push(filter.column + '=' + this.getWhereConditionValue(filter.value));
      });
    return conditions.length ? conditions.join(' and ') : '1=1';
  }

  private getWhereConditionValue(value: string | number) {
    return (typeof value == 'number') ? value : `'${value}'`;
  }

  private loadEntrances() {
    this.isLoadingResults = true;
    const filter = {
      start: this.paginator.pageIndex * this.paginator.pageSize,
      num: this.paginator.pageSize,
      outFields: this.columns,
      where: this.prepareWhereCase()
    } as Partial<QueryFilter>;
    if (this.sort.active) {
      filter.orderByFields = [this.sort.active + ' ' + this.sort.direction.toUpperCase()];
    }
    return this.commonEntranceBuildingService.getEntranceData(filter).pipe(catchError((err) => {
      console.log(err);
      return observableOf(null);
    }));
  }

  private async handleResponse(res: any) {
    if (isDevMode()) {
      console.log('Entrances: ', res);
    }
    if (!res) {
      return;
    }
    if (res.data.fields.length) {
      this.fields = res.data.fields;
    }
    this.resultsLength = res.count;
    this.data = res.data.features.map((feature: any) => feature.attributes);
    this.isLoadingResults = false;
    this.prepareFilter();
    this.entrancesLoaded.emit(this.data);
  }

  private prepareFilter() {
    this.filterConfig = {
      ...this.filterConfig,
      options: {
        EntPointStatus: this.getOptions('EntPointStatus').length ? this.getOptions('EntPointStatus') : this.filterConfig.options.EntPointStatus,
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
}
