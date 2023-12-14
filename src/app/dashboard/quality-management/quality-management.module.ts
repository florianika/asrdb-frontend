import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QualityManagementRoutingModule } from './quality-management-routing.module';
import { QualityManagementComponent } from './quality-management.component';
import { QualityTableComponent } from './common/component/quality-table/quality-table.component';


@NgModule({
  declarations: [
    QualityManagementComponent,
    QualityTableComponent
  ],
  imports: [
    CommonModule,
    QualityManagementRoutingModule
  ]
})
export class QualityManagementModule { }
