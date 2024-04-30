import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, isDevMode } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, catchError, of as observableOf } from 'rxjs';
import { BuildingDetailComponent } from '../../building-detail/building-detail.component';
import { QueryFilter } from 'src/app/dashboard/register/model/query-filter';
import { CommonDwellingService } from 'src/app/dashboard/common/service/common-dwellings.service';
import { CommonRegisterHelperService } from 'src/app/dashboard/common/service/common-helper.service';
import {getDate} from "../../../../model/common-utils";
import {Log} from "../../../../register-log-view/model/log";
import {HistoryDetailsComponent} from "../../history-details/history-details.component";

@Component({
  selector: 'asrdb-dwelling-details',
  templateUrl: './dwelling-details.component.html',
  styleUrls: ['./dwelling-details.component.css'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    BuildingDetailComponent,
    HistoryDetailsComponent
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
          log: '',
logType: ''
        },
        {
          title: '',
          propName: 'DwlEntranceID',
          value: '',
          log: '',
logType: ''
        },
        {
          title: '',
          propName: 'DwlCensus2023',
          value: '',
          log: '',
logType: ''
        },
        {
          title: '',
          propName: 'DwlAddressID',
          value: '',
          log: '',
logType: ''
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
          log: '',
logType: ''
        },
        {
          title: this.BUILDING_NUMBER,
          propName: '',
          value: '',
          log: '',
logType: ''
        },
        {
          title: this.ENTRANCE_NUMBER,
          propName: '',
          value: '',
          log: '',
logType: ''
        },
        {
          title: '',
          propName: 'DwlFloor',
          value: '',
          log: '',
logType: ''
        },
        {
          title: '',
          propName: 'DwlApartNumber',
          value: '',
          log: '',
logType: ''
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
          log: '',
logType: ''
        },
        {
          title: '',
          propName: 'DwlYearConstruction',
          value: '',
          log: '',
logType: ''
        },
        {
          title: '',
          propName: 'DwlYearElimination',
          value: '',
          log: '',
logType: ''
        },
        {
          title: '',
          propName: 'DwlType',
          value: '',
          log: '',
logType: ''
        },
        {
          title: '',
          propName: 'DwlOwnership',
          value: '',
          log: '',
logType: ''
        },
        {
          title: '',
          propName: 'DwlOccupancy',
          value: '',
          log: '',
logType: ''
        },
        {
          title: '',
          propName: 'DwlSurface',
          value: '',
          log: '',
logType: ''
        },
        {
          title: '',
          propName: 'DwlWaterSupply',
          value: '',
          log: '',
logType: ''
        },
        {
          title: '',
          propName: 'DwlToilet',
          value: '',
          log: '',
logType: ''
        },
        {
          title: '',
          propName: 'DwlBath',
          value: '',
          log: '',
logType: ''
        },
        {
          title: '',
          propName: 'DwlHeatingFacility',
          value: '',
          log: '',
logType: ''
        },
        {
          title: '',
          propName: 'DwlHeatingEnergy',
          value: '',
          log: '',
logType: ''
        },
        {
          title: '',
          propName: 'DwlAirConditioner',
          value: '',
          log: '',
logType: ''
        },
        {
          title: '',
          propName: 'DwlSolarPanel',
          value: '',
          log: '',
logType: ''
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

  private handleResponse(res: any) {
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
          const log = this.logs.find(log => log.variable === entry.propName);
          entry.log = log?.qualityMessageEn ?? '';
          entry.logType = log?.qualityAction ?? '';
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
