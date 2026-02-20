import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import {
  StreetFilter,
  StreetFilterKey,
  StreetFilterOption,
} from '../../../register/model/street';

@Component({
  selector: 'asrdb-street-management-table-filter',
  templateUrl: './street-management-table-filter.component.html',
  styleUrls: ['./street-management-table-filter.component.css'],
})
export class StreetManagementTableFilterComponent {
  filterConfig: StreetFilter;
  filterValue = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: StreetFilter) {
    this.filterConfig = data;
  }

  get municipalities() {
    return this.filterConfig.options.StrMunicipality.filter(
      (el: StreetFilterOption) =>
        !this.filterValue ||
        el.name
          .toString()
          .toLowerCase()
          .includes(this.filterValue.toLowerCase())
    );
  }

  changeValue(event: MatSelectChange, filterProp: StreetFilterKey) {
    if (filterProp === 'StrType') {
      const nextValue = Array.isArray(event.value)
        ? event.value
            .map(value => Number.parseInt(value?.toString() ?? '', 10))
            .filter(value => !Number.isNaN(value))
        : [];
      this.filterConfig.filter.StrType = nextValue;
      return;
    }

    if (filterProp === 'StrMunicipality') {
      const parsed = Number.parseInt(event.value?.toString() ?? '', 10);
      this.filterConfig.filter.StrMunicipality = Number.isNaN(parsed)
        ? null
        : parsed;
      return;
    }

    this.filterConfig.filter[filterProp] = event.value?.toString() ?? '';
  }

  cleanValue(event: Event, filterProp: StreetFilterKey) {
    event.stopPropagation();
    event.preventDefault();

    if (filterProp === 'StrMunicipality') {
      this.filterConfig.filter.StrMunicipality = null;
      return;
    }

    if (filterProp === 'StrType') {
      this.filterConfig.filter.StrType = [];
      return;
    }

    this.filterConfig.filter[filterProp] = '';
  }
}
