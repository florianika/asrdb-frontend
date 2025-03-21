import { CommonModule } from '@angular/common';
import {Component, Inject, OnInit, isDevMode, Output, EventEmitter} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, catchError, of as observableOf } from 'rxjs';
import { BuildingDetailComponent } from '../../building-detail/building-detail.component';
import { QueryFilter } from 'src/app/dashboard/register/model/query-filter';
import { CommonEntranceService } from 'src/app/dashboard/common/service/common-entrance.service';
import { CommonRegisterHelperService } from 'src/app/dashboard/common/service/common-helper.service';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {getDate} from "../../../../model/common-utils";
import {Log} from "../../../../register-log-view/model/log";
import {HistoryDetailsComponent} from "../../history-details/history-details.component";
import {RegisterMapComponent} from "../../../../../common/components/register-map/register-map.component";
import {DwellingListViewComponent} from "../../dwelling-list-view/dwelling-list-view.component";

@Component({
  selector: 'asrdb-entrance-details',
  templateUrl: './entrance-details.component.html',
  styleUrls: ['./entrance-details.component.css'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    BuildingDetailComponent,
    HistoryDetailsComponent,
    RegisterMapComponent,
    DwellingListViewComponent
  ],
  standalone: true
})
export class EntranceDetailsComponent implements OnInit {
  isLoadingResults = true;
  entrance: any;

  sections = [
    {
      title: 'Technical variables',
      entries: [
        {
          title: '',
          propName: 'EntCensus2023',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'EntAddressID',
          value: '',
          log: '',
          logType: ''
        },
      ]
    },
    {
      title: 'Identifying variables',
      entries: [
        {
          title: '',
          propName: 'EntPointStatus',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'EntStreet',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'EntBuildingNumber',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'EntEntranceNumber',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'EntTown',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'EntZipCode',
          value: '',
          log: '',
          logType: ''
        },
      ]
    },
    {
      title: 'Describing variables',
      entries: [
        {
          title: '',
          propName: 'EntDwellingRecs',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'EntDwellingExpec',
          value: '',
          log: '',
          logType: ''
        },
      ]
    }
  ];

  private subscriber = new Subject();
  private logs: Log[] = [];
  private fields: any[] = [];
  protected id: string | null = '';
  protected buildingGlobalId = '';
  protected building;

  @Output() markEntranceAsUntestedData = new EventEmitter<string>();

  constructor(
    private commonEntranceService: CommonEntranceService,
    private commonBuildingRegisterHelper: CommonRegisterHelperService,
    private matSnack: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: {globalId: string, logs: Log[], buildingGlobalId: string, building: any}) {
      this.id = this.data.globalId;
      this.logs = this.data.logs;
      this.buildingGlobalId = this.data.buildingGlobalId;
      this.building = this.data.building;
    }

  ngOnInit(): void {
    this.loadEntrance().pipe(takeUntil(this.subscriber)).subscribe((res) => this.handleResponse(res));
  }

  getTitle(column: string) {
    return this.commonBuildingRegisterHelper.getTitle(this.fields, column);
  }

  getValueFromStatus(column: string) {
    return this.commonBuildingRegisterHelper.getValueFromStatus(this.fields, column, this.entrance[column]) ?? 'Unknown';
  }

  dwellingUpdated(id: string) {
    this.markEntranceAsUntestedData.emit(id);
  }

  private prepareWhereCase() {
    return `GlobalID='${this.id}'`;
  }

  private handleResponse(res: any) {
    if (isDevMode()) {
      console.log('Entrance', res);
    }
    if (!res) {
      this.matSnack.open('Could not load result. Please try again', 'Ok', {duration: 3000});
      this.isLoadingResults = false;
      return;
    }
    if (res.data.fields.length) {
      this.fields = res.data.fields;
    }
    this.entrance = res.data.features.map((feature: any) => feature.attributes)[0];
    this.fillSections();
    this.isLoadingResults = false;
  }

  private fillSections() {
    this.sections.forEach(section => {
      section.entries.forEach(entry => {
        entry.title = this.getTitle(entry.propName);
        entry.value = this.getValueFromStatus(entry.propName);
        const log = this.logs.find(log => log.variable === entry.propName);
        entry.log = log?.qualityMessageEn ?? '';
        entry.logType = log?.qualityAction ?? '';
      });
    });
  }

  private loadEntrance() {
    this.isLoadingResults = true;
    const filter = {
      where: this.prepareWhereCase()
    } as Partial<QueryFilter>;
    return this.commonEntranceService.getEntranceData(filter).pipe(catchError((err) => {
      console.log(err);
      this.matSnack.open('Could not load entrance. Please try again.', 'Ok', {
        duration: 3000
      });
      return observableOf(null);
    }));
  }

  protected readonly getDate = getDate;
}
