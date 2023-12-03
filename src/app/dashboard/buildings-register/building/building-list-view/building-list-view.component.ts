import { AfterViewInit, Component, ViewChild, isDevMode } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { merge, startWith, switchMap, catchError, map, of as observableOf, takeUntil, Subject } from 'rxjs';
import { QueryFilter } from 'src/app/dashboard/common/model/query-filter';
import { CommonBuildingService } from 'src/app/dashboard/common/service/common-building.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { BuildingListViewFilterComponent } from './building-list-view-filter/building-list-view-filter.component';
import { BuildingFilter } from 'src/app/dashboard/common/model/building';

@Component({
  selector: 'asrdb-building-list-view',
  templateUrl: './building-list-view.component.html',
  styleUrls: ['./building-list-view.component.css']
})
export class BuildingListViewComponent implements AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private columns = ['BldMunicipality', 'GlobalID', 'BldStatus', 'BldType', 'BldFloorsAbove', 'BldEntranceRecs', 'BldDwellingRecs'];
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
      BldType: ''
    },
    options: {
      BldMunicipality: [] as any[],
      BldStatus: [] as any[],
      BldType: [] as any[],
    }
  };

  get filterChips() {
    return Object
      .entries(this.filterConfig.filter)
      .filter(([key, value]) => !!value)
      .map(([key, value]) => ({ column: key, value }));
  }

  constructor(private commonBuildingService: CommonBuildingService, private matDialog: MatDialog) {
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

  getTitle(column: string) {
    if (!this.data?.length) {
      return '';
    }
    const field = this.getField(column);
    return field.alias;
  }

  getMunicipality(column: string, code: string) {
    if (!this.data?.length) {
      return '';
    }
    const codeValues = this.getCodeValues(column, code);
    return codeValues.code + ' - ' + codeValues.name;
  }

  getValueFromStatus(column: string, code: string) {
    if (!this.data?.length) {
      return '';
    }
    const codeValues = this.getCodeValues(column, code);
    return codeValues?.name ?? code;
  }

  openFilter() {
    this.matDialog
      .open(BuildingListViewFilterComponent, {
        data: JSON.parse(JSON.stringify(this.filterConfig))
      }).afterClosed().subscribe((newFilterConfig: BuildingFilter | null) => {
        if (newFilterConfig) {
          this.filterConfig = newFilterConfig;
        }
      });
  }

  reload() {
    this.loadBuildings().pipe(takeUntil(this.subscriber)).subscribe((res) => this.handleResponse(res));
  }

  remove(column: string) {
    console.log("removing: ", column);
    (this.filterConfig.filter as any)[column] = "";
  }

  private loadBuildings() {
    this.isLoadingResults = true;
    const filter = {
      start: this.paginator.pageIndex * this.paginator.pageSize,
      num: this.paginator.pageSize,
      outFields: this.columns
    } as Partial<QueryFilter>;
    if (this.sort.active) {
      filter.orderByFields = [this.sort.active + " " + this.sort.direction.toUpperCase()]
    }
    return this.commonBuildingService.getBuildingData(filter).pipe(catchError(() => observableOf(null)));
  }

  private async handleResponse(res: any) {
    if (isDevMode()) {
      console.log("Data", res);
    }
    if (!res) {
      return;
    }
    this.fields = res.data.fields;
    this.resultsLength = res.count;
    this.data = res.data.features.map((feature: any) => feature.attributes);;
    this.isLoadingResults = false;
    this.prepareFilter();
  }

  private prepareFilter() {
    this.filterConfig = {
      ...this.filterConfig,
      options: {
        BldMunicipality: this.getOptions('BldMunicipality'),
        BldStatus: this.getOptions('BldStatus'),
        BldType: this.getOptions('BldType'),
      }
    }
  }

  private getOptions(column: string) {
    const field = this.getField(column);
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

  private getField(column: string) {
    return this.fields?.find(field => field.name === column);
  }

  private getCodeValues(column: string, code: string) {
    const field = this.getField(column);
    const codeValues = field?.domain?.codedValues?.find((o: any) => o.code === code);
    return codeValues;
  }
}
