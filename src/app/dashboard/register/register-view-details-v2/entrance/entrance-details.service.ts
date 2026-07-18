import {
  effect,
  Inject,
  inject,
  Injectable,
  LOCALE_ID,
  signal,
} from '@angular/core';
import {
  CommonEntityStructureService,
  EntityAttribute,
} from '../../../common/service/common-entity-structure.service';
import { Section } from '../types';
import { SectionField } from '../../constant/common-constants';
import { CommonRegisterHelperService } from '../../../common/service/common-helper.service';
import { RegisterLogService } from '../../register-log-view/register-log-table/register-log.service';
import { ENTRANCE_ENTITY } from '../../../../common/constants/common-constants';
import { Entrance } from '../../model/entrance';
import { QueryFilter } from '../../model/query-filter';
import { catchError, of as observableOf, Subject, takeUntil } from 'rxjs';
import { CommonEntranceService } from '../../../common/service/common-entrance.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonStreetService } from '../../../common/service/common-street.service';
import {
  getLocaleProperty,
  getLogMessage,
} from '../../../common/helper/locale-property-helper';
import {
  arcGisGlobalIdEquals,
  arcGisGlobalIdIn,
} from '../../../common/helper/arcgis-query';

@Injectable()
export class EntranceDetailsService {
  private matSnackBar = inject(MatSnackBar);
  private destroy$ = new Subject<boolean>();
  private previousEntranceId = '';

  private filterConfig = signal({
    filter: {
      EntBuildingNumber: 0,
      EntEntranceNumber: 0,
      EntPointStatus: '',
      GlobalID: '',
      EntBldGlobalID: '',
    },
    options: {
      EntPointStatus: [] as any[],
    },
  });
  public viewData = signal({
    buildingId: '',
    selectedEntrance: null as Entrance | null,
    entranceList: [] as Entrance[],
    entranceFields: [] as EntityAttribute[] | null,
    totalCount: 0,
    isLoadingEntrances: true,
  });
  public entranceStructure = signal({
    isLoadingStructure: true,
    sections: [] as Section[],
    titleSection: [] as SectionField[],
  });

  private commonEntranceService = inject(CommonEntranceService);
  private commonStreetService = inject(CommonStreetService);
  private commonRegisterHelperService = inject(CommonRegisterHelperService);
  private commonEntityStructureService = inject(CommonEntityStructureService);
  private registerLogService = inject(RegisterLogService);

  constructor(@Inject(LOCALE_ID) private locale: string) {
    effect(
      () => {
        const entrance = this.viewData().selectedEntrance;
        const structure = this.entranceStructure();
        const structureLoading = this.entranceStructure().isLoadingStructure;
        if (
          entrance &&
          structure.sections.length &&
          !structureLoading &&
          this.previousEntranceId !== entrance.GlobalID
        ) {
          this.previousEntranceId = entrance.GlobalID;
          this.fillSections(entrance.GlobalID);
        }
      },
      { allowSignalWrites: true }
    );
  }

  public init(pageIndex?: number, pageSize?: number) {
    this.loadEntrances(pageIndex ?? 0, pageSize ?? 5);
  }

  public getValueFromStatus(
    column: keyof Entrance,
    entrance?: Entrance
  ): string {
    const fields = this.viewData().entranceFields;
    if (!entrance) {
      entrance = this.viewData().selectedEntrance ?? undefined;
    }
    if (!fields || !entrance) {
      return '';
    }
    const code = entrance[column];
    const normalizedCode =
      typeof code === 'string' || typeof code === 'number' ? code : '';
    const value = this.commonRegisterHelperService.getValueFromStatus(
      fields,
      column,
      normalizedCode
    );
    return String(value ?? '');
  }

  public viewEntranceDetails(
    id: string,
    streetName?: string,
    onReady?: () => void
  ) {
    const entrance =
      this.viewData().entranceList.find(ent => ent.GlobalID === id) || null;
    this.viewData.update(data => ({ ...data, selectedEntrance: entrance }));

    const structure = this.entranceStructure().sections.length;
    if (structure === 0) {
      this.entranceStructure.update(data => ({
        ...data,
        isLoadingStructure: true,
      }));

      this.loadEntranceStructure(streetName || '', () => {
        onReady?.();
      });
    } else {
      this.fillSections(id);
      onReady?.();
    }
  }

  public clearSelection(): void {
    this.viewData.update(data => ({ ...data, selectedEntrance: null }));
    this.previousEntranceId = '';
  }

  private prepareStructure(
    structure: EntityAttribute[],
    streetName: string,
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
      {
        title: $localize`Identifying Information`,
        entries: [] as SectionField[],
      },
      {
        title: $localize`Describing Information`,
        entries: [] as SectionField[],
      },
    ];

    sections[0].entries = visibleFields.identifying;
    sections[1].entries = visibleFields.describing;
    const titleSection = visibleFields.title;
    this.entranceStructure.update(() => ({
      sections,
      titleSection,
      isLoadingStructure: false,
    }));

    if (callback) callback();
  }

  private loadEntranceStructure(streetName: string, callback?: () => void) {
    const sub = this.commonEntityStructureService.structureLoaded.subscribe(
      response => {
        if (
          !response.loading &&
          response.structure &&
          response.type === ENTRANCE_ENTITY
        ) {
          this.prepareStructure(response.structure, streetName, callback);
          sub.unsubscribe();
        }
      }
    );
    this.commonEntityStructureService.getEntityStructure(ENTRANCE_ENTITY);
  }

  private loadEntrances(pageIndex: number, pageSize: number) {
    this.viewData.update(data => ({ ...data, isLoadingEntrances: true }));

    const filter = {
      start: pageIndex * pageSize,
      num: pageSize,
      outFields: ['*'],
      where: this.prepareWhereCase(this.viewData().buildingId),
      orderByFields: [
        'EntStrGlobalID',
        'EntBldGlobalID',
        'EntEntranceNumber',
        'GlobalID',
      ],
    } as Partial<QueryFilter>;

    return this.commonEntranceService
      .getEntranceData(filter)
      .pipe(
        catchError(err => {
          console.error(err);
          return observableOf(null);
        })
      )
      .subscribe(response => {
        if (!response || !response.data) {
          this.matSnackBar.open(
            $localize`Could not load entrance list. Please try again`,
            $localize`Ok`,
            { duration: 3000 }
          );
          this.viewData.update(data => ({
            ...data,
            isLoadingEntrances: false,
          }));
          return;
        }

        const attributes = response.data.features.map(
          (feature: any) => feature.attributes
        ) as Entrance[];

        this.viewData.update(data => ({
          ...data,
          entranceList: attributes,
          entranceFields: response.data.fields,
          totalCount: response.count,
        }));

        this.loadStreetNames(attributes);
      });
  }

  private loadStreetNames(attributes: Entrance[]) {
    const streetGlobalIds = Array.from(
      new Set(attributes.map(attr => attr.EntStrGlobalID).filter(id => !!id))
    );

    if (streetGlobalIds.length > 0) {
      this.commonStreetService
        .getStreets({
          where: arcGisGlobalIdIn('GlobalID', streetGlobalIds),
          outFields: ['GlobalID', 'StrNameCore'],
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe(streetRes => {
          const streets = streetRes.data.features.map(
            (feature: any) => feature.attributes
          );
          attributes.forEach((attribute: any) => {
            const street = streets.find(
              (street: any) => street.GlobalID === attribute.EntStrGlobalID
            );
            if (street) {
              attribute.EntStrGlobalID = street.StrNameCore;
            }
          });
          this.viewData.update(data => ({
            ...data,
            entranceList: attributes,
            isLoadingEntrances: false,
          }));
          this.prepareFilter();
        });
    } else {
      this.viewData.update(data => ({
        ...data,
        isLoadingEntrances: false,
      }));
      this.prepareFilter();
    }
  }

  private prepareFilter() {
    this.filterConfig.update(config => ({
      ...config,
      options: {
        EntPointStatus: this.getOptions('EntPointStatus').length
          ? this.getOptions('EntPointStatus')
          : config.options.EntPointStatus,
      },
    }));
  }

  private getOptions(column: string) {
    const fields = this.viewData().entranceFields;
    if (!fields) {
      return [];
    }
    const field = this.commonRegisterHelperService.getField(fields, column);
    if (!field) {
      return [];
    }

    return (
      field.domain?.codedValues?.map(
        (codeValue: { name: string; code: string | number }) => ({
          name: codeValue.name,
          code: codeValue.code,
        })
      ) ?? []
    );
  }

  private fillSections(id: string) {
    this.entranceStructure()?.sections.forEach(section => {
      section.entries.forEach(entry => {
        const log = this.registerLogService.getLogForVariable(
          ENTRANCE_ENTITY,
          entry.propName,
          id
        );
        entry.value = this.getValueFromStatus(
          entry.propName as keyof Entrance
        )?.toString();
        entry.log = getLogMessage(log, this.locale as 'en' | 'sq');
        entry.logType = log?.qualityAction ?? '';
      });
    });

    this.viewData.update(data => ({
      ...data,
      isLoading: false,
    }));
  }

  private prepareWhereCase(buildingId: string) {
    const conditions: string[] = ['EntQuality <> 0'];
    conditions.push(arcGisGlobalIdEquals('EntBldGlobalID', buildingId));
    return conditions.length ? conditions.join(' and ') : '1=1';
  }
}
