import { CommonModule } from '@angular/common';
import { Component, Inject, isDevMode, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, of as observableOf, Subject, takeUntil } from 'rxjs';
import { BuildingDetailComponent } from '../../building-detail/building-detail.component';
import { QueryFilter } from 'src/app/dashboard/register/model/query-filter';
import { CommonDwellingService } from 'src/app/dashboard/common/service/common-dwellings.service';
import { CommonRegisterHelperService } from 'src/app/dashboard/common/service/common-helper.service';
import { Log } from '../../../../register-log-view/model/log';
import { HistoryDetailsComponent } from '../../history-details/history-details.component';
import { DwellingDetailsFormComponent } from '../../../../register-form/dwelling-details-form/dwelling-details-form.component';
import { MatIcon } from '@angular/material/icon';
import {
  CommonEntityStructureService,
  EntityAttribute,
} from '../../../../../common/service/common-entity-structure.service';
import { SectionField } from '../../../../constant/common-constants';
import { DWELLING_ENTITY } from '../../../../../../common/constants/common-constants';

export type DwellingDetailsData = {
  globalId: string;
  logs: Log[];
  streetName: string;
  buildingNumber: string;
  entranceNumber: string;
  entranceId?: string;
  entrances?: any[];
};

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
    HistoryDetailsComponent,
    MatIcon,
  ],
  standalone: true,
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
      entries: [] as SectionField[],
    },
    {
      title: 'Identifying variables',
      entries: [] as SectionField[],
    },
    {
      title: 'Describing variables',
      entries: [] as SectionField[],
    },
  ];
  titleSection = [] as SectionField[];

  private subscriber = new Subject();
  private fields: any[] = [];
  private id: string | null = '';
  private logs: Log[] = [];
  private entrances: any[] = [];
  private entranceId: string | null = null;

  constructor(
    private commonEntranceService: CommonDwellingService,
    private commonBuildingRegisterHelper: CommonRegisterHelperService,
    private matSnack: MatSnackBar,
    private matDialog: MatDialog,
    private commonEntityStructureService: CommonEntityStructureService,
    @Inject(MAT_DIALOG_DATA) public data: DwellingDetailsData
  ) {
    this.id = this.data.globalId;
    this.logs = this.data.logs;
    this.entrances = this.data.entrances ?? [];
    this.entranceId = this.data.entranceId ?? null;
    this.commonEntityStructureService.structureLoaded
      .pipe(takeUntil(this.subscriber))
      .subscribe(response => {
        if (!response.loading && response.structure) {
          this.prepareStructure(response.structure);
        }
      });
  }

  ngOnInit(): void {
    this.loadDwelling()
      .pipe(takeUntil(this.subscriber))
      .subscribe(res => this.handleResponse(res));
  }

  getValueFromStatus(column: string) {
    return (
      this.commonBuildingRegisterHelper.getValueFromStatus(
        this.fields,
        column,
        this.dwelling[column]
      ) ?? 'Unknown'
    );
  }

  editDwellingDetails() {
    this.matDialog
      .open(DwellingDetailsFormComponent, {
        data: {
          entrances: this.entrances,
          id: this.id,
          entranceId: this.entranceId,
          logs: this.logs,
        },
      })
      .afterClosed()
      .subscribe(() => {
        this.loadDwelling()
          .pipe(takeUntil(this.subscriber))
          .subscribe(res => this.handleResponse(res));
      });
  }

  private prepareWhereCase() {
    return `GlobalID='${this.id}'`;
  }

  private handleResponse(res: any) {
    if (isDevMode()) {
      console.log('Dwelling', res);
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
    this.dwelling = res.data.features.map(
      (feature: any) => feature.attributes
    )[0];
    this.commonEntityStructureService.getEntityStructure(DWELLING_ENTITY);
  }

  private fillSections() {
    this.sections.forEach(section => {
      section.entries.forEach(entry => {
        if (entry.propName !== '') {
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
      where: this.prepareWhereCase(),
    } as Partial<QueryFilter>;
    return this.commonEntranceService.getDwellings(filter).pipe(
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
          if (attr.section === 'technical') {
            acc.technical.push({
              title: attr.label.en,
              propName: attr.name,
              value: '',
              log: '',
              logType: '',
            } as SectionField);
          } else if (attr.section === 'identifier') {
            acc.identifying.push({
              title: attr.label.en,
              propName: attr.name,
              value: '',
              log: '',
              logType: '',
            } as SectionField);
          } else if (attr.section === 'info') {
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

    this.sections[0].entries = visibleFields.technical;
    this.sections[1].entries = visibleFields.identifying;
    this.sections[2].entries = visibleFields.describing;
    this.titleSection = visibleFields.title;

    this.fillSections();
    this.isLoadingResults = false;
  }
}
