import { Injectable } from '@angular/core';
import { BuildingFilter } from '../model/building';
import { CommonRegisterHelperService } from '../../common/service/common-helper.service';
import { Chip } from 'src/app/common/standalone-components/chip/chip.component';
import { BehaviorSubject } from 'rxjs';
import { MUNICIPALITIES } from '../../../common/data/municipalities';
import {
  AuthStateService,
  DEFAULT_MUNICIPALITY,
} from '../../../common/services/auth-state.service';

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
      BldMunicipality: MUNICIPALITIES as never[],
      BldStatus: [] as never[],
      BldType: [] as never[],
      BldQuality: [] as never[],
      BldReview: [] as never[],
      BldCentroidStatus: [] as never[],
    },
  };
  private filter = new BehaviorSubject<BuildingFilter>(this.defaultFilter);
  private globalIds = new BehaviorSubject<string[]>([]);

  private fields: never[] = [];

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

  prepareFilter(fields: never[]) {
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

  prepareWhereCase() {
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
          const globalIds = filter.value.split(',').map(id => {
            if (!id.startsWith('{')) {
              id = '{' + id;
            }
            if (!id.endsWith('}')) {
              id = id + '}';
            }
            return id;
          });
          const globalIdsCondition = globalIds
            .map(globalId => `'${globalId}'`)
            .join(',');
          conditions.push(filter.column + ' in (' + globalIdsCondition + ')');
        } else if (filter.column === 'BldWithQuePendingIds') {
          if (filter.value === 'notFound') {
            conditions.push(
              "GlobalID in ('{00000000-0000-0000-0000-000000000000}')"
            );
          } else {
            const pendingIds = filter.value.split(',').map((id: string) => {
              if (!id.startsWith('{')) {
                id = '{' + id;
              }
              if (!id.endsWith('}')) {
                id = id + '}';
              }
              return id;
            });
            const pendingIdsCondition = pendingIds
              .map((pendingId: string) => `'${pendingId}'`)
              .join(',');
            conditions.push('GlobalID in (' + pendingIdsCondition + ')');
          }
        } else if (
          ['BldStatus', 'BldType', 'BldQuality', 'BldReview'].includes(
            filter.column
          ) &&
          !this.skipOtherFiltersApartFromGlobalId
        ) {
          conditions.push(filter.column + ' in (' + filter.value + ')');
        } else if (!this.skipOtherFiltersApartFromGlobalId) {
          conditions.push(
            filter.column + '=' + this.getWhereConditionValue(filter.value)
          );
        }
      });
    return conditions.length ? conditions.join(' and ') : '1=1';
  }

  prepareWhereCaseForEntrance(entranceId?: string) {
    if (entranceId) {
      return `GlobalID='${entranceId}'`;
    }
    if (
      !this.globalIds.getValue()?.length ||
      this.noFilterApplied() ||
      this.globalIds.getValue()?.length > 100
    ) {
      return '1!=1';
    }
    return `EntBldGlobalID in (${this.globalIds.getValue().map(id => "'" + id + "'")}) AND EntQuality <> 0`;
  }

  getFilter() {
    return this.filter.value;
  }

  private getOptions(column: string) {
    const field = this.commonBuildingRegisterHelper.getField(
      this.fields,
      column
    );
    if (!field) {
      return [];
    }
    return field.domain?.codedValues
      ?.map((codeValue: { name: string; code: string | number }) => ({
        name: codeValue.name,
        code: codeValue.code,
      }))
      ?.sort(
        (
          a: { name: string; code: string },
          b: { name: string; code: string | number }
        ) => {
          if (a.code > b.code) {
            return 1;
          } else if (a.code < b.code) {
            return -1;
          }
          return 0;
        }
      );
  }

  private getOptionsFromDomain(domain: string) {
    const options = this.getOptions(domain);
    return options.length
      ? options
      : (this.filter.value.options as any)[domain];
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
    return typeof value == 'number' ? value : `'${value}'`;
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
      } catch (e) {
        console.log('Filter could not be initialised');
      }
    } else {
      this.updateFilter(this.defaultFilter, FILTER_REGISTER);
    }
  }
}
