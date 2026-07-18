import { Injectable } from '@angular/core';
import { BuildingFilter, FilterOption } from '../model/building';
import { CommonRegisterHelperService } from '../../common/service/common-helper.service';
import { Chip } from 'src/app/common/standalone-components/chip/chip.component';
import { BehaviorSubject } from 'rxjs';
import { MUNICIPALITIES } from '../../../common/data/municipalities';
import {
  AuthStateService,
  DEFAULT_MUNICIPALITY,
} from '../../../common/services/auth-state.service';
import { EsriField } from '../model/esri-response';
import {
  arcGisGlobalIdEquals,
  arcGisGlobalIdIn,
  arcGisIdentifier,
  arcGisIntegerIn,
  arcGisStringLiteral,
  EMPTY_ARCGIS_GLOBAL_ID,
  normalizeArcGisGlobalId,
} from '../../common/helper/arcgis-query';

export const FILTER_REGISTER = 'FILTER_REGISTER';

@Injectable()
export class RegisterFilterService {
  skipOtherFiltersApartFromGlobalId = false;
  get filterObservable() {
    return this.filter.asObservable();
  }

  get globalIdsObservable() {
    return this.globalIds.asObservable();
  }

  private readonly defaultFilter: BuildingFilter = {
    filter: {
      // add default value if possible
      // default value will be Tirane
      // This is done to prevent any value to be loaded on init.
      // user can change this to load what they want
      BldMunicipality: this.authState.getMunicipality() ?? DEFAULT_MUNICIPALITY,
      BldStatus: [],
      BldType: [],
      BldQuality: [],
      BldReview: [],
      BldCentroidStatus: [],
      BldEnumArea: '',
      GlobalID: '',
      BldWithQuePendingIds: '',
    },
    options: {
      BldMunicipality: MUNICIPALITIES,
      BldStatus: [],
      BldType: [],
      BldQuality: [],
      BldReview: [],
      BldCentroidStatus: [],
    },
  };
  private filter = new BehaviorSubject<BuildingFilter>(this.defaultFilter);
  private globalIds = new BehaviorSubject<string[]>([]);

  private fields: EsriField[] = [];

  constructor(
    private commonBuildingRegisterHelper: CommonRegisterHelperService,
    private authState: AuthStateService
  ) {
    this.init();
  }

  get municipality(): number | null {
    return this.filter.value.filter?.BldMunicipality ?? null;
  }

  resetFilter(): void {
    this.init();
  }

  setBuildingsGlobalIdFilter(globalIds: string[]) {
    const filterValue = JSON.parse(JSON.stringify(this.filter.getValue()));
    filterValue.filter.GlobalID = globalIds.join(',');
    this.filter.next(filterValue);
  }

  setBuildingGlobalIdFilter(globalId?: string) {
    if (!globalId && globalId !== '') {
      return;
    }
    const filterValue = JSON.parse(JSON.stringify(this.filter.getValue()));
    filterValue.filter.GlobalID = globalId;
    this.filter.next(filterValue);
  }

  updateGlobalIds(globalIds?: string[]) {
    if (!globalIds) {
      return;
    }
    const globalIdsToStore = globalIds.filter(globalId => !!globalId);
    this.globalIds.next(globalIdsToStore);
  }

  updateFilter(filter: BuildingFilter, key: string) {
    //TODO: Discuss if needed
    // if (!filter) {
    //   return;
    // }
    // if (!filter.filter.BldMunicipality) {
    //   filter.filter.BldMunicipality = DEFAULT_MUNICIPALITY;
    // }
    this.filter.next(filter);
    localStorage.setItem(key, JSON.stringify(filter));
  }

  prepareFilter(fields: EsriField[]) {
    this.fields = fields;
    this.filter.next({
      filter: this.filter.value.filter,
      options: {
        BldMunicipality: this.getBldMunicipalityOptions(),
        BldStatus: this.getOptionsFromDomain('BldStatus'),
        BldType: this.getOptionsFromDomain('BldType'),
        BldQuality: this.getOptionsFromDomain('BldQuality'),
        BldReview: this.getOptionsFromDomain('BldReview'),
        BldCentroidStatus: this.getOptionsFromDomain('BldCentroidStatus'),
      },
    });
  }

  getSelectedBuildingGlobalIds(): string[] {
    return this.getGlobalIdsFromFilterValue(this.filter.value.filter.GlobalID);
  }

  prepareWhereCase(options: { includeGlobalId?: boolean } = {}) {
    const includeGlobalId = options.includeGlobalId ?? true;
    const conditions: string[] = ['BldQuality <> 0'];
    Object.entries(this.filter.value.filter)
      .filter(([, value]) => {
        return Array.isArray(value) ? value.length : !!value;
      })
      .map(([key, value]) => {
        let finalValue = value;
        if (Array.isArray(value)) {
          finalValue = value.join(', ');
        }
        return { column: key, value: finalValue } as Chip;
      })
      .forEach(filter => {
        if (filter.column === 'GlobalID') {
          if (!includeGlobalId) {
            return;
          }
          const globalIds = this.getGlobalIdsFromFilterValue(filter.value);
          conditions.push(arcGisGlobalIdIn(filter.column, globalIds));
        } else if (filter.column === 'BldWithQuePendingIds') {
          if (filter.value === 'notFound') {
            conditions.push(
              arcGisGlobalIdIn('GlobalID', [EMPTY_ARCGIS_GLOBAL_ID])
            );
          } else {
            conditions.push(
              arcGisGlobalIdIn('GlobalID', filter.value.split(','))
            );
          }
        } else if (
          ['BldStatus', 'BldType', 'BldQuality', 'BldReview'].includes(
            filter.column
          ) &&
          !this.skipOtherFiltersApartFromGlobalId
        ) {
          conditions.push(
            arcGisIntegerIn(filter.column, filter.value.split(','))
          );
        } else if (!this.skipOtherFiltersApartFromGlobalId) {
          conditions.push(
            `${arcGisIdentifier(filter.column)}=${this.getWhereConditionValue(filter.value)}`
          );
        }
      });
    return conditions.length ? conditions.join(' and ') : '1=1';
  }

  prepareWhereCaseForEntrance(
    entranceId?: string,
    options: { includeEntranceId?: boolean } = {}
  ) {
    const includeEntranceId = options.includeEntranceId ?? true;
    if (entranceId && includeEntranceId) {
      return arcGisGlobalIdEquals('GlobalID', entranceId);
    }
    if (
      !this.globalIds.getValue()?.length ||
      this.noFilterApplied() ||
      this.globalIds.getValue()?.length > 100
    ) {
      return '1=0';
    }
    return `${arcGisGlobalIdIn('EntBldGlobalID', this.globalIds.getValue())} AND EntQuality <> 0`;
  }

  getFilter() {
    return this.filter.value;
  }

  private getOptions(column: keyof BuildingFilter['options']): FilterOption[] {
    const field = this.commonBuildingRegisterHelper.getField(
      this.fields,
      column
    );
    if (!field) {
      return [];
    }
    return (field.domain?.codedValues ?? [])
      .map((codeValue: { name: string; code: string | number }) => ({
        name: codeValue.name,
        code: codeValue.code,
      }))
      .sort((a, b) => {
        if (a.code > b.code) {
          return 1;
        } else if (a.code < b.code) {
          return -1;
        }
        return 0;
      });
  }

  private getOptionsFromDomain<K extends keyof BuildingFilter['options']>(
    domain: K
  ): BuildingFilter['options'][K] {
    const options = this.getOptions(domain);
    return (
      options.length ? options : this.filter.value.options[domain]
    ) as BuildingFilter['options'][K];
  }

  private getBldMunicipalityOptions() {
    return this.getOptionsFromDomain('BldMunicipality').sort(
      (
        a: { name: string; code: number },
        b: {
          name: string;
          code: number;
        }
      ) => {
        if (a.name > b.name) {
          return 1;
        } else if (a.name < b.name) {
          return -1;
        }
        return 0;
      }
    );
  }

  private getWhereConditionValue(value: string | number) {
    return typeof value === 'number'
      ? value.toString()
      : arcGisStringLiteral(value);
  }

  private getGlobalIdsFromFilterValue(value: string | null): string[] {
    if (!value) {
      return [];
    }
    return value
      .split(',')
      .map(id => id.trim())
      .filter(id => !!id)
      .map(normalizeArcGisGlobalId);
  }

  private noFilterApplied() {
    return (
      // !this.filter.value.filter.BldMunicipality &&
      !this.filter.value.filter.BldType &&
      !this.filter.value.filter.BldStatus.length &&
      !this.filter.value.filter.BldEnumArea &&
      !this.filter.value.filter.BldQuality &&
      !this.filter.value.filter.BldReview &&
      !this.filter.value.filter.GlobalID
    );
  }

  private init() {
    const savedFilterJSON = localStorage.getItem(FILTER_REGISTER);

    if (savedFilterJSON) {
      try {
        const filter = JSON.parse(savedFilterJSON);
        if (!filter.filter.BldMunicipality) {
          filter.filter.BldMunicipality =
            this.authState.getMunicipality() ?? DEFAULT_MUNICIPALITY;
        }
        filter.filter.GlobalID = null;
        this.filter.next(filter);
      } catch {
        console.log('Filter could not be initialised');
      }
    } else {
      this.updateFilter(this.defaultFilter, FILTER_REGISTER);
    }
  }
}
