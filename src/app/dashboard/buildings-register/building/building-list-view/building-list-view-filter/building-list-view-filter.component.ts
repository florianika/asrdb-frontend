import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { BuildingFilter } from 'src/app/dashboard/buildings-register/common/model/building';

@Component({
  selector: 'asrdb-building-list-view-filter',
  templateUrl: './building-list-view-filter.component.html',
  styleUrls: ['./building-list-view-filter.component.css']
})
export class BuildingListViewFilterComponent {
  filterConfig: BuildingFilter;

  constructor(@Inject(MAT_DIALOG_DATA) public data: BuildingFilter) {
    this.filterConfig = data;
  }

  changeValue(event: MatSelectChange, filterProp: string) {
    (this.filterConfig.filter as any)[filterProp] = event.value;
  }
}
