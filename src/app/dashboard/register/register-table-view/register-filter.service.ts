import { Injectable } from '@angular/core';
import { BuildingFilter } from '../model/building';
import { CommonRegisterHelperService } from '../service/common-helper.service';
import { Chip } from 'src/app/common/standalone-components/chip/chip.component';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class RegisterFilterService {
  get filterObservable() {
    return this.filter.asObservable();
  }
  get globalIdsObservable() {
    return this.globalIds.asObservable();
  }

  private filter = new BehaviorSubject<BuildingFilter>({
    filter: {
      BldMunicipality: '',
      BldStatus: '',
      BldType: '',
      GlobalID: ''
    },
    options: {
      BldMunicipality: [] as never[],
      BldStatus: [] as never[],
      BldType: [] as never[],
    }
  });
  private globalIds = new BehaviorSubject<string[]>([]);

  private fields: never[] = [];

  constructor(private commonBuildingRegisterHelper: CommonRegisterHelperService) {
  }

  setBuildingGlobalIdFilter(globalId: string) {
    const filterValue = JSON.parse(JSON.stringify(this.filter.getValue()));
    filterValue.filter.GlobalID = globalId;
    this.filter.next(filterValue);
  }

  updateGlobalIds(globalIds: string[]) {
    this.globalIds.next(globalIds);
  }

  updateFilter(filter: BuildingFilter) {
    this.filter.next(filter);
  }

  prepareFilter(fields: never[]) {
    this.fields = fields;
    this.filter.next({
      filter: this.filter.value.filter,
      options: {
        BldMunicipality: this.getOptions('BldMunicipality').length ? this.getOptions('BldMunicipality') : this.filter.value.options.BldMunicipality,
        BldStatus: this.getOptions('BldStatus').length ? this.getOptions('BldStatus') : this.filter.value.options.BldStatus,
        BldType: this.getOptions('BldType').length ? this.getOptions('BldType') : this.filter.value.options.BldType,
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
        conditions.push(filter.column + '=' + this.getWhereConditionValue(filter.value));
      });
    return conditions.length ? conditions.join(' and ') : '1=1';
  }

  prepareWhereCaseForEntrance() {
    return `fk_buildings in (${this.globalIds.getValue().map(id => '\'' + id + '\'')})`;
  }

  private getOptions(column: string) {
    const field = this.commonBuildingRegisterHelper.getField(this.fields, column);
    if (!field) {
      return [];
    }
    return field.domain?.codedValues?.map((codeValue: { name: string, code: string }) => {
      return {
        name: codeValue.name,
        code: codeValue.code,
      };
    });
  }

  private getWhereConditionValue(value: string | number) {
    return (typeof value == 'number') ? value : `'${value}'`;
  }
}
