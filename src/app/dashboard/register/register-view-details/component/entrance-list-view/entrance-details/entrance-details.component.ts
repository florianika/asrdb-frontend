import {CommonModule} from '@angular/common';
import {Component, Inject, isDevMode, OnInit,} from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatSnackBar} from '@angular/material/snack-bar';
import {catchError, of as observableOf, Subject, takeUntil} from 'rxjs';
import {BuildingDetailComponent} from '../../building-detail/building-detail.component';
import {QueryFilter} from 'src/app/dashboard/register/model/query-filter';
import {CommonEntranceService} from 'src/app/dashboard/common/service/common-entrance.service';
import {CommonRegisterHelperService} from 'src/app/dashboard/common/service/common-helper.service';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {Log} from '../../../../register-log-view/model/log';
import {HistoryDetailsComponent} from '../../history-details/history-details.component';
import {RegisterMapComponent} from '../../../../../common/components/register-map/register-map.component';
import {DwellingListViewComponent} from '../../dwelling-list-view/dwelling-list-view.component';
import {CommonStreetService} from '../../../../../common/service/common-street.service';
import {MatIcon} from '@angular/material/icon';
import {Router} from '@angular/router';
import {
  CommonEntityStructureService,
  EntityAttribute,
} from '../../../../../common/service/common-entity-structure.service';
import {SectionField} from '../../../../constant/common-constants';
import {ENTRANCE_ENTITY} from '../../../../../../common/constants/common-constants';
import {RegisterLogService} from "../../../../register-log-view/register-log-table/register-log.service";
import {CommonBuildingService} from "../../../../../common/service/common-building.service";

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
    DwellingListViewComponent,
    MatIcon,
  ],
  standalone: true,
})
export class EntranceDetailsComponent implements OnInit {
  isLoadingResults = true;
  entrance: any;
  titleSection: SectionField[] = [];

  sections = [
    {
      title: 'Identifying variables',
      entries: [] as SectionField[],
    },
    {
      title: 'Describing variables',
      entries: [] as SectionField[],
    },
  ];

  private subscriber = new Subject();
  private logs: Log[] = [];
  private fields: any[] = [];
  protected id: string | null = '';
  protected buildingGlobalId = '';
  protected building;

  constructor(
    private commonEntranceService: CommonEntranceService,
    private commonBuildingService: CommonBuildingService,
    private commonBuildingRegisterHelper: CommonRegisterHelperService,
    private commonStreetService: CommonStreetService,
    private registerLogService: RegisterLogService,
    private matSnack: MatSnackBar,
    private commonEntityStructureService: CommonEntityStructureService,
    private router: Router,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      globalId: string;
      logs: Log[];
      buildingGlobalId: string;
      building: any;
    }
  ) {
    this.id = this.data.globalId;
    this.logs = this.registerLogService
      .getAllLogs(ENTRANCE_ENTITY)
      .filter(log =>
        this.id!.toLowerCase().includes(log.entId?.toLowerCase() as string)
      );
    this.buildingGlobalId = this.data.buildingGlobalId;
    this.building = this.data.building;
    this.commonEntityStructureService.structureLoaded
      .pipe(takeUntil(this.subscriber))
      .subscribe(response => {
        if (!response.loading && response.structure && response.type === ENTRANCE_ENTITY) {
          this.prepareStructure(response.structure);
        }
      });
  }

  ngOnInit(): void {
    this.registerLogService.logs.subscribe(log => {
      this.logs = log.filter(l =>
        this.id!.toLowerCase().includes(l.entId?.toLowerCase() as string)
      );
      this.fillSections();
    })
    this.loadEntrance()
      .pipe(takeUntil(this.subscriber))
      .subscribe(res => this.handleResponse(res));
  }

  getTitle(column: string) {
    return this.commonBuildingRegisterHelper.getTitle(this.fields, column);
  }

  getValueFromStatus(column: string) {
    return (
      this.commonBuildingRegisterHelper.getValueFromStatus(
        this.fields,
        column,
        this.entrance[column]
      ) ?? 'Unknown'
    );
  }

  dwellingUpdated() {
    this.markEntranceAsUntestedData();
  }

  dwellingDeleted() {
    this.loadEntrance()
      .pipe(takeUntil(this.subscriber))
      .subscribe(res => this.handleResponse(res));
    this.registerLogService.loadLogs(this.buildingGlobalId);
  }

  openEditView() {
    void this.router.navigateByUrl(
      `/dashboard/register/form/ENTRANCE/${this.buildingGlobalId}?entranceId=${this.id}`
    );
  }

  private markEntranceAsUntestedData() {
    if (this.id) {
      // Update entrance
      this.commonEntranceService.resetStatus(this.id);

      // Update building
      this.commonBuildingService.resetStatus(this.buildingGlobalId!, () => {
        setTimeout(() => {
          this.loadEntrance()
            .pipe(takeUntil(this.subscriber))
            .subscribe(res => this.handleResponse(res));
          this.registerLogService.loadLogs(this.buildingGlobalId);
        }, 500);
      });
    }
  }

  private prepareWhereCase() {
    return `GlobalID='${this.id}'`;
  }

  private handleResponse(res: any) {
    if (isDevMode()) {
      console.log('Entrance', res);
    }
    if (!res) {
      this.matSnack.open('Could not load result. Please try again', 'Ok', {
        duration: 3000,
      });
      this.isLoadingResults = false;
      return;
    }
    if (res.data.fields.length) {
      this.fields = res.data.fields;
    }

    const entrance = res.data.features.map(
      (feature: any) => feature.attributes
    )[0];
    const streetId = entrance.EntStrGlobalID?.replace('{', '').replace('}', '');

    if (!streetId) {
      this.data = entrance;
      this.entrance = entrance;
      this.commonEntityStructureService.getEntityStructure(ENTRANCE_ENTITY);
      return;
    }

    this.commonStreetService
      .getStreets({
        where: `GlobalID = '${streetId}'`,
        outFields: ['GlobalID', 'StrNameCore'],
      })
      .subscribe(streetRes => {
        const street = streetRes.data.features.map(
          (feature: any) => feature.attributes
        )[0];
        entrance.EntStrGlobalID = street?.StrNameCore;
        this.data = entrance;
        this.isLoadingResults = false;

        this.entrance = res.data.features.map(
          (feature: any) => feature.attributes
        )[0];
        this.commonEntityStructureService.getEntityStructure(ENTRANCE_ENTITY);
      });
  }

  private fillSections() {
    this.sections.forEach(section => {
      section.entries.forEach((entry: SectionField) => {
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
      where: this.prepareWhereCase(),
    } as Partial<QueryFilter>;
    return this.commonEntranceService.getEntranceData(filter).pipe(
      catchError(err => {
        console.log(err);
        this.matSnack.open('Could not load entrance. Please try again.', 'Ok', {
          duration: 3000,
        });
        return observableOf(null);
      })
    );
  }

  private prepareStructure(structure: EntityAttribute[]) {
    const visibleFields = structure.reduce(
      (acc, attr: EntityAttribute) => {
        if (attr.section !== 'none' && !attr.internal) {
          if (attr.section === 'identification') {
            acc.identifying.push({
              title: attr.label.en,
              propName: attr.name,
              value: '',
              log: '',
              logType: '',
            } as SectionField);
          } else if (attr.section === 'description') {
            acc.describing.push({
              title: attr.label.en,
              propName: attr.name,
              value: '',
              log: '',
              logType: '',
            } as SectionField);
          } else if (attr.section === 'title') {
            acc.title.push({
              title: attr.label.en,
              propName: attr.name,
              value: '',
              log: '',
              logType: '',
            } as SectionField);
          }
        }
        return acc;
      },
      {
        technical: [] as SectionField[],
        identifying: [] as SectionField[],
        describing: [] as SectionField[],
        title: [] as SectionField[],
      }
    );

    this.sections[0].entries = visibleFields.identifying;
    this.sections[1].entries = visibleFields.describing;
    this.titleSection = visibleFields.title;

    this.fillSections();
    this.isLoadingResults = false;
  }
}
