import {Injectable} from '@angular/core';
import {BuildingFilter} from '../model/building';
import {CommonRegisterHelperService} from '../../common/service/common-helper.service';
import {Chip} from 'src/app/common/standalone-components/chip/chip.component';
import {BehaviorSubject} from 'rxjs';

export const FILTER_REGISTER = 'FILTER_REGISTER';
const DEFAULT_MUNICIPALITY = '53';

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
      BldMunicipality: DEFAULT_MUNICIPALITY,
      BldStatus: [],
      BldType: [],
      BldQuality: [],
      BldEnumArea: '',
      GlobalID: '',
    },
    options: {
      BldMunicipality: [] as never[],
      BldStatus: [] as never[],
      BldType: [] as never[],
      BldQuality: [] as never[],
    }
  }
  private filter = new BehaviorSubject<BuildingFilter>(this.defaultFilter);
  private globalIds = new BehaviorSubject<string[]>([]);

  private fields: never[] = [];

  constructor(private commonBuildingRegisterHelper: CommonRegisterHelperService) {
    const savedFilterJSON = sessionStorage.getItem(FILTER_REGISTER);

    if (savedFilterJSON) {
      try {
        const filter = JSON.parse(savedFilterJSON);
        if (!filter.filter.BldMunicipality) {
          filter.filter.BldMunicipality = DEFAULT_MUNICIPALITY;
        }
        this.filter.next(filter);
      } catch (e) {
        console.log('Filter could not be initialised');
      }
    }
  }

  get municipality(): string {
    return this.filter.value.filter?.BldMunicipality ?? '';
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
    this.filter.next(filter);
    sessionStorage.setItem(key, JSON.stringify(filter));
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
      }
    });
  }

  prepareWhereCase() {
    const conditions: string[] = [];
    Object
      .entries(this.filter.value.filter)
      .filter(([, value]) => {
        return Array.isArray(value) ? value.length : !!value;
      })
      .map(([key, value]) => {
        let finalValue = value;
        if (Array.isArray(value)) {
          finalValue = value.join(', ')
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
          const globalIdsCondition = globalIds.map(globalId => `'${globalId}'`).join(',');
          conditions.push(filter.column + ' in (' + globalIdsCondition + ')');
        } else if (['BldStatus', 'BldType', 'BldQuality'].includes(filter.column) && !this.skipOtherFiltersApartFromGlobalId) {
          conditions.push(filter.column + ' in (' + filter.value + ')');
        } else if (!this.skipOtherFiltersApartFromGlobalId) {
          conditions.push(filter.column + '=' + this.getWhereConditionValue(filter.value));
        }
      });
    return conditions.length ? conditions.join(' and ') : '1=1';
  }

  prepareWhereCaseForEntrance(entranceId?: string) {
    if (entranceId) {
      return `EntBuildingId='${entranceId}'`;
    }
    if (!this.globalIds.getValue()?.length && this.noFilterApplied()) {
      return '1=1';
    }
    return `EntBuildingId in (${this.globalIds.getValue().map(id => '\'' + id + '\'')})`;
  }

  getFilter() {
    return this.filter.value;
  }

  private getOptions(column: string) {
    const field = this.commonBuildingRegisterHelper.getField(this.fields, column);
    if (!field) {
      return [];
    }
    return field
      .domain
      ?.codedValues
      ?.map((codeValue: { name: string, code: string }) => (
        {
          name: codeValue.name,
          code: codeValue.code,
        })
      )
      ?.sort((a: { name: string, code: string }, b: { name: string, code: string }) => {
        if (a.code > b.code) {
          return 1;
        } else if (a.code < b.code) {
          return -1;
        }
        return 0;
      });
  }

  private getOptionsFromDomain(domain: string) {
    const options = this.getOptions(domain);
    return options.length ? options : (this.filter.value.options as any)[domain];
  }

  private getBldMunicipalityOptions() {
    return this.getOptionsFromDomain('BldMunicipality').sort((a: { name: string, code: string }, b: {
      name: string,
      code: string
    }) => {
      if (a.name > b.name) {
        return 1;
      } else if (a.name < b.name) {
        return -1;
      }
      return 0;
    });
  }

  private getWhereConditionValue(value: string | number) {
    return (typeof value == 'number') ? value : `'${value}'`;
  }

  private noFilterApplied() {
    return !this.filter.value.filter.BldMunicipality
      && !this.filter.value.filter.BldType
      && !this.filter.value.filter.BldStatus.length
      && !this.filter.value.filter.BldEnumArea
      && !this.filter.value.filter.BldQuality
      && !this.filter.value.filter.GlobalID;
  }
}
