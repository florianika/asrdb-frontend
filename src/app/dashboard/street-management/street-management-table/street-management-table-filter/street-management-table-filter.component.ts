import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {MatSelectChange} from "@angular/material/select";
import {StreetFilter} from "../../../register/model/street";

@Component({
  selector: 'asrdb-street-management-table-filter',
  templateUrl: './street-management-table-filter.component.html',
  styleUrls: ['./street-management-table-filter.component.css']
})
export class StreetManagementTableFilterComponent {
  filterConfig: StreetFilter;
  filterValue = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: StreetFilter,
  ) {
    this.filterConfig = data;
  }

  get municipalities() {
    return this.filterConfig.options.StrMunicipality
      .filter((el: any) => !this.filterValue || el.name.toString().toLowerCase().includes(this.filterValue.toLowerCase()));
  }

  changeValue(event: MatSelectChange, filterProp: string) {
    (this.filterConfig.filter as any)[filterProp] = event.value;
  }

  cleanValue(event: any, filterProp: string) {
    event.stopPropagation();
    event.preventDefault();
    (this.filterConfig.filter as any)[filterProp] = '';
  }
}
