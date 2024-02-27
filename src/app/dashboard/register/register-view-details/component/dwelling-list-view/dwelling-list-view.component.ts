import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Subject, takeUntil, catchError, of as observableOf, merge, startWith, switchMap } from 'rxjs';
import { ChipComponent, Chip } from 'src/app/common/standalone-components/chip/chip.component';
import { EntranceListViewFilterComponent } from '../entrance-list-view/entrance-list-view-filter/entrance-list-view-filter.component';
import { ActivatedRoute, Router } from '@angular/router';
import { DwellingListViewFilterComponent } from './dwelling-list-view-filter/dwelling-list-view-filter.component';
import { CommonEntranceService } from '../../../service/common-entrance.service';
import { DwellingFilter } from '../../../model/dwelling';
import { QueryFilter } from '../../../model/query-filter';
import { CommonDwellingService } from '../../../service/common-dwellings.service';
import { CommonRegisterHelperService } from '../../../service/common-helper.service';
import { DwellingDetailsComponent } from './dwelling-details/dwelling-details.component';
import { DwellingDetailsFormComponent } from '../../../register-form/dwelling-details-form/dwelling-details-form.component';
import { Entrance } from '../../../model/entrance';

@Component({
  selector: 'asrdb-dwelling-list-view',
  templateUrl: './dwelling-list-view.component.html',
  styleUrls: ['./dwelling-list-view.component.css'],
  standalone: true,
  providers: [CommonDwellingService, CommonEntranceService],
  imports: [MatIconModule, MatDialogModule, MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule, MatMenuModule, ChipComponent, MatProgressSpinnerModule, CommonModule, EntranceListViewFilterComponent]
})
export class DwellingListViewComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() buildingGlobalId?: string;
  @Input() entrances: Entrance[] = [];
  buildingIdQueryParam?: string | null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private columns = ['GlobalID', 'DwlEntranceID', 'DwlCensus2023', 'DwlAddressID', 'DwlFloor', 'DwlApartNumber', 'DwlStatus', 'DwlType'];
  private subscriber = new Subject();

  displayedColumns: string[] = this.columns.concat(['actions']);
  data: any[] = [];
  fields: any[] = [];
  resultsLength = 0;
  isLoadingResults = true;
  entranceConditionCreated = false;

  // TODO: Add correct filter
  filterConfig: DwellingFilter = {
    filter: {
      DwlEntranceID: 0,
      DwlFloor: 0,
      DwlApartNumber: 0,
      GlobalID: '',
      DwlStatus: '',
      DwlType: '',
      fk_entrance: ''
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
      .map(([key, value]) => ({ column: key, value: this.getValueFromStatus(key, value.toString()) }));
  }

  constructor(
    private commonDwellingBuildingService: CommonDwellingService,
    private commonEntranceBuildingService: CommonEntranceService,
    private commonBuildingRegisterHelper: CommonRegisterHelperService,
    private matDialog: MatDialog,
    private router: Router,
    private activatedRoute: ActivatedRoute) {
  }

  ngOnInit() {
    let buildingId;
    const entranceId = this.activatedRoute.snapshot.queryParamMap.get('entrance');

    this.buildingIdQueryParam = this.activatedRoute.snapshot.queryParamMap.get('building');
    if (this.buildingIdQueryParam) {
      buildingId = this.buildingIdQueryParam?.replace('{', '').replace('}', '');
    } else if (this.buildingGlobalId) {
      buildingId = this.buildingGlobalId?.replace('{', '').replace('}', '');
    }

    if (buildingId) {
      this.loadDwellingsForBuilding(buildingId);
    } else if (entranceId) {
      this.loadDwellingsForEntrances(entranceId);
    }
  }

  ngAfterViewInit() {
    // If the user changes the sort order, reset back to the first page.
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));
    if (this.buildingGlobalId || this.buildingIdQueryParam) {
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
        startWith({}),
        switchMap(() => this.loadDwellings()),
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
      .open(DwellingListViewFilterComponent, {
        data: { filter: JSON.parse(JSON.stringify(this.filterConfig)), showBuildingIdFilter: !this.buildingGlobalId }
      }).afterClosed().subscribe((newFilterConfig: DwellingFilter | null) => this.handlePopupClose(newFilterConfig));
  }

  addDwelling() {
    this.matDialog.open(DwellingDetailsFormComponent, {
      data: {
        entrances: this.entrances
      }
    });
  }

  reload() {
    this.loadDwellings().pipe(takeUntil(this.subscriber)).subscribe((res) => this.handleResponse(res));
  }

  remove($event: Chip) {
    (this.filterConfig.filter as any)[$event.column] = '';
    this.reload();
  }

  viewDwellingDetails(globalId: string) {
    this.matDialog.open(DwellingDetailsComponent, {
      data: globalId
    });
  }

  editDwellingDetails(globalId: string) {
    this.matDialog.open(DwellingDetailsFormComponent, {
      data: {
        entrances: this.entrances,
        id: globalId
      }
    });
  }

  private handlePopupClose(newFilterConfig: DwellingFilter | null) {
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
        if (filter.column === 'fk_entrance') {
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
      outFields: this.columns,
      where: this.prepareWhereCase()
    } as Partial<QueryFilter>;
    if (this.sort.active) {
      filter.orderByFields = [this.sort.active + ' ' + this.sort.direction.toUpperCase()];
    }
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
      return;
    }
    if (res.data.fields.length) {
      this.fields = res.data.fields;
    }
    this.resultsLength = res.count;
    this.data = res.data.features.map((feature: any) => feature.attributes);
    this.isLoadingResults = false;
    this.prepareFilter();
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

  private loadDwellingsForBuilding(buildingId: string) {
    this.commonEntranceBuildingService.getEntranceData({
      where: `fk_buildings='${buildingId?.replace('{', '').replace('}', '')}'`
    })
      .pipe(takeUntil(this.subscriber))
      .subscribe((res => {
        if (res.count) {
          const condition = res.data.features
            .map((feature: any) => feature.attributes)
            .reduce((currentValue: string[], item: any) => {
              currentValue.push(`'${item.GlobalID.replace('{', '').replace('}', '')}'`);
              return currentValue;
            }, [])
            .join(', ');
          this.filterConfig.filter.fk_entrance = `(${condition})`;
          this.reload();
        } else {
          this.isLoadingResults = false;
        }
      }));
  }

  private loadDwellingsForEntrances(entranceId: string) {
    this.filterConfig.filter.fk_entrance = `('${entranceId.replace('{', '').replace('}', '')}')`;
  }
}
