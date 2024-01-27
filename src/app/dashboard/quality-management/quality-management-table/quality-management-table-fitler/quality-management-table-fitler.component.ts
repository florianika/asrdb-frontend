import { Component, Inject } from '@angular/core';
import { QualityRuleFilter } from '../model/quality-rule-filter';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { EntityType } from '../../quality-management-config';

@Component({
  selector: 'asrdb-quality-management-table-fitler',
  templateUrl: './quality-management-table-fitler.component.html',
  styleUrls: ['./quality-management-table-fitler.component.css']
})
export class QualityManagementTableFitlerComponent {
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
}
