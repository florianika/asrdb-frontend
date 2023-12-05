import { Component, OnInit, isDevMode } from '@angular/core';
import { QueryFilter } from 'src/app/dashboard/common/model/query-filter';
import { Subject, catchError, of as observableOf, takeUntil } from 'rxjs';
import { CommonBuildingService } from 'src/app/dashboard/common/service/common-building.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { CommonBuldingRegisterHelper } from 'src/app/dashboard/common/service/common-helper.service';

@Component({
  selector: 'asrdb-building-details',
  templateUrl: './building-details.component.html',
  styleUrls: ['./building-details.component.css']
})
export class BuildingDetailsComponent implements OnInit {
  isLoadingResults = true;
  building: any;
  private subscriber = new Subject();
  private fields: any[] = [];
  private id: string | null = '';

  constructor(private commonBuildingService: CommonBuildingService, private commonBuildingRegisterHelper: CommonBuldingRegisterHelper, private matSnack: MatSnackBar, private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.id = this.activatedRoute.snapshot.paramMap.get('id');
    this.loadBuildings().pipe(takeUntil(this.subscriber)).subscribe((res) => this.handleResponse(res));
  }

  getTitle(column: string) {
    return this.commonBuildingRegisterHelper.getTitle(this.fields, column);
  }

  getMunicipality() {
    return this.commonBuildingRegisterHelper.getMunicipality(this.fields, 'BldMunicipality', this.building.BldMunicipality);
  }

  getValueFromStatus(column: string) {
    return this.commonBuildingRegisterHelper.getValueFromStatus(this.fields, column, this.building[column]) ?? "-";
  }

  private prepareWhereCase() {
    return `GlobalID='${this.id}'`;
  }

  private async handleResponse(res: any) {
    if (isDevMode()) {
      console.log("Data", res);
    }
    if (!res) {
      return;
    }
    if (res.data.fields.length) {
      this.fields = res.data.fields;
    }
    this.building = res.data.features.map((feature: any) => feature.attributes)[0];
    this.isLoadingResults = false;
  }

  private loadBuildings() {
    this.isLoadingResults = true;
    const filter = {
      where: this.prepareWhereCase()
    } as Partial<QueryFilter>;
    return this.commonBuildingService.getBuildingData(filter).pipe(catchError((err) => {
      console.log(err);
      this.matSnack.open('Could not load building. Please try again.', 'Ok', {
        duration: 3000
      });
      return observableOf(null);
    }));
  }
}
