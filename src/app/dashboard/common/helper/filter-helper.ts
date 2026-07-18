import { Chip } from 'src/app/dashboard/common/components/chip/chip.component';
import { BuildingFilter } from '../model/building';
import { Injectable } from '@angular/core';
import { CommonRegisterHelperService } from '../service/common-helper.service';
import { AuthorizationPolicyService } from '../../../common/services/authorization-policy.service';

type FilterValue = string | string[] | number;
type BuildingFilterColumn = keyof BuildingFilter['filter'];

@Injectable()
export class FilterHelper {
  private fields: Record<string, unknown>[] = [];

  constructor(
    private commonBuildingRegisterHelper: CommonRegisterHelperService,
    private authorizationPolicy: AuthorizationPolicyService
  ) {}

  init(fields: Record<string, unknown>[]) {
    this.fields = fields;
  }

  removeFilterValue($event: Chip, filter: BuildingFilter) {
    const filterCopy = JSON.parse(JSON.stringify(filter)) as BuildingFilter;
    const column = $event.column as BuildingFilterColumn;
    const columnValue = filterCopy.filter[column];

    if (column === 'GlobalID') {
      const values = String(columnValue)
        .split(',')
        .filter((value: string) => value !== $event.value);
      filterCopy.filter[column] = values.join(',') as never;
    } else if (Array.isArray(columnValue)) {
      filterCopy.filter[column] = columnValue.filter(value => {
        return (
          String(
            this.commonBuildingRegisterHelper.getValueFromStatus(
              this.fields,
              column,
              value
            )
          ) !== $event.value
        );
      }) as never;
    } else {
      filterCopy.filter[column] = '' as never;
    }
    return filterCopy;
  }

  getFilterChipStructure = (
    currentValue: Chip[],
    [key, value]: [key: string, value: FilterValue]
  ) => {
    if (Array.isArray(value)) {
      value.forEach(subValues => {
        currentValue.push({
          column: key,
          value: String(
            this.commonBuildingRegisterHelper.getValueFromStatus(
              this.fields,
              key,
              subValues
            )
          ),
        });
      });
      return currentValue;
    } else if (key === 'GlobalID' && typeof value === 'string') {
      const globalIds = value.split(',');
      globalIds.forEach(v => {
        currentValue.push({
          column: key,
          value: v,
        });
      });
      return currentValue;
    } else if (key === 'BldWithQuePendingIds' && typeof value === 'string') {
      if (value) {
        currentValue.push({
          column: key,
          value: 'Yes',
        });
        return currentValue;
      }
      return currentValue;
    } else {
      if (
        key === 'BldMunicipality' &&
        !this.authorizationPolicy.can('manage-municipality-scope')
      ) {
        return currentValue;
      }
      currentValue.push({
        column: key,
        value: String(
          this.commonBuildingRegisterHelper.getValueFromStatus(
            this.fields,
            key,
            value
          )
        ),
      });
      return currentValue;
    }
  };
}
