import { Component, OnInit, isDevMode } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, catchError, of as observableOf } from 'rxjs';
import { QueryFilter } from 'src/app/dashboard/common/model/query-filter';
import { CommonDwellingService } from 'src/app/dashboard/common/service/common-dwellings.service';
import { CommonBuildingRegisterHelper } from 'src/app/dashboard/common/service/common-helper.service';

@Component({
  selector: 'asrdb-dwelling-details',
  templateUrl: './dwelling-details.component.html',
  styleUrls: ['./dwelling-details.component.css']
})
export class DwellingDetailsComponent implements OnInit {
  isLoadingResults = true;
  dwelling: any;

  sections = [
    {
      title: 'General details',
      entries: [
        {
          title: '',
          propName: 'DwlEntranceID',
          value: ''
        },
        {
          title: '',
          propName: 'DwlCensus2023',
          value: ''
        },
        {
          title: '',
          propName: 'DwlAddressID',
          value: ''
        },
        {
          title: '',
          propName: 'DwlFloor',
          value: ''
        },
        {
          title: '',
          propName: 'DwlApartNumber',
          value: ''
        },
        {
          title: '',
          propName: 'DwlStatus',
          value: ''
        },
        {
          title: '',
          propName: 'DwlYearConstruction',
          value: ''
        },
        {
          title: '',
          propName: 'DwlYearElimination',
          value: ''
        },
        {
          title: '',
          propName: 'DwlType',
          value: ''
        },
        {
          title: '',
          propName: 'DwlOwnership',
          value: ''
        },
        {
          title: '',
          propName: 'DwlOccupancy',
          value: ''
        },
        {
          title: '',
          propName: 'DwlSurface',
          value: ''
        },
      ],
    },
    {
      title: 'Facilities',
      entries: [
        {
          title: '',
          propName: 'DwlWaterSupply',
          value: ''
        },
        {
          title: '',
          propName: 'DwlToilet',
          value: ''
        },
        {
          title: '',
          propName: 'DwlBath',
          value: ''
        },
        {
          title: '',
          propName: 'DwlHeatingFacility',
          value: ''
        },
        {
          title: '',
          propName: 'DwlHeatingEnergy',
          value: ''
        },
        {
          title: '',
          propName: 'DwlAirConditioner',
          value: ''
        },
        {
          title: '',
          propName: 'DwlSolarPanel',
          value: ''
        },
      ]
    }
  ]

  private subscriber = new Subject();
  private fields: any[] = [];
  private id: string | null = '';

  constructor(private commonEntranceService: CommonDwellingService, private commonBuildingRegisterHelper: CommonBuildingRegisterHelper, private matSnack: MatSnackBar, private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.id = this.activatedRoute.snapshot.paramMap.get('id');
    this.loadDwelling().pipe(takeUntil(this.subscriber)).subscribe((res) => this.handleResponse(res));
  }

  getTitle(column: string) {
    return this.commonBuildingRegisterHelper.getTitle(this.fields, column);
  }

  getValueFromStatus(column: string) {
    return this.commonBuildingRegisterHelper.getValueFromStatus(this.fields, column, this.dwelling[column]) ?? "Unknown";
  }

  private prepareWhereCase() {
    return `GlobalID='${this.id}'`;
  }

  private async handleResponse(res: any) {
    if (isDevMode()) {
      console.log("Dwelling", res);
    }
    if (!res) {
      return;
    }
    if (res.data.fields.length) {
      this.fields = res.data.fields;
    }
    this.dwelling = res.data.features.map((feature: any) => feature.attributes)[0];
    this.fillSections();
    this.isLoadingResults = false;
  }

  private fillSections() {
    this.sections.forEach(section => {
      section.entries.forEach(entry => {
        entry.title = this.getTitle(entry.propName);
        entry.value = this.getValueFromStatus(entry.propName);
      });
    });
  }

  private loadDwelling() {
    this.isLoadingResults = true;
    const filter = {
      where: this.prepareWhereCase()
    } as Partial<QueryFilter>;
    return this.commonEntranceService.getDwellings(filter).pipe(catchError((err) => {
      console.log(err);
      this.matSnack.open('Could not load entrance. Please try again.', 'Ok', {
        duration: 3000
      });
      return observableOf(null);
    }));
  }
}
