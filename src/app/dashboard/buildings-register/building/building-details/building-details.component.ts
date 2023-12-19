import { Component, OnInit, isDevMode } from '@angular/core';
import { QueryFilter } from 'src/app/dashboard/buildings-register/common/model/query-filter';
import { Subject, catchError, of as observableOf, takeUntil } from 'rxjs';
import { CommonBuildingService } from 'src/app/dashboard/buildings-register/common/service/common-building.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { CommonBuildingRegisterHelper } from 'src/app/dashboard/buildings-register/common/service/common-helper.service';

@Component({
  selector: 'asrdb-building-details',
  templateUrl: './building-details.component.html',
  styleUrls: ['./building-details.component.css']
})
export class BuildingDetailsComponent implements OnInit {
  isLoadingResults = true;
  building: any;

  sections = [
    {
      title: 'General details',
      entries: [
        {
          title: '',
          propName: 'BldMunicipality',
          value: ''
        },
        {
          title: '',
          propName: 'BldCadastralZone',
          value: ''
        },
        {
          title: '',
          propName: 'BldAddressID',
          value: ''
        },
        {
          title: '',
          propName: 'BldCensus2023',
          value: ''
        },
        {
          title: '',
          propName: 'BldEnumArea',
          value: ''
        },
        {
          title: '',
          propName: 'BldType',
          value: ''
        },
        {
          title: '',
          propName: 'BldStatus',
          value: ''
        },
        {
          title: '',
          propName: 'BldClass',
          value: ''
        },
        {
          title: '',
          propName: 'BldProperty',
          value: ''
        },
      ]
    },
    {
      title: 'Building measurements',
      entries: [
        {
          title: '',
          propName: 'BldArea',
          value: ''
        },
        {
          title: '',
          propName: 'BldVolume',
          value: ''
        },
        {
          title: '',
          propName: 'BldHeight',
          value: ''
        },
        {
          title: '',
          propName: 'BldFloorsAbove',
          value: ''
        },
        {
          title: '',
          propName: 'BldFloorsUnder',
          value: ''
        },
        {
          title: '',
          propName: 'BldDwellingRecs',
          value: ''
        },
        {
          title: '',
          propName: 'BldEntranceRecs',
          value: ''
        },
        {
          title: '',
          propName: 'BldLatitude',
          value: ''
        },
        {
          title: '',
          propName: 'BldLongitude',
          value: ''
        },
      ]
    },
    {
      title: 'Building utilities',
      entries: [
        {
          title: '',
          propName: 'BldElectricity',
          value: ''
        },
        {
          title: '',
          propName: 'BldElevator',
          value: ''
        },
        {
          title: '',
          propName: 'BldPipedGas',
          value: ''
        },
        {
          title: '',
          propName: 'BldPipedWater',
          value: ''
        },
        {
          title: '',
          propName: 'BldRainWater',
          value: ''
        },
        {
          title: '',
          propName: 'BldWasteWater',
          value: ''
        },
      ]
    },
    {
      title: 'Other details',
      entries: [
        {
          title: '',
          propName: 'BldYearConstruction',
          value: ''
        },
        {
          title: '',
          propName: 'BldYearDemolition',
          value: ''
        },
        {
          title: '',
          propName: 'BldPermitDate',
          value: ''
        },
        {
          title: '',
          propName: 'BldPermitNumber',
          value: ''
        },
      ]
    }
  ];

  private subscriber = new Subject();
  private fields: any[] = [];
  private id: string | null = '';

  constructor(private commonBuildingService: CommonBuildingService, private commonBuildingRegisterHelper: CommonBuildingRegisterHelper, private matSnack: MatSnackBar, private activatedRoute: ActivatedRoute) {}

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
    return this.commonBuildingRegisterHelper.getValueFromStatus(this.fields, column, this.building[column]) ?? 'Unknown';
  }

  private prepareWhereCase() {
    return `GlobalID='${this.id}'`;
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
    this.building = res.data.features.map((feature: any) => feature.attributes)[0];
    this.fillSections();
    this.isLoadingResults = false;
  }

  private fillSections() {
    this.sections.forEach(section => {
      section.entries.forEach(entry => {
        entry.title = this.getTitle(entry.propName);
        entry.value = entry.propName === 'BldMunicipality' ? this.getMunicipality() : this.getValueFromStatus(entry.propName);
      });
    });
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
