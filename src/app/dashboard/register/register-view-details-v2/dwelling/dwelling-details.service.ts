import {
  effect,
  Inject,
  inject,
  Injectable,
  LOCALE_ID,
  signal,
} from '@angular/core';
import { Dwelling } from '../../model/dwelling';
import { QueryFilter } from '../../model/query-filter';
import { catchError, of as observableOf } from 'rxjs';
import { Chip } from '../../../../common/standalone-components/chip/chip.component';
import { MatSort } from '@angular/material/sort';
import { CommonDwellingService } from '../../../common/service/common-dwellings.service';
import {
  CommonEntityStructureService,
  EntityAttribute,
} from '../../../common/service/common-entity-structure.service';
import { CommonRegisterHelperService } from '../../../common/service/common-helper.service';
import { Section } from '../types';
import { MatDialog } from '@angular/material/dialog';
import { Log } from '../../register-log-view/model/log';
import { DWELLING_ENTITY } from '../../../../common/constants/common-constants';
import { SectionField } from '../../constant/common-constants';
import { RegisterLogService } from '../../register-log-view/register-log-table/register-log.service';
import { DwellingDetailsComponent } from './dwelling-details/dwelling-details.component';
import {getLocaleProperty, getLogMessage} from '../../../common/helper/locale-property-helper';

const STREET_NAME = 'Street name';
const BUILDING_NUMBER = 'Building number';
const ENTRANCE_NUMBER = 'Entrance number';

@Injectable({
  providedIn: 'root',
})
export class DwellingDetailsService {
  private previousEntranceId = '';
  private previousDwellingId = '';

  private matDialog = inject(MatDialog);

  private filterConfig = signal({
    filter: {
      DwlFloor: 0,
      DwlApartNumber: 0,
      GlobalID: '',
      DwlStatus: '',
      DwlType: '',
      DwlEntGlobalID: '',
    },
    options: {
      DwlStatus: [] as any[],
      DwlType: [] as any[],
    },
  });
  public viewData = signal({
    entranceId: '',
    selectedDwelling: null as Dwelling | null,
    dwellingList: [] as Dwelling[],
    dwellingFields: [] as EntityAttribute[] | null,
    totalCount: 0,
    isLoadingDwellings: true,
  });
  public dwellingStructure = signal({
    isLoadingStructure: true,
    sections: [] as Section[],
    titleSection: [] as SectionField[],
  });

  private commonDwellingService = inject(CommonDwellingService);
  private commonRegisterHelperService = inject(CommonRegisterHelperService);
  private commonEntityStructureService = inject(CommonEntityStructureService);
  private registerLogService = inject(RegisterLogService);

  constructor(@Inject(LOCALE_ID) private locale: string) {
    effect(
      () => {
        const entranceId = this.viewData().entranceId;
        if (entranceId && this.previousEntranceId !== entranceId) {
          this.loadDwellingsForEntrances(entranceId);
          this.init();
          this.previousEntranceId = entranceId;
        }
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        const dwelling = this.viewData().selectedDwelling;
        const structure = this.dwellingStructure();
        const structureLoading = this.dwellingStructure().isLoadingStructure;
        if (
          dwelling &&
          structure.sections.length &&
          !structureLoading &&
          this.previousDwellingId !== dwelling.GlobalID
        ) {
          this.previousDwellingId = dwelling.GlobalID;
          this.fillSections(dwelling.GlobalID);
        }
      },
      { allowSignalWrites: true }
    );
  }

  public init(pageIndex?: number, pageSize?: number) {
    if (!this.viewData().entranceId) {
      this.viewData.update(data => ({
        ...data,
        dwellingList: [],
        totalCount: 0,
        isLoadingDwellings: false,
      }));
      return;
    }
    this.viewData.update(data => ({ ...data, isLoadingDwellings: true }));
    this.loadDwellings(pageIndex ?? 0, pageSize ?? 5);
  }

  public getValueFromStatus(
    column: keyof Dwelling,
    dwelling?: Dwelling
  ): string {
    const fields = this.viewData().dwellingFields;
    if (!dwelling) {
      dwelling = this.viewData().selectedDwelling ?? undefined;
    }
    if (!fields || !dwelling) {
      return '';
    }
    return (
      this.commonRegisterHelperService.getValueFromStatus(
        fields,
        column,
        dwelling[column]
      ) ?? ''
    );
  }

  public viewDwellingDetails(
    id: string,
    logs: Log[],
    buildingNumber?: number,
    entranceNumber?: number,
    entranceId?: string,
    streetName?: string
  ) {
    const dwelling =
      this.viewData().dwellingList.find(dwl => dwl.GlobalID === id) || null;
    this.viewData.update(data => ({ ...data, selectedDwelling: dwelling }));

    const structure = this.dwellingStructure().sections.length;
    if (structure === 0) {
      // load structure first
      this.dwellingStructure.update(data => {
        return { ...data, isLoadingStructure: true };
      });
      this.loadDwellingStructure(
        streetName || '',
        buildingNumber || 0,
        entranceNumber || 0,
        () => {
          this.openDialog(logs, buildingNumber, entranceNumber, entranceId);
        }
      );
    } else {
      // structure already loaded
      this.fillSections(id);
      this.openDialog(logs, buildingNumber, entranceNumber, entranceId);
    }
  }

  public getLogs(dwellingId: string): Log[] {
    const cleanedId = dwellingId.replace('{', '').replace('}', '');
    const logs: Log[] = [];
    const fields = this.viewData().dwellingFields;
    if (!fields) {
      return logs;
    }
    fields.forEach(field => {
      const log = this.registerLogService.getLogForVariable(
        DWELLING_ENTITY,
        field.name,
        cleanedId
      );
      if (log) {
        logs.push(log);
      }
    });
    return logs;
  }

  private openDialog(
    logs: Log[],
    buildingNumber?: number,
    entranceNumber?: number,
    entranceId?: string
  ) {
    const dialogRef = this.matDialog.open(DwellingDetailsComponent, {
      data: {
        logs,
        buildingNumber,
        entranceNumber,
        entranceId,
      },
      disableClose: true,
    });
    const sub = dialogRef.afterClosed().subscribe(() => {
      this.viewData.update(data => ({ ...data, selectedDwelling: null }));
      this.previousDwellingId = '';
      sub.unsubscribe();
    });
  }

  private prepareStructure(
    structure: EntityAttribute[],
    streetName: string,
    buildingNumber: number,
    entranceNumber: number,
    callback?: () => void
  ) {
    const visibleFields = structure.reduce(
      (acc, attr: EntityAttribute) => {
        if (attr.section !== 'none' && !attr.internal) {
          if (attr.section === 'identification') {
            acc.identifying.push({
              title: getLocaleProperty(attr.label, this.locale as 'en' | 'sq'),
              propName: attr.name,
              value: '',
              log: '',
              logType: '',
            } as SectionField);
          } else if (attr.section === 'description') {
            acc.describing.push({
              title: getLocaleProperty(attr.label, this.locale as 'en' | 'sq'),
              propName: attr.name,
              value: '',
              log: '',
              logType: '',
            } as SectionField);
          } else if (attr.section === 'title') {
            acc.title.push({
              title: getLocaleProperty(attr.label, this.locale as 'en' | 'sq'),
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

    const sections: Section[] = [
      { title: 'Identifying Information', entries: [] as SectionField[] },
      { title: 'Describing Information', entries: [] as SectionField[] },
    ];
    sections[0].entries = visibleFields.identifying;

    // TODO: Remove hardcoded fields when the structure is ready
    sections[0].entries.push({
      title: STREET_NAME,
      propName: '',
      value: streetName,
      log: '',
      logType: '',
    } as SectionField);
    sections[0].entries.push({
      title: BUILDING_NUMBER,
      propName: '',
      value: buildingNumber.toString(),
      log: '',
      logType: '',
    } as SectionField);
    sections[0].entries.push({
      title: ENTRANCE_NUMBER,
      propName: '',
      value: entranceNumber.toString(),
      log: '',
      logType: '',
    } as SectionField);

    sections[1].entries = visibleFields.describing;
    const titleSection = visibleFields.title;
    this.dwellingStructure.update(() => {
      return {
        sections,
        titleSection,
        isLoadingStructure: false,
      };
    });
    if (callback) {
      callback();
    }
  }

  // load building structure
  private loadDwellingStructure(
    streetName: string,
    buildingNumber: number,
    entranceNumber: number,
    callback?: () => void
  ) {
    const structs = this.commonEntityStructureService.structureLoaded.subscribe(
      response => {
        if (
          !response.loading &&
          response.structure &&
          response.type === DWELLING_ENTITY
        ) {
          this.prepareStructure(
            response.structure,
            streetName,
            buildingNumber,
            entranceNumber,
            callback
          );
          structs.unsubscribe();
        }
      }
    );
    this.commonEntityStructureService.getEntityStructure(DWELLING_ENTITY);
  }

  private loadDwellings(pageIndex: number, pageSize: number) {
    this.viewData.update(data => ({ ...data, isLoadingDwellings: true }));
    const filter = {
      start: pageIndex * pageSize,
      num: pageSize ?? 5,
      outFields: ['*'],
      where: this.prepareWhereCase(),
      orderByFields: ['DwlFloor', 'DwlApartNumber', 'GlobalID'],
    } as Partial<QueryFilter>;
    return this.commonDwellingService
      .getDwellings(filter)
      .pipe(
        catchError(err => {
          console.log(err);
          return observableOf(null);
        })
      )
      .subscribe(res => {
        this.viewData.update(viewData => ({
          ...viewData,
          dwellingList:
            res?.data.features.map((feature: any) => feature.attributes) || [],
          isLoadingDwellings: false,
          dwellingFields: res?.data.fields,
          totalCount: res.count,
        }));
      });
  }

  // fill sections with data
  private fillSections(id: string) {
    this.dwellingStructure()?.sections.forEach(section => {
      section.entries.forEach(entry => {
        const log = this.registerLogService.getLogForVariable(
          DWELLING_ENTITY,
          entry.propName,
          id
        );
        entry.value = this.getValueFromStatus(
          entry.propName as keyof Dwelling
        )?.toString();
        entry.log = getLogMessage(log, this.locale as 'en' | 'sq');
        entry.logType = log?.qualityAction ?? '';
      });
    });
    this.dwellingStructure.update(data => {
      return {
        ...data,
        isLoadingStructure: false,
      };
    });
  }

  private loadDwellingsForEntrances(entranceId: string) {
    this.filterConfig().filter.DwlEntGlobalID = `('${entranceId}')`;
  }

  private getWhereConditionValue(value: string | number) {
    return typeof value == 'number' ? value : `'${value}'`;
  }

  private prepareWhereCase() {
    const conditions: string[] = ['DwlQuality <> 0'];
    Object.entries(this.filterConfig().filter)
      .filter(([, value]: any) => !!value)
      .map(([key, value]: any) => ({ column: key, value }) as Chip)
      .forEach((filter: any) => {
        if (filter.column === 'DwlEntGlobalID') {
          conditions.push(filter.column + ' in ' + filter.value);
        } else {
          conditions.push(
            filter.column + '=' + this.getWhereConditionValue(filter.value)
          );
        }
      });
    return conditions.length ? conditions.join(' and ') : '1=1';
  }
}
