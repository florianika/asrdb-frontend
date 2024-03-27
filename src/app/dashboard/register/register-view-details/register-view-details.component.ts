import { Component, OnDestroy, OnInit, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { BuildingDetailComponent } from './component/building-detail/building-detail.component';
import { EntranceListViewComponent } from './component/entrance-list-view/entrance-list-view.component';
import { DwellingListViewComponent } from './component/dwelling-list-view/dwelling-list-view.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, catchError, of } from 'rxjs';
import { QueryFilter } from '../model/query-filter';
import { CommonBuildingService } from '../service/common-building.service';
import { CommonRegisterHelperService } from '../service/common-helper.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Entrance } from '../model/entrance';
import { RegisterMapComponent } from '../register-table-view/register-map/register-map.component';
import { RegisterFilterService } from '../register-table-view/register-filter.service';

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
          value: ''
        },
        {
          title: '',
          propName: 'BldCensus2023',
          value: ''
        },
        {
          title: '',
          propName: 'BldAddressID',
          value: ''
        },
      ]
    },
    {
      title: 'Identifying variables',
      entries: [
        {
          title: '',
          propName: 'BldMunicipality',
          value: ''
        },
        {
          title: '',
          propName: 'BldEnumArea',
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
        {
          title: '',
          propName: 'BldCentroidStatus',
          value: ''
        },
        {
          title: '',
          propName: 'BldCadastralZone',
          value: ''
        },
        {
          title: '',
          propName: 'BldProperty',
          value: ''
        },
        {
          title: '',
          propName: 'BldPermitNumber',
          value: ''
        },
        {
          title: '',
          propName: 'BldPermitDate',
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
      ]
    },
    {
      title: 'Describing variables',
      entries: [
        {
          title: '',
          propName: 'BldStatus',
          value: ''
        },
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
          propName: 'BldType',
          value: ''
        },
        {
          title: '',
          propName: 'BldClass',
          value: ''
        },
        {
          title: '',
          propName: 'BldArea',
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
          propName: 'BldHeight',
          value: ''
        },
        {
          title: '',
          propName: 'BldVolume',
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
        {
          title: '',
          propName: 'BldElectricity',
          value: ''
        },
        {
          title: '',
          propName: 'BldPipedGas',
          value: ''
        },
        {
          title: '',
          propName: 'BldElevator',
          value: ''
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
    private matSnack: MatSnackBar,
    private router: Router,
    private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.id = this.activatedRoute.snapshot.paramMap.get('id') ?? '';
    this.loadBuildings().pipe(takeUntil(this.subscriber)).subscribe((res) => this.handleResponse(res));
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

  getDate(date: string) {
    const d = new Date(date);
    return d.getDate().toString().padStart(2, '0')
      + '/'
      + (d.getMonth() + 1).toString().padStart(2, '0')
      + '/'
      + d.getFullYear();
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
      return of(null);
    }));
  }
}
