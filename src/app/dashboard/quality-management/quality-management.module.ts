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
import { QualityManagementFormComponent } from './quality-management-edit/quality-management-form/quality-management-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { QualityManagementExpressionBuilderComponent } from './quality-management-edit/quality-management-expression-builder/quality-management-expression-builder.component';
import {MatListModule} from '@angular/material/list';
import { ExpressionFormComponent } from './quality-management-edit/quality-management-expression-builder/expression-form/expression-form.component';
import {MatCheckboxModule} from '@angular/material/checkbox';

@NgModule({
  declarations: [
    QualityManagementTableComponent,
    QualityManagementEditComponent,
    QualityManagementFormComponent,
    QualityManagementExpressionBuilderComponent,
    ExpressionFormComponent
  ],
  imports: [
    CommonModule,
    QualityManagementRoutingModule,
    MatCardModule,
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
    MatSelectModule,
    MatStepperModule,
    MatListModule,
    ChipComponent,
    ReactiveFormsModule,
    MatCheckboxModule,
    FormsModule
  ],
  providers: [
    QualityManagementService
  ]
})
export class QualityManagementModule { }
