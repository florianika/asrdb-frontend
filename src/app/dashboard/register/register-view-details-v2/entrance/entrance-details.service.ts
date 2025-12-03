import {effect, inject, Injectable, signal} from '@angular/core';
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {CommonEntityStructureService, EntityAttribute} from "../../../common/service/common-entity-structure.service";
import {Section} from "../types";
import {SectionField} from "../../constant/common-constants";
import {CommonRegisterHelperService} from "../../../common/service/common-helper.service";
import {RegisterLogService} from "../../register-log-view/register-log-table/register-log.service";
import {MatSort} from "@angular/material/sort";
import {Log} from "../../register-log-view/model/log";
import {ENTRANCE_ENTITY} from "../../../../common/constants/common-constants";
import {Entrance} from "../../model/entrance";
import {QueryFilter} from "../../model/query-filter";
import {catchError, of as observableOf, Subject, takeUntil} from "rxjs";
import {CommonEntranceService} from "../../../common/service/common-entrance.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {CommonStreetService} from "../../../common/service/common-street.service";
import {EntranceDetailsComponent} from "./entrance-details/entrance-details.component";

@Injectable({
  providedIn: 'root'
})
export class EntranceDetailsService {
  private matDialog = inject(MatDialog);
  private matSnackBar = inject(MatSnackBar);
  private destroy$ = new Subject<boolean>();
  private previousEntranceId = '';

  public dialogRef?: MatDialogRef<EntranceDetailsComponent>;
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

  constructor() {
    effect(() => {
      const entrance = this.viewData().selectedEntrance;
      const structure = this.entranceStructure();
      const structureLoading = this.entranceStructure().isLoadingStructure;
      if (entrance && structure.sections.length && !structureLoading && this.previousEntranceId !== entrance.GlobalID) {
        this.previousEntranceId = entrance.GlobalID;
        this.fillSections(entrance.GlobalID);
      }
    }, { allowSignalWrites: true });
  }

  public init(pageIndex?: number, pageSize?: number, sort?: MatSort) {
    this.loadEntrances(pageIndex ?? 0, pageSize ?? 5, sort);
  }

  public getValueFromStatus(column: keyof Entrance, entrance?: Entrance): string {
    const fields = this.viewData().entranceFields;
    if (!entrance) {
      entrance = this.viewData().selectedEntrance ?? undefined;
    }
    if (!fields || !entrance) {
      return '';
    }
    return (
      this.commonRegisterHelperService.getValueFromStatus(
        fields,
        column,
        entrance[column] as any
      ) ?? ''
    );
  }

  public viewEntranceDetails(id: string, logs: Log[], streetName?: string) {
    const entrance = this.viewData().entranceList.find(ent => ent.GlobalID === id) || null;
    this.viewData.update((data) => ({...data, selectedEntrance: entrance}));

    const structure = this.entranceStructure().sections.length;
    if (structure === 0) {
      // load structure first
      this.entranceStructure.update((data) => {
        return {...data, isLoadingStructure: true};
      });
      this.loadEntranceStructure(
        streetName || '',
        () => {
          this.openDialog(logs);
        }
      );
    } else {
      // structure already loaded
      this.fillSections(id);
      this.openDialog(logs);
    }
  }

  private openDialog(logs: Log[]) {
    this.dialogRef = this.matDialog.open(EntranceDetailsComponent, {
      data: {
        logs,
      }
    });
    const sub = this.dialogRef.afterClosed().subscribe(() => {
      this.viewData.update((data) => ({...data, selectedDwelling: null}));
      this.previousEntranceId = '';
      sub.unsubscribe();
    });
  }

  private prepareStructure(structure: EntityAttribute[], streetName: string, callback?: () => void) {
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

    const sections: Section[] = [
      { title: 'Identifying Information', entries: [] as SectionField[] },
      { title: 'Describing Information', entries: [] as SectionField[] },
    ];
    sections[0].entries = visibleFields.identifying;
    sections[1].entries = visibleFields.describing;
    const titleSection = visibleFields.title;
    this.entranceStructure.update(() => {
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
  private loadEntranceStructure(streetName: string, callback?: () => void) {
    const sub = this.commonEntityStructureService.structureLoaded.subscribe((response) => {
      if (!response.loading && response.structure && response.type === ENTRANCE_ENTITY) {
        this.prepareStructure(response.structure, streetName, callback);
        sub.unsubscribe();
      }
    });
    this.commonEntityStructureService.getEntityStructure(ENTRANCE_ENTITY);
  }

  private loadEntrances(pageIndex: number, pageSize: number, sort?: MatSort) {
    this.viewData.update((data) => ({...data, isLoadingEntrances: true}));
    const filter = {
      start: pageIndex * pageSize,
      num: pageSize,
      outFields: ['*'],
      where: this.prepareWhereCase(this.viewData().buildingId),
    } as Partial<QueryFilter>;
    if (sort?.active) {
      filter.orderByFields = [
        sort.active + ' ' + sort.direction.toUpperCase(),
      ];
    }
    return this.commonEntranceService.getEntranceData(filter).pipe(
      catchError(err => {
        console.error(err);
        return observableOf(null);
      })
    ).subscribe((response) => {
      if (!response || !response.data) {
        this.matSnackBar.open('Could not load entrance list. Please try again', 'Ok', {
          duration: 3000,
        });
        this.viewData.update((data) => ({...data, isLoadingEntrances: false}));
        return;
      }
      const attributes = response.data.features.map(
        (feature: any) => feature.attributes
      ) as Entrance[];
      this.viewData.update((data) => ({
        ...data,
        entranceList: attributes,
        entranceFields: response.data.fields,
        totalCount: response.count,
      }));
      this.loadStreetNames(attributes);
    });
  }

  private loadStreetNames(attributes: Entrance[]) {
    const streetGlobalIds = Array
      .from(
        new Set(
          attributes
            .map(attr => attr.EntStrGlobalID)
            .filter(id => !!id)
        )
      );
    if (streetGlobalIds.length > 0) {
      this.commonStreetService
        .getStreets({
          where: `GlobalID in (${streetGlobalIds.map((id: string) => `'${id}'`).join(',')})`,
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
          this.viewData.update((data) => ({
            ...data,
            entranceList: attributes,
            isLoadingEntrances: false
          }));
          this.prepareFilter();
        });
    } else {
      this.viewData.update((data) => ({
        ...data,
        isLoadingEntrances: false
      }));
      this.prepareFilter();
    }
  }

  private prepareFilter() {
    this.filterConfig.update((config) => {
      return {
        ...config,
        options: {
          EntPointStatus: this.getOptions('EntPointStatus').length
            ? this.getOptions('EntPointStatus')
            : config.options.EntPointStatus,
        },
      }
    })
  }

  private getOptions(column: string) {
    const fields = this.viewData().entranceFields;
    if (!fields) {
      return [];
    }
    const field = this.commonRegisterHelperService.getField(
      fields,
      column
    );
    if (!field) {
      return [];
    }
    return field.domain?.codedValues?.map(
      (codeValue: { name: string; code: string }) => {
        return {
          name: codeValue.name,
          code: codeValue.code,
        };
      }
    );
  }

  // fill sections with data
  private fillSections(id: string) {
    this.entranceStructure()?.sections.forEach(section => {
      section.entries.forEach(entry => {
        entry.value = this.getValueFromStatus(entry.propName as keyof Entrance)?.toString();
        entry.log =
          this.registerLogService.getLogForVariable(
            ENTRANCE_ENTITY,
            entry.propName,
            id
          )?.qualityMessageEn ?? '';
        entry.logType =
          this.registerLogService.getLogForVariable(
            ENTRANCE_ENTITY,
            entry.propName,
            id
          )?.qualityAction ?? '';
      });
    });
    this.viewData.update((data) => {
      return {
        ...data,
        isLoading: false,
      }
    });
  }

  private prepareWhereCase(buildingId: string) {
    const conditions: string[] = ['EntQuality <> 0'];
    conditions.push(`EntBldGlobalID = '${buildingId}'`);
    return conditions.length ? conditions.join(' and ') : '1=1';
  }}
