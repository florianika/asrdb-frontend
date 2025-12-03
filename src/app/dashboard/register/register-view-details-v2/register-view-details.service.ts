import {effect, inject, Injectable, isDevMode, signal} from '@angular/core';
import {Building} from "../model/building";
import {Log} from "../register-log-view/model/log";
import {QueryFilter} from "../model/query-filter";
import {catchError, of, Subject, takeUntil} from "rxjs";
import {CommonBuildingService} from "../../common/service/common-building.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {NOT_EXECUTING, RegisterLogService} from "../register-log-view/register-log-table/register-log.service";
import {CommonEntityStructureService, EntityAttribute} from "../../common/service/common-entity-structure.service";
import {BUILDING_ENTITY} from "../../../common/constants/common-constants";
import {CommonEntranceService} from "../../common/service/common-entrance.service";
import {SectionField} from "../constant/common-constants";
import {CommonRegisterHelperService} from "../../common/service/common-helper.service";
import {MatDialogRef} from "@angular/material/dialog";
import {Section, ViewSection} from "./types";

@Injectable({
  providedIn: 'root'
})
export class RegisterViewDetailsService {
  // private variables
  private destroy$: Subject<void> = new Subject<void>();

  // service injections
  private commonBuildingService = inject(CommonBuildingService);
  private registerLogService = inject(RegisterLogService);
  private commonEntityStructureService = inject(CommonEntityStructureService);
  private commonEntranceService = inject(CommonEntranceService);
  private commonBuildingRegisterHelper = inject(CommonRegisterHelperService);

  // material service injection
  private matSnack = inject(MatSnackBar);

  // store all necessary data for building details view in a signal
  public viewData = signal({
    building: null as Building | null,
    buildingFields: [] as EntityAttribute[] | null,
    logs: [] as Log[],
    isLoading: true,
    isExecutingRules: false,
    isUpdatingFeature: false,
  });

  public viewStructures = signal({
    buildingStructure: null as ViewSection | null,
    entranceStructure: null as ViewSection | null,
    dwellingStructure: null as ViewSection | null,
  });

  constructor() {
    effect(() => {
      const building = this.viewData().building;
      const logs = this.viewData().logs;
      const structure = this.viewStructures().buildingStructure;
      const loading = this.viewData().isLoading;

      if (building && logs && structure && loading) {
        this.fillSections(building.GlobalID);
      }
    }, { allowSignalWrites: true });
  }

  public cleanup() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public init(id: string) {
    this.viewData.update((data) => {
      return {
        ...data,
        isLoading: true,
        building: null,
        buildingFields: [],
      }
    });
    this.loadBuildingStructure();
    this.loadBuildingData(id);
    this.loadLogs(id);
  }

  // mark as untested
  public markAsUntested(id: string, entranceId: string) {
    this.viewData.update((data) => {
      return {
        ...data,
        isLoading: true,
        building: null,
        buildingFields: [],
      }
    });
    this.resetEntranceStatus(entranceId, id);
  }

  public startExecution(id: string, callback?: () => void) {
    this.registerLogService.executeRules(id);
    this.matSnack.open('Started execution of quality rules', 'Ok', {
      duration: 5000,
    });
    this.viewData.update((data) => {
      return {...data, isExecutingRules: true, buildingFields: []};
    });
    const subscription = this.registerLogService.isExecutingRules
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value === NOT_EXECUTING) {
          setTimeout(() => {
            this.matSnack.open('Execution of quality rules finished. Reloading logs!', 'Ok', {
              duration: 5000,
            });
            if (callback) {
              callback();
              this.viewData.update((data) => {
                return {...data, isExecutingRules: false};
              });
            } else {
              this.viewData.update((data) => {
                return {...data, isExecutingRules: false};
              });
              this.init(id);
            }
            subscription.unsubscribe();
          }, 1000);
        }
      });
  }

  public rejectReviewForBuilding(dialog: MatDialogRef<any>) {
    this.viewData.update((data) => {
      return {...data, isUpdatingFeature: false};
    });
    const building = this.viewData().building;
    if (!building) {
      this.matSnack.open('No building loaded. Cannot reject review.', 'Ok', {
        duration: 3000,
      });
      this.viewData.update((data) => {
        return {...data, isUpdatingFeature: false};
      });
      return;
    }
    const feature = {
      attributes: {
        ...building,
        BldReview: 5,
      }
    }
    this.commonBuildingService
      .updateFeature([feature])
      .pipe(takeUntil(this.destroy$), catchError(err => {
        console.error('Error updating feature', err);
        this.viewData.update((data) => {
          return {...data, isUpdatingFeature: false};
        });
        this.matSnack.open('Could not reject review. Please try again.', 'Ok', {
          duration: 3000,
        });
        return of(null);
      }))
      .subscribe(feature => {
        if (feature) {
          if (isDevMode()) {
            console.log('Feature updated', feature);
          }
          this.matSnack.open('Review reopened successfully', 'Ok', {
            duration: 3000,
          });
          dialog.close();
          this.loadBuildingData(building.GlobalID);
        }
        this.viewData.update((data) => {
          return {...data, isUpdatingFeature: false};
        });
      });
  }

  approveReviewForBuilding(dialog: MatDialogRef<any>) {
    this.viewData.update((data) => {
      return {...data, isUpdatingFeature: true};
    });
    const building = this.viewData().building;
    if (!building) {
      this.matSnack.open('No building loaded. Cannot approve review.', 'Ok', {
        duration: 3000,
      });
      this.viewData.update((data) => {
        return {...data, isUpdatingFeature: false};
      });
      return;
    }
    const feature = {
      attributes: {
        ...building,
        BldReview: 2,
      }
    }
    this.commonBuildingService
      .updateFeature([feature])
      .pipe(takeUntil(this.destroy$), catchError(err => {
        console.error('Error updating feature', err);
        this.viewData.update((data) => {
          return {...data, isUpdatingFeature: false};
        });
        this.matSnack.open('Could not approve review. Please try again.', 'Ok', {
          duration: 3000,
        });
        return of(null);
      }))
      .subscribe(feature => {
        if (feature) {
          if (isDevMode()) {
            console.log('Feature updated', feature);
          }
          this.matSnack.open('Review approved successfully', 'Ok', {
            duration: 3000,
          });
          dialog.close();
          this.loadBuildingData(building.GlobalID);
        }
        this.viewData.update((data) => {
          return {...data, isUpdatingFeature: false};
        });
      })
  }

  // load building details data
  private loadBuildingData(id: string) {
    this.viewData.update((data) => {
      data.isLoading = true;
      return data;
    });
    const filter = {
      where: this.prepareWhereCase(id),
    } as Partial<QueryFilter>;

    this.commonBuildingService
      .getBuildingData(filter)
      .pipe(
        catchError(err => {
          console.log(err);
          this.matSnack.open('Could not load building. Please try again.', 'Ok', {
            duration: 3000,
          });
          return of(null);
        }),
        takeUntil(this.destroy$)
    ).subscribe((res) => this.handleResponse(res));

  }

  // load logs for building
  private loadLogs(id: string) {
    this.registerLogService.isLoadingResults.subscribe(isLoadingResult => {
      if (!isLoadingResult) {
        const logs = this.registerLogService.logsValue;
        this.viewData.update((data) => {
          return {
            ...data,
            logs: logs,
          }
        });
      }
    });
    this.registerLogService.loadLogs(id);
  }

  // load building structure
  private loadBuildingStructure() {
    this.commonEntityStructureService.structureLoaded.subscribe((response) => {
      if (!response.loading && response.structure && response.type === BUILDING_ENTITY) {
        this.prepareStructure(response.structure);
      }
    });
    this.commonEntityStructureService.getEntityStructure(BUILDING_ENTITY);
  }

  // reset building status
  private resetBuildingStatus(id: string) {
    this.commonBuildingService.resetStatus(id, () => {
      setTimeout(() => {
        this.init(id);
      }, 500);
    });
  }

  // reset entrance status
  private resetEntranceStatus(entranceId: string, id: string) {
    this.commonEntranceService.resetStatus(entranceId, () => {
      this.resetBuildingStatus(id);
    })
  }

  // prepare structure for display
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
    this.viewStructures.update((data) => {
      // data.buildingStructure = {sections, titleSection} as ViewSection;
      // return data;
      return {
        ...data,
        buildingStructure: {sections, titleSection} as ViewSection,
      };
    });
  }

  // fill sections with data
  private fillSections(id: string) {
    this.viewStructures().buildingStructure?.sections.forEach(section => {
      section.entries.forEach(entry => {
        entry.value = this.getValue(entry)?.toString();
        entry.log =
          this.registerLogService.getLogForVariable(
            BUILDING_ENTITY,
            entry.propName,
            id
          )?.qualityMessageEn ?? '';
        entry.logType =
          this.registerLogService.getLogForVariable(
            BUILDING_ENTITY,
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

  // HELPERS

  getMunicipality(): string | number {
    const fields = this.viewData().buildingFields;
    const building = this.viewData().building;
    if (!fields || !building) {
      return '';
    }
    return this.commonBuildingRegisterHelper.getMunicipality(
      fields,
      'BldMunicipality',
      building.BldMunicipality
    );
  }

  getValueFromStatus(column: keyof Building): string {
    const fields = this.viewData().buildingFields;
    const building = this.viewData().building;
    if (!fields || !building) {
      return '';
    }

    return (
      this.commonBuildingRegisterHelper.getValueFromStatus(
        fields,
        column,
        building[column]
      ) ?? ''
    );
  }

  private prepareWhereCase(id: string) {
    return `GlobalID='${id}'`;
  }

  private handleResponse(res: any) {
    if (isDevMode()) {
      console.log('Data', res);
    }
    if (!res) {
      this.matSnack.open('Could not load result. Please try again', 'Ok', {
        duration: 3000,
      });
      this.viewData.update((data) => {
        return {
          ...data,
          isLoading: false,
        }
      });
      return;
    }
    let fields = [];
    if (res.data.fields.length) {
      fields = res.data.fields;
    }
    const building = res.data.features.map(
      (feature: any) => feature.attributes
    )[0];
    this.viewData.update((data) => {
      return {
        ...data,
        building: building,
        buildingFields: fields,
      }
    });
  }

  private getValue(entry: any) {
    return entry.propName === 'BldMunicipality'
      ? this.getMunicipality()
      : this.getValueFromStatus(entry.propName);
  }

  // END HELPERS
}
