import { AfterViewInit, Component, EventEmitter, OnDestroy, Output, ViewChild, isDevMode } from '@angular/core';
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
import { CommonBuildingRegisterHelper } from '../../service/common-helper.service';
import { Router } from '@angular/router';
import { RegisterFilterComponent } from '../register-filter/register-filter.component';

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
  ],
  templateUrl: './register-table.component.html',
  styleUrls: ['./register-table.component.css']
})
export class RegisterTableComponent implements AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  @Output() filter = new EventEmitter();

  private columns = ['GlobalID', 'BldMunicipality', 'BldStatus', 'BldType', 'BldFloorsAbove', 'BldEntranceRecs', 'BldDwellingRecs'];
  private subscriber = new Subject();

  displayedColumns: string[] = this.columns.concat(['actions']);
  data: any[] = [];
  fields: any[] = [];
  resultsLength = 0;
  isLoadingResults = true;

  filterConfig: BuildingFilter = {
    filter: {
      BldMunicipality: '',
      BldStatus: '',
      BldType: '',
      GlobalID: ''
    },
    options: {
      BldMunicipality: [] as any[],
      BldStatus: [] as any[],
      BldType: [] as any[],
    }
  };

  get filterChips(): Chip[] {
    return Object
      .entries(this.filterConfig.filter)
      .filter(([, value]) => !!value)
      .map(([key, value]) => ({ column: key, value: this.getValueFromStatus(key, value) }));
  }

  constructor(
    private commonBuildingService: CommonBuildingService,
    private commonBuildingRegisterHelper: CommonBuildingRegisterHelper,
    private matDialog: MatDialog,
    private router: Router) {
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
      .open(RegisterFilterComponent, {
        data: JSON.parse(JSON.stringify(this.filterConfig))
      }).afterClosed().subscribe((newFilterConfig: BuildingFilter | null) => this.handlePopupClose(newFilterConfig));
  }

  reload() {
    this.loadBuildings().pipe(takeUntil(this.subscriber)).subscribe((res) => this.handleResponse(res));
  }

  remove($event: Chip) {
    (this.filterConfig.filter as any)[$event.column] = '';
    this.reload();
  }

  viewBuildingDetails(globalId: string) {
    this.router.navigateByUrl('/dashboard/buildings-register/details/' + globalId);
  }

  viewEntrances(globalId: string) {
    this.router.navigateByUrl('/dashboard/buildings-register/entrance?building=' + globalId);
  }

  viewDwellings(globalId: string) {
    this.router.navigateByUrl('/dashboard/buildings-register/dwelling?building=' + globalId);
  }

  private handlePopupClose(newFilterConfig: BuildingFilter | null) {
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
        conditions.push(filter.column + '=' + this.getWhereConditionValue(filter.value));
      });
    return conditions.length ? conditions.join(' and ') : '1=1';
  }

  private getWhereConditionValue(value: string | number) {
    return (typeof value == 'number') ? value : `'${value}'`;
  }

  private loadBuildings() {
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
    this.filter.emit(filter.where);
    return this.commonBuildingService.getBuildingData(filter).pipe(catchError((err) => {
      console.log(err);
      return of(null);
    }));
  }

  private async handleResponse(res: any) {
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
    this.prepareFilter();
  }

  private prepareFilter() {
    this.filterConfig = {
      ...this.filterConfig,
      options: {
        BldMunicipality: this.getOptions('BldMunicipality').length ? this.getOptions('BldMunicipality') : this.filterConfig.options.BldMunicipality,
        BldStatus: this.getOptions('BldStatus').length ? this.getOptions('BldStatus') : this.filterConfig.options.BldStatus,
        BldType: this.getOptions('BldType').length ? this.getOptions('BldType') : this.filterConfig.options.BldType,
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
