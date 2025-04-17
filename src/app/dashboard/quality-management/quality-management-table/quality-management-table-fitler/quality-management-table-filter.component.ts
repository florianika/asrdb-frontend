import {Component, Inject} from '@angular/core';
import {QualityRuleFilter} from '../model/quality-rule-filter';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatSelectChange} from '@angular/material/select';
import {EntityType} from '../../quality-management-config';

export const FILTER_CONFIG_PREFIX = 'filter-config-';

@Component({
  selector: 'asrdb-quality-management-table-filter',
  templateUrl: './quality-management-table-filter.component.html',
  styleUrls: ['./quality-management-table-filter.component.css']
})
export class QualityManagementTableFilterComponent {
  filterConfig: QualityRuleFilter;
  qualityType!: EntityType;

  constructor(@Inject(MAT_DIALOG_DATA) public data: {filter: QualityRuleFilter, qualityType: EntityType}) {
    this.filterConfig = data.filter;
    this.qualityType = data.qualityType;
  }

  changeStatusValue(event: MatSelectChange, filterProp: string) {
    (this.filterConfig as any)[filterProp] = event.value;
  }

  changeValue(event: string, filterProp: string) {
    (this.filterConfig as any)[filterProp] = event;
  }

  clearValue($event: any, filterProp: string) {
    $event.stopPropagation();
    $event.preventDefault();
    (this.filterConfig as any)[filterProp] = '';
  }

  applyFilter() {
    localStorage.setItem(FILTER_CONFIG_PREFIX + this.qualityType, JSON.stringify(this.filterConfig));
    return this.filterConfig;
  }
}
