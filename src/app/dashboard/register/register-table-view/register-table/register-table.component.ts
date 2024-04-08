import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { Chip, ChipComponent } from 'src/app/common/standalone-components/chip/chip.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, merge, takeUntil, startWith, switchMap, catchError, of } from 'rxjs';
import { BuildingFilter } from '../../model/building';
import { QueryFilter } from '../../model/query-filter';
import { CommonBuildingService } from '../../service/common-building.service';
import { CommonRegisterHelperService } from '../../service/common-helper.service';
import { Router } from '@angular/router';
import { RegisterFilterComponent } from '../register-filter/register-filter.component';
import { RegisterFilterService } from '../register-filter.service';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import {MatTooltipModule} from "@angular/material/tooltip";

@Component({
  selector: 'asrdb-register-table',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    ChipComponent,
    MatDividerModule,
    MatCheckboxModule,
    MatTooltipModule
  ],
  templateUrl: './register-table.component.html',
  styleUrls: ['./register-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterTableComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly DEFAULT_PAGE = 0;
  private readonly DEFAULT_SIZE = 10;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private columns = ['GlobalID', 'BldMunicipality', 'BldEnumArea', 'BldStatus', 'BldType', 'BldEntranceRecs', 'BldDwellingRecs' , 'BldQuality'];
  private subscriber = new Subject();
  private initialized = false;

  displayedColumns: string[] = ['selection'].concat(this.columns.concat(['actions']));
  data: never[] = [];
  fields: never[] = [];
  resultsLength = 0;
  isLoadingResults = true;
  selectedBuildings: string[] = [];

  get filterChips(): Chip[] {
    return Object
      .entries(this.registerFilterService.getFilter().filter)
      .filter(([, value]) => !!value)
      .map(([key, value]) => ({ column: key, value: this.getValueFromStatus(key, value) }));
  }

  constructor(
    private commonBuildingService: CommonBuildingService,
    private commonBuildingRegisterHelper: CommonRegisterHelperService,
    private registerFilterService: RegisterFilterService,
    private matDialog: MatDialog,
    private changeDetectionRef: ChangeDetectorRef,
    private router: Router) {
  }

  ngOnInit(): void {
    this.registerFilterService.filterObservable.subscribe((filter) => {
      this.reload();
    });
  }

  ngAfterViewInit() {
    // If the user changes the sort order, reset back to the first page.
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        takeUntil(this.subscriber),
        startWith({}),
        switchMap(() => this.loadBuildings()),
      )
      .subscribe((res) => this.handleResponse(res));
  }

  ngOnDestroy(): void {
    this.subscriber.next(true);
    this.subscriber.complete();
  }

  getMunicipality(column: string, code: string) {
    return this.commonBuildingRegisterHelper.getMunicipality(this.fields, column, code);
  }

  getValueFromStatus(column: string, code: string) {
    if (column === 'BldMunicipality') {
      return this.getMunicipality(column, code);
    }
    return this.commonBuildingRegisterHelper.getValueFromStatus(this.fields, column, code);
  }


  handleSelect(globalId: string) {
    if (this.selectedBuildings.includes(globalId)) {
      this.selectedBuildings = this.selectedBuildings.filter(selectedBuilding => selectedBuilding !== globalId);
    } else {
      this.selectedBuildings.push(globalId);
    }
  }

  handleSelectAll(event: MatCheckboxChange) {
    this.selectedBuildings = event.checked ? this.data.map(el => el['GlobalID']) : [];
  }

  openFilter() {
    this.matDialog
      .open(RegisterFilterComponent, {
        data: JSON.parse(JSON.stringify(this.registerFilterService.getFilter()))
      }).afterClosed().subscribe((newFilterConfig: BuildingFilter | null) => this.handlePopupClose(newFilterConfig));
  }

  reload() {
    this.loadBuildings().pipe(takeUntil(this.subscriber)).subscribe((res) => this.handleResponse(res));
  }

  remove($event: Chip) {
    const filterCopy = JSON.parse(JSON.stringify(this.registerFilterService.getFilter()));
    (filterCopy as any).filter[$event.column] = '';
    this.registerFilterService.updateFilter(filterCopy);
  }

  viewBuildingDetails(globalId: string) {
    this.router.navigateByUrl('/dashboard/register/details/BUILDING/' + globalId);
  }

  editBuildingDetails(globalId: string) {
    this.router.navigateByUrl('/dashboard/register/form/BUILDING/' + globalId);
  }

  viewLogs(globalId: string) {
    this.router.navigateByUrl('/dashboard/register/logs?buildings=' + globalId);
  }

  viewLogsForSelected() {
    this.router.navigateByUrl('/dashboard/register/logs?buildings=' + this.selectedBuildings.join(','));
  }

  addNewBuilding() {
    this.router.navigateByUrl('/dashboard/register/form/BUILDING');
  }

  filterBuilding(GlobalID: string) {
    const filterCopy = JSON.parse(JSON.stringify(this.registerFilterService.getFilter()));
    (filterCopy as any).filter['GlobalID'] = GlobalID;
    this.registerFilterService.updateFilter(filterCopy);
  }

  stopClickEventFiltering(event: Event) {
    event.stopImmediatePropagation();
  }

  private handlePopupClose(newFilterConfig: BuildingFilter | null) {
    if (newFilterConfig) {
      this.registerFilterService.updateFilter(newFilterConfig);
    }
  }

  private loadBuildings() {
    this.isLoadingResults = true;
    const start = (this.paginator?.pageIndex ?? this.DEFAULT_PAGE) * (this.paginator?.pageSize ?? this.DEFAULT_SIZE);
    const filter = {
      start: start,
      num: this.paginator?.pageSize ?? this.DEFAULT_SIZE,
      outFields: this.columns,
      where: this.registerFilterService.prepareWhereCase()
    } as Partial<QueryFilter>;
    if (this.sort.active) {
      filter.orderByFields = [this.sort.active + ' ' + this.sort.direction.toUpperCase()];
    }
    return this.commonBuildingService.getBuildingData(filter).pipe(catchError((err) => {
      console.log(err);
      return of(null);
    }));
  }

  private handleResponse(res: any) {
    if (isDevMode()) {
      console.log('Data', res);
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
    this.registerFilterService.updateGlobalIds(res.globalIds);
    if (!this.initialized) {
      this.registerFilterService.prepareFilter(this.fields);
      this.initialized = true;
    }
    this.changeDetectionRef.markForCheck();
  }
}
