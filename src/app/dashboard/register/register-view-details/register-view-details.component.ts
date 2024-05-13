import { Component, OnDestroy, OnInit, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { BuildingDetailComponent } from './component/building-detail/building-detail.component';
import { EntranceListViewComponent } from './component/entrance-list-view/entrance-list-view.component';
import { DwellingListViewComponent } from './component/dwelling-list-view/dwelling-list-view.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import {Subject, takeUntil, catchError, of} from 'rxjs';
import { QueryFilter } from '../model/query-filter';
import { CommonBuildingService } from '../../common/service/common-building.service';
import { CommonRegisterHelperService } from '../../common/service/common-helper.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Entrance } from '../model/entrance';
import { RegisterMapComponent } from '../../common/components/register-map/register-map.component';
import { RegisterFilterService } from '../register-table-view/register-filter.service';
import {RegisterLogService} from "../register-log-view/register-log-table/register-log.service";
import {getDate} from "../model/common-utils";
import {MatTooltipModule} from "@angular/material/tooltip";
import {CommonEntranceService} from "../../common/service/common-entrance.service";
import {HistoryDetailsComponent} from "./component/history-details/history-details.component";

@Component({
  selector: 'asrdb-register-view-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    BuildingDetailComponent,
    EntranceListViewComponent,
    DwellingListViewComponent,
    RegisterMapComponent,
    MatTooltipModule,
    HistoryDetailsComponent
  ],
  providers: [
    RegisterLogService
  ],
  templateUrl: './register-view-details.component.html',
  styleUrls: ['./register-view-details.component.css']
})
export class RegisterViewDetailsComponent implements OnInit, OnDestroy {
  isLoadingResults = true;
  building: any;
  selectedEntrance: string | undefined;
  id?: string = '';

  sections = [
    {
      title: 'Technical variables',
      entries: [
        {
          title: '',
          propName: 'BldID',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldCensus2023',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldAddressID',
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
          propName: 'BldMunicipality',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldEnumArea',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldCadastralZone',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldProperty',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldPermitNumber',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldPermitDate',
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
          propName: 'BldStatus',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldYearConstruction',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldYearDemolition',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldType',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldClass',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldArea',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldFloorsAbove',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldFloorsUnder',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldHeight',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldVolume',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldEntranceRecs',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldDwellingRecs',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldPipedWater',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldRainWater',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldWasteWater',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldElectricity',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldPipedGas',
          value: '',
          log: '',
          logType: ''
        },
        {
          title: '',
          propName: 'BldElevator',
          value: '',
          log: '',
          logType: ''
        },
      ]
    }
  ];
  loadedEntrances: Entrance[] = [];

  private destroy$ = new Subject();
  private fields: any[] = [];

  constructor(
    private commonBuildingService: CommonBuildingService,
    private commonEntranceService: CommonEntranceService,
    private commonBuildingRegisterHelper: CommonRegisterHelperService,
    private registerFilterService: RegisterFilterService,
    private registerLogService: RegisterLogService,
    private matSnack: MatSnackBar,
    private router: Router,
    private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.id = this.activatedRoute.snapshot.paramMap.get('id') ?? '';
    if (this.id) {
      this.registerLogService.loadLogs(this.id);
      this.loadBuildingData();
    } else {
      void this.router.navigateByUrl('dashboard/register');
    }
    this.registerLogService.logs.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.fields.length) {
        this.fillSections();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  getTitle(column: string) {
    return this.commonBuildingRegisterHelper.getTitle(this.fields, column);
  }

  getMunicipality() {
    return this.commonBuildingRegisterHelper.getMunicipality(this.fields, 'BldMunicipality', this.building.BldMunicipality.toString());
  }

  getValueFromStatus(column: string) {
    return this.commonBuildingRegisterHelper.getValueFromStatus(this.fields, column, this.building[column]) ?? 'Unknown';
  }

  editBuilding(globalId: string) {
    this.router.navigateByUrl('dashboard/register/form/BUILDING/' + globalId);
  }

  setEntrances(entrances: Entrance[]) {
    this.loadedEntrances = entrances;
  }

  setSelectedEntrance(entranceId: string) {
    this.selectedEntrance = entranceId;
  }

  markEntranceAsUntestedData(entranceId: string) {
    const entrance = this.loadedEntrances.find(entrance => entrance.GlobalID === entranceId);
    if (entrance) {
      // Update entrance
      this.commonEntranceService.resetStatus(entranceId);

      // Update building
      this.commonBuildingService.resetStatus(this.id!, () => {
        setTimeout(() => {
          this.loadBuildingData();
        }, 500);
      });
    }
  }

  gotToLogs() {
    this.router.navigateByUrl('dashboard/register/logs?buildings=' + this.id);
  }

  private prepareWhereCase() {
    return `GlobalID='${this.id}'`;
  }

  private handleResponse(res: any) {
    if (isDevMode()) {
      console.log('Data', res);
    }
    if (!res) {
      this.matSnack.open('Could not load result. Please try again', 'Ok', {duration: 3000});
      this.isLoadingResults = false;
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
        entry.value = this.getValue(entry);
        entry.log = this.registerLogService.getLogForVariable('BUILDING', entry.propName, this.id)
          ?.qualityMessageEn ?? '';
        entry.logType = this.registerLogService.getLogForVariable('BUILDING', entry.propName, this.id)
          ?.qualityAction ?? '';
      });
    });
  }

  private getValue(entry: any) {
    return entry.propName === 'BldMunicipality' ? this.getMunicipality() :
      this.getValueFromStatus(entry.propName);
  }

  private loadBuilding() {
    this.isLoadingResults = true;
    const filter = {
      where: this.prepareWhereCase()
    } as Partial<QueryFilter>;
    return this.commonBuildingService.getBuildingData(filter).pipe(catchError((err) => {
      console.log(err);
      this.matSnack.open('Could not load building. Please try again.', 'Ok', {
        duration: 3000
      });
      return of(null);
    }));
  }

  private loadBuildingData() {
    this.loadBuilding().pipe(takeUntil(this.destroy$)).subscribe((res) => this.handleResponse(res));
  }

  protected readonly getDate = getDate;
}
