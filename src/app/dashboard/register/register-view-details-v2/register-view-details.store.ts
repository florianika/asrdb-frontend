import { Injectable, signal } from '@angular/core';
import { Building } from '../model/building';
import { Log } from '../register-log-view/model/log';
import { ViewSection } from './types';
import { EntityAttribute } from '../../common/service/common-entity-structure.service';

export type RegisterViewDataState = {
  building: Building | null;
  buildingFields: EntityAttribute[] | null;
  logs: Log[];
  isLoading: boolean;
  isExecutingRules: boolean;
  isUpdatingFeature: boolean;
};

export type RegisterViewStructureState = {
  buildingStructure: ViewSection | null;
  entranceStructure: ViewSection | null;
  dwellingStructure: ViewSection | null;
};

@Injectable()
export class RegisterViewDetailsStore {
  public viewData = signal<RegisterViewDataState>({
    building: null,
    buildingFields: [],
    logs: [],
    isLoading: true,
    isExecutingRules: false,
    isUpdatingFeature: false,
  });

  public viewStructures = signal<RegisterViewStructureState>({
    buildingStructure: null,
    entranceStructure: null,
    dwellingStructure: null,
  });

  resetForLoad() {
    this.viewData.update(data => ({
      ...data,
      isLoading: true,
      building: null,
      buildingFields: [],
    }));
  }

  patchViewData(patch: Partial<RegisterViewDataState>) {
    this.viewData.update(current => ({
      ...current,
      ...patch,
    }));
  }

  patchViewStructures(patch: Partial<RegisterViewStructureState>) {
    this.viewStructures.update(current => ({
      ...current,
      ...patch,
    }));
  }
}
