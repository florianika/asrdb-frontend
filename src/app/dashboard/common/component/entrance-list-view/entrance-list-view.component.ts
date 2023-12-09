import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild, isDevMode } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { Subject, merge, takeUntil, startWith, switchMap, catchError, of as observableOf } from 'rxjs';
import { Chip, ChipComponent } from 'src/app/common/standalone-components/chip/chip.component';
import { QueryFilter } from '../../model/query-filter';
import { CommonBuildingRegisterHelper } from '../../service/common-helper.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonEntranceService } from '../../service/common-entrance.service';
import { EntranceFilter } from '../../model/entrance';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { EntranceListViewFilterComponent } from './entrance-list-view-filter/entrance-list-view-filter.component';

@Component({
  selector: 'asrdb-entrance-list-view',
  templateUrl: './entrance-list-view.component.html',
  styleUrls: ['./entrance-list-view.component.css'],
  standalone: true,
  providers: [CommonEntranceService],
  imports: [MatIconModule, MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule, MatMenuModule, ChipComponent, MatProgressSpinnerModule, CommonModule, EntranceListViewFilterComponent]
})
export class EntranceListViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() buildingGlobalId?: string;
  buildingIdQueryParam?: string | null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private columns = ['GlobalID', 'EntBuildingNumber', 'EntEntranceNumber', 'EntTown', 'EntZipCode', 'EntPointStatus', 'EntDwellingRecs', 'EntDwellingExpec'];
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
      fk_buildings: ''
    },
    options: {
      EntPointStatus: [] as any[],
    }
  };

  get filterChips(): Chip[] {
    return Object
      .entries(this.filterConfig.filter)
      .filter(([, value]) => !!value)
      .map(([key, value]) => ({ column: key, value: this.getValueFromStatus(key, value.toString()) }));
  }

  constructor(
    private commonEntranceBuildingService: CommonEntranceService,
    private commonBuildingRegisterHelper: CommonBuildingRegisterHelper,
    private matDialog: MatDialog,
    private router: Router,
    private activatedRoute: ActivatedRoute) {
  }

  ngOnInit() {
    this.buildingIdQueryParam = this.activatedRoute.snapshot.queryParamMap.get('building');
    if (this.buildingIdQueryParam) {
      this.filterConfig.filter.fk_buildings = this.buildingIdQueryParam?.replace('{', '').replace('}', '');
    } else if (this.buildingGlobalId) {
      this.filterConfig.filter.fk_buildings = this.buildingGlobalId?.replace('{', '').replace('}', '');
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

  getMunicipality(column: string, code: string) {
    return this.commonBuildingRegisterHelper.getMunicipality(this.fields, column, code);
  }

  getValueFromStatus(column: string, code: string) {
    return this.commonBuildingRegisterHelper.getValueFromStatus(this.fields, column, code);
  }

  openFilter() {
    this.matDialog
      .open(EntranceListViewFilterComponent, {
        data: { filter: JSON.parse(JSON.stringify(this.filterConfig)), showBuildingIdFilter: !this.buildingGlobalId }
      }).afterClosed().subscribe((newFilterConfig: EntranceFilter | null) => this.handlePopupClose(newFilterConfig));
  }

  reload() {
    this.loadEntrances().pipe(takeUntil(this.subscriber)).subscribe((res) => this.handleResponse(res));
  }

  remove($event: Chip) {
    (this.filterConfig.filter as any)[$event.column] = "";
    this.reload();
  }

  viewEntranceDetails(globalId: string) {
    this.router.navigateByUrl('/dashboard/buildings-register/entrance/details/' + globalId);
  }

  viewDwellings(globalId: string) {
    this.router.navigateByUrl('/dashboard/buildings-register/dwelling?entrance=' + globalId);
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
      .map(([key, value]) => ({ column: key, value } as Chip))
      .forEach(filter => {
        conditions.push(filter.column + "=" + this.getWhereConditionValue(filter.value));
      });
    return conditions.length ? conditions.join(" and ") : "1=1";
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
      filter.orderByFields = [this.sort.active + " " + this.sort.direction.toUpperCase()]
    }
    return this.commonEntranceBuildingService.getEntranceData(filter).pipe(catchError((err) => {
      console.log(err);
      return observableOf(null);
    }));
  }

  private async handleResponse(res: any) {
    if (isDevMode()) {
      console.log("Entrances: ", res);
    }
    if (!res) {
      return;
    }
    if (res.data.fields.length) {
      this.fields = res.data.fields;
    }
    this.resultsLength = res.count;
    this.data = res.data.features.map((feature: any) => feature.attributes);;
    this.isLoadingResults = false;
    this.prepareFilter();
  }

  private prepareFilter() {
    this.filterConfig = {
      ...this.filterConfig,
      options: {
        EntPointStatus: this.getOptions('EntPointStatus').length ? this.getOptions('EntPointStatus') : this.filterConfig.options.EntPointStatus,
      }
    }
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
      }
    });
  }
}
