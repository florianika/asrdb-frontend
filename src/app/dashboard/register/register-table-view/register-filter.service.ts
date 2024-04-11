import {Injectable} from '@angular/core';
import {BuildingFilter} from '../model/building';
import {CommonRegisterHelperService} from '../service/common-helper.service';
import {Chip} from 'src/app/common/standalone-components/chip/chip.component';
import {BehaviorSubject} from 'rxjs';
import {Router} from "@angular/router";

export const FILTER_REGISTER = 'FILTER_REGISTER';

@Injectable()
export class RegisterFilterService {
  get filterObservable() {
    return this.filter.asObservable();
  }

  get globalIdsObservable() {
    return this.globalIds.asObservable();
  }

  private readonly defaultFilter = {
    filter: {
      // add default value if possible
      // default value will be Tirane
      // This is done to prevent any value to be loaded on init.
      // user can change this to load what they want
      BldMunicipality: '53',
      BldStatus: '',
      BldType: '',
      BldQuality: '',
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
        this.filter.next(JSON.parse(savedFilterJSON));
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

  setBuildingGlobalIdFilter(globalId: string) {
    const filterValue = JSON.parse(JSON.stringify(this.filter.getValue()));
    filterValue.filter.GlobalID = globalId;
    this.filter.next(filterValue);
  }

  updateGlobalIds(globalIds: string[]) {
    const globalIdsToStore = globalIds.filter(globalId => !!globalId);
    this.globalIds.next(globalIdsToStore);
  }

  updateFilter(filter: BuildingFilter, key: string) {
    this.filter.next(filter);
    sessionStorage.setItem(key, JSON.stringify(filter));
  }

  removeDefaultValue() {
    const filterValue = JSON.parse(JSON.stringify(this.filter.getValue()));
    filterValue.filter.BldMunicipality = '';
    this.filter.next(filterValue);
  }

  prepareFilter(fields: never[]) {
    this.fields = fields;
    this.filter.next({
      filter: this.filter.value.filter,
      options: {
        BldMunicipality: this.getOptions('BldMunicipality').length ? this.getOptions('BldMunicipality') : this.filter.value.options.BldMunicipality,
        BldStatus: this.getOptions('BldStatus').length ? this.getOptions('BldStatus') : this.filter.value.options.BldStatus,
        BldType: this.getOptions('BldType').length ? this.getOptions('BldType') : this.filter.value.options.BldType,
        BldQuality: this.getOptions('BldQuality').length ? this.getOptions('BldQuality') : this.filter.value.options.BldQuality,
      }
    });
  }

  prepareWhereCase() {
    const conditions: string[] = [];
    Object
      .entries(this.filter.value.filter)
      .filter(([, value]) => !!value)
      .map(([key, value]) => ({ column: key, value } as Chip))
      .forEach(filter => {
        if (filter.column === 'GlobalID') {
          const globalIds = filter.value.split(',');
          const globalIdsCondition = globalIds.map(globalId => `'${globalId}'`).join(',');
          conditions.push(filter.column + ' in (' + globalIdsCondition + ')');
        } else {
          conditions.push(filter.column + '=' + this.getWhereConditionValue(filter.value));
        }
      });
    return conditions.length ? conditions.join(' and ') : '1=1';
  }

  prepareWhereCaseForEntrance() {
    if (!this.globalIds.getValue()?.length || this.noFilterApplied()) {
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
      ?.map((codeValue: { name: string, code: string }) => {
      return {
        name: codeValue.name,
        code: codeValue.code,
      };
    })
      ?.sort((a: { name: string, code: string }, b: { name: string, code: string }) => {
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
      && !this.filter.value.filter.BldStatus
      && !this.filter.value.filter.GlobalID;
  }
}
