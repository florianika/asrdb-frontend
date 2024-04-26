import {Chip} from "../../../common/standalone-components/chip/chip.component";
import {BuildingFilter} from "../../register/model/building";
import {Injectable} from "@angular/core";
import {CommonRegisterHelperService} from "../service/common-helper.service";

@Injectable()
export class FilterHelper {
  private fields: never[] = [];

  constructor(
    private commonBuildingRegisterHelper: CommonRegisterHelperService,
  ) {}

  init(fields: never[]) {
    this.fields = fields;
  }

  removeFilterValue($event: Chip, filter: BuildingFilter) {
    const filterCopy = JSON.parse(JSON.stringify(filter));
    if ($event.column === 'GlobalID') {
      const values = (filterCopy as any).filter[$event.column].split(',')
        .filter((value: string) => value !== $event.value);
      (filterCopy as any).filter[$event.column] = values.join(',');
    } else if (Array.isArray((filterCopy as any).filter[$event.column])) {
      (filterCopy as any).filter[$event.column] = (filterCopy as any).filter[$event.column]
        .filter((value: string) => this.commonBuildingRegisterHelper.getValueFromStatus(this.fields, $event.column, value) !== $event.value);
    } else {
      (filterCopy as any).filter[$event.column] = '';
    }
    return filterCopy;
  }

  getFilterChipStructure = (currentValue: Chip[], [key, value]: [key: string, value: string | string[]]) => {
    if (Array.isArray(value)) {
      value.forEach(subValues => {
        currentValue.push({
          column: key,
          value: this.commonBuildingRegisterHelper.getValueFromStatus(this.fields, key, subValues)
        })
      });
      return currentValue;
    } else if (key === 'GlobalID') {
      const globalIds = value.split(',');
      globalIds.forEach(v => {
        currentValue.push({
          column: key,
          value: v
        })
      });
      return currentValue;
    } else {
      currentValue.push({
        column: key,
        value: this.commonBuildingRegisterHelper.getValueFromStatus(this.fields, key, value)
      });
      return currentValue;
    }
  };
}
