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
import { CommonBuildingService } from '../service/common-building.service';
import { CommonRegisterHelperService } from '../service/common-helper.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Entrance } from '../model/entrance';
import { RegisterMapComponent } from '../register-table-view/register-map/register-map.component';
import { RegisterFilterService } from '../register-table-view/register-filter.service';
import {RegisterLogService} from "../register-log-view/register-log-table/register-log.service";
import {getDate} from "../model/common-utils";

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
    RegisterMapComponent
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
          log: ''
        },
        {
          title: '',
          propName: 'BldCensus2023',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldAddressID',
          value: '',
          log: ''
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
          log: ''
        },
        {
          title: '',
          propName: 'BldEnumArea',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldLatitude',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldLongitude',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldCentroidStatus',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldCadastralZone',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldProperty',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldPermitNumber',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldPermitDate',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldDwellingRecs',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldEntranceRecs',
          value: '',
          log: ''
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
          log: ''
        },
        {
          title: '',
          propName: 'BldYearConstruction',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldYearDemolition',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldType',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldClass',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldArea',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldFloorsAbove',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldFloorsUnder',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldHeight',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldVolume',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldDwellingRecs',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldEntranceRecs',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldPipedWater',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldRainWater',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldWasteWater',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldElectricity',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldPipedGas',
          value: '',
          log: ''
        },
        {
          title: '',
          propName: 'BldElevator',
          value: '',
          log: ''
        },
      ]
    }
  ];
  loadedEntrances: Entrance[] = [];

  private subscriber = new Subject();
  private fields: any[] = [];

  constructor(
    private commonBuildingService: CommonBuildingService,
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
      this.loadBuildings().pipe(takeUntil(this.subscriber)).subscribe((res) => this.handleResponse(res));
    }
    this.registerLogService.logs.subscribe(() => {
      if (this.fields.length) {
        this.fillSections();
      }
    });
  }
  ngOnDestroy(): void {
    this.subscriber.next(true);
    this.subscriber.complete();
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

  editBuilding(globalId: string) {
    this.router.navigateByUrl('dashboard/register/form/BUILDING/' + globalId);
  }

  setEntrances(entrances: Entrance[]) {
    this.loadedEntrances = entrances;
  }

  setSelectedEntrance(entranceId: string) {
    this.selectedEntrance = entranceId;
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
        entry.log = this.registerLogService.getLogForVariable('BUILDING', entry.propName)
          ?.QualityMessageEn ?? '';
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
      return of(null);
    }));
  }

  protected readonly getDate = getDate;
}
