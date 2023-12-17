import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QualityManagementRoutingModule } from './quality-management-routing.module';
import { QualityManagementTableComponent } from './quality-management-table/quality-management-table.component';
import { QualityManagementEditComponent } from './quality-management-edit/quality-management-edit.component';
import { QualityManagementService } from './quality-management.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChipComponent } from 'src/app/common/standalone-components/chip/chip.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';


@NgModule({
  declarations: [
    QualityManagementTableComponent,
    QualityManagementEditComponent
  ],
  imports: [
    CommonModule,
    QualityManagementRoutingModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDialogModule,
    ChipComponent
  ],
  providers: [
    QualityManagementService
  ]
})
export class QualityManagementModule { }
