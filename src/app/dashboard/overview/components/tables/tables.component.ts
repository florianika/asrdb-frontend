import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {OverviewService} from "../service/overview.service";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";


@Component({
  selector: 'asrdb-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.css']
})
export class TablesComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = ['BldMunicipality', 'GlobalID', 'BldStatus', 'BldType', 'BldFloorsAbove', 'BldEntranceRecs', 'BldDwellingRecs','actions'];
  dataSource = new MatTableDataSource([]);
  fields: any[] = [];
  loading = true;

  constructor(private overviewService: OverviewService) {
  }

  ngOnInit() {
    this.overviewService.getBuildingData().then(async (res) => {
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

  getMunicipality(code: string) {
    const field = this.fields?.find(field => field.name === 'BldMunicipality');
    const codeValues = field.domain.codedValues?.find((o: any) => o.code === code);
    return codeValues.code + ' - ' + codeValues.name;
  }

  getBuildingStatus(status: string) {
    const field = this.fields.find(field => field.name === 'BldStatus');
    const codeValues = field.domain.codedValues?.find((o: any) => o.code === status);
    return codeValues.name;
  }

  getBuildingType(type: string) {
    const field = this.fields.find(field => field.name === 'BldType');
    const codeValues = field.domain.codedValues?.find((o: any) => o.code === type);
    return codeValues.name;
  }
}
