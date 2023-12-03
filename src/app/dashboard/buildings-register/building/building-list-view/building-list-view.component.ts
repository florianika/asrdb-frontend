import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { merge, startWith, switchMap, catchError, map, of as observableOf } from 'rxjs';
import { QueryFilter } from 'src/app/dashboard/common/model/query-filter';
import { CommonBuildingService } from 'src/app/dashboard/common/service/common-building.service';

@Component({
  selector: 'asrdb-building-list-view',
  templateUrl: './building-list-view.component.html',
  styleUrls: ['./building-list-view.component.css']
})
export class BuildingListViewComponent implements AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['BldMunicipality', 'GlobalID', 'BldStatus', 'BldType', 'BldFloorsAbove', 'BldEntranceRecs', 'BldDwellingRecs', 'actions'];
  data: any[] = [];
  fields: any[] = [];
  resultsLength = 0;
  isLoadingResults = true;

  constructor(private commonBuildingService: CommonBuildingService) {
  }

  ngAfterViewInit() {
    // If the user changes the sort order, reset back to the first page.
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
          const filter = {
            start: this.paginator.pageIndex,
            num: this.paginator.pageSize
          } as Partial<QueryFilter>;
          if (this.sort.active) {
            filter.orderByFields = [this.sort.active + " " + this.sort.direction.toUpperCase()]
          }
          return this.commonBuildingService.getBuildingData(filter).pipe(catchError(() => observableOf(null)));
        }),
        map(async (res) => {
          if (!res) {
            return [];
          }
          const rows = res.data.features.map((feature: any) => feature.attributes);
          this.fields = res.data.fields;
          this.resultsLength = res.count;
          console.log("Data", res);
          return rows;
        }),
      )
      .subscribe(async (data) => {
        this.data = await data;
        this.isLoadingResults = false;
      });
  }

  getTitle(column: string) {
    if (!this.data?.length) {
      return '';
    }
    const field = this.fields?.find(field => field.name === column);
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

  private getCodeValues(column: string, code: string) {
    const field = this.fields?.find(field => field.name === column);
    const codeValues = field?.domain?.codedValues?.find((o: any) => o.code === code);
    return codeValues;
  }
}
