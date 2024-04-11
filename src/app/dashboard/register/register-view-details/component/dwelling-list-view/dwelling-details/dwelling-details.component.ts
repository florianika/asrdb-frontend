import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, isDevMode } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, catchError, of as observableOf } from 'rxjs';
import { BuildingDetailComponent } from '../../building-detail/building-detail.component';
import { QueryFilter } from 'src/app/dashboard/register/model/query-filter';
import { CommonDwellingService } from 'src/app/dashboard/register/service/common-dwellings.service';
import { CommonRegisterHelperService } from 'src/app/dashboard/register/service/common-helper.service';
import {getDate} from "../../../../model/common-utils";
import {Log} from "../../../../register-log-view/model/log";

@Component({
  selector: 'asrdb-dwelling-details',
  templateUrl: './dwelling-details.component.html',
  styleUrls: ['./dwelling-details.component.css'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    BuildingDetailComponent
  ],
  standalone: true
})
export class DwellingDetailsComponent implements OnInit {
  isLoadingResults = true;
  dwelling: any;

  private readonly STREET_NAME = 'Street name';
  private readonly BUILDING_NUMBER = 'Building number';
  private readonly ENTRANCE_NUMBER = 'Entrance number';

  sections = [
    {
      title: 'Technical variables',
      entries: [
        {
          title: '',
          propName: 'GlobalID',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'DwlEntranceID',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'DwlCensus2023',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'DwlAddressID',
          value: '',
          log: ''
        }
      ],
    },
    {
      title: 'Identifying variables',
      entries: [
        {
          title: this.STREET_NAME,
          propName: '',
          value: '',
          log: ''
        },
        {
          title: this.BUILDING_NUMBER,
          propName: '',
          value: '',
          log: ''
        },
        {
          title: this.ENTRANCE_NUMBER,
          propName: '',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'DwlFloor',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'DwlApartNumber',
          value: '',
          log: ''
        }
      ]
    },
    {
      title: 'Describing variables',
      entries: [
        {
          title: '',
          propName: 'DwlStatus',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'DwlYearConstruction',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'DwlYearElimination',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'DwlType',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'DwlOwnership',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'DwlOccupancy',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'DwlSurface',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'DwlWaterSupply',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'DwlToilet',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'DwlBath',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'DwlHeatingFacility',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'DwlHeatingEnergy',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'DwlAirConditioner',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'DwlSolarPanel',
          value: '',
          log: ''
        }
      ]
    }
  ];

  private subscriber = new Subject();
  private fields: any[] = [];
  private id: string | null = '';
  private logs: Log[] = [];

  constructor(
    private commonEntranceService: CommonDwellingService,
    private commonBuildingRegisterHelper: CommonRegisterHelperService,
    private matSnack: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: {globalId: string, logs: Log[], streetName: string, buildingNumber: string, entranceNumber: string}) {
      this.id = this.data.globalId;
      this.logs = this.data.logs;
    }

  ngOnInit(): void {
    this.loadDwelling().pipe(takeUntil(this.subscriber)).subscribe((res) => this.handleResponse(res));
  }

  getTitle(column: string) {
    return this.commonBuildingRegisterHelper.getTitle(this.fields, column);
  }

  getValueFromStatus(column: string) {
    return this.commonBuildingRegisterHelper.getValueFromStatus(this.fields, column, this.dwelling[column]) ?? 'Unknown';
  }

  private prepareWhereCase() {
    return `GlobalID='${this.id}'`;
  }

  private async handleResponse(res: any) {
    if (isDevMode()) {
      console.log('Dwelling', res);
    }
    if (!res) {
      this.matSnack.open('Could not load result. Please try again', 'Ok', {duration: 3000});
      this.isLoadingResults = false;
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
        if (entry.propName !== '') {
          entry.title = this.getTitle(entry.propName);
          entry.value = this.getValueFromStatus(entry.propName);
          entry.log = this.logs.find(log => log.Variable === entry.propName)
            ?.QualityMessageEn ?? '';
        } else if (entry.title === this.STREET_NAME) {
          entry.value = this.data.streetName;
        } else if (entry.title === this.BUILDING_NUMBER) {
          entry.value = this.data.buildingNumber;
        } else if (entry.title === this.ENTRANCE_NUMBER) {
          entry.value = this.data.entranceNumber;
        }
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

  protected readonly getDate = getDate;
}
