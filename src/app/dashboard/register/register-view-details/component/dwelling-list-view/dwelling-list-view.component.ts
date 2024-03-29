import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  Input,
  isDevMode,
  OnChanges,
  OnDestroy,
  OnInit, SimpleChanges,
  ViewChild
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
import {DwellingListViewFilterComponent} from './dwelling-list-view-filter/dwelling-list-view-filter.component';
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

@Component({
  selector: 'asrdb-dwelling-list-view',
  templateUrl: './dwelling-list-view.component.html',
  styleUrls: ['./dwelling-list-view.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CommonDwellingService, CommonEntranceService],
  imports: [MatIconModule, MatDialogModule, MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule, MatMenuModule, ChipComponent, MatProgressSpinnerModule, CommonModule, EntranceListViewFilterComponent]
})
export class DwellingListViewComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @Input() entranceId?: string;
  @Input() entrances: Entrance[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private columns = ['GlobalID', 'DwlEntranceID', 'DwlCensus2023', 'DwlAddressID', 'DwlFloor', 'DwlApartNumber', 'DwlStatus', 'DwlType'];
  private subscriber = new Subject();

  displayedColumns: string[] = this.columns.concat(['actions']);
  data: any[] = [];
  fields: any[] = [];
  resultsLength = 0;
  isLoadingResults = false;

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
      .map(([key, value]): any => ({ column: key, value: this.getValueFromStatus(key, value.toString()) }));
  }

  constructor(
    private commonDwellingBuildingService: CommonDwellingService,
    private commonEntranceBuildingService: CommonEntranceService,
    private commonBuildingRegisterHelper: CommonRegisterHelperService,
    private changeDetectorRef: ChangeDetectorRef,
    private matDialog: MatDialog) {
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
    }
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
        data: { filter: JSON.parse(JSON.stringify(this.filterConfig)), showBuildingIdFilter: !this.entranceId }
      }).afterClosed().subscribe((newFilterConfig: DwellingFilter | null) => this.handlePopupClose(newFilterConfig));
  }

  addDwelling() {
    this.matDialog.open(DwellingDetailsFormComponent, {
      data: {
        entrances: this.entrances
      }
    }).afterClosed().subscribe(() => {
      this.reload();
    });
  }

  reload() {
    if (!this.filterConfig.filter.fk_entrance) {
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
      data: globalId
    });
  }

  editDwellingDetails(globalId: string) {
    this.matDialog.open(DwellingDetailsFormComponent, {
      data: {
        entrances: this.entrances,
        id: globalId
      }
    }).afterClosed().subscribe(() => {
      this.reload();
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
      .filter(([, value]: any) => !!value)
      .map(([key, value]: any) => ({ column: key, value } as Chip))
      .forEach((filter: any) => {
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
    this.filterConfig.filter.fk_entrance = `('${entranceId}')`;
  }
}
