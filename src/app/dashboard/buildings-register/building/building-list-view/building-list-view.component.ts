import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { CommonBuildingService } from 'src/app/dashboard/common/service/common-building.service';

@Component({
  selector: 'asrdb-building-list-view',
  templateUrl: './building-list-view.component.html',
  styleUrls: ['./building-list-view.component.css']
})
export class BuildingListViewComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = ['BldMunicipality', 'GlobalID', 'BldStatus', 'BldType', 'BldFloorsAbove', 'BldEntranceRecs', 'BldDwellingRecs','actions'];
  dataSource = new MatTableDataSource([]);
  fields: any[] = [];
  loading = true;

  constructor(private commonBuildingService: CommonBuildingService) {
  }

  ngOnInit() {
    this.commonBuildingService.getBuildingData().then(async (res) => {
      const data = await res.toJSON();
      this.dataSource.data = data.features.map((feature: any) => feature.attributes);
      this.fields = data.fields;
      this.loading = false;
      console.log("Data", data);
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  getTitle(column: string) {
    const field = this.fields?.find(field => field.name === column);
    return field.alias;
  }

  getMunicipality(column: string, code: string) {
    const codeValues = this.getCodeValues(column, code);
    return codeValues.code + ' - ' + codeValues.name;
  }

  getValueFromStatus(column: string, code: string) {
    const codeValues = this.getCodeValues(column, code);
    return codeValues.name;
  }

  private getCodeValues(column: string, code: string) {
    const field = this.fields?.find(field => field.name === column);
    const codeValues = field.domain.codedValues?.find((o: any) => o.code === code);
    return codeValues;
  }
}
