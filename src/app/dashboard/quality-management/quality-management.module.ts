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
import {MatListModule} from '@angular/material/list';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { QualityManagementTableFitlerComponent } from './quality-management-table/quality-management-table-fitler/quality-management-table-fitler.component';
import { VariableSelectorComponent } from 'src/app/common/standalone-components/variable-selector/variable-selector.component';
import {ACE_CONFIG, AceConfigInterface, AceModule} from "ngx-ace-wrapper";
import {
  QualityManagementVariableSelectionComponent
} from "./quality-management-edit/quality-management-form/quality-management-variable-selection/quality-management-variable-selection.component";

const DEFAULT_ACE_CONFIG: AceConfigInterface = {
  readOnly: false,
  minLines: 20
};

@NgModule({
  declarations: [
    QualityManagementTableComponent,
    QualityManagementEditComponent,
    QualityManagementFormComponent,
    QualityManagementTableFitlerComponent,
    QualityManagementVariableSelectionComponent
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
    FormsModule,
    VariableSelectorComponent,
    AceModule
  ],
  providers: [
    QualityManagementService,
    {
      provide: ACE_CONFIG,
      useValue: DEFAULT_ACE_CONFIG
    }
  ]
})
export class QualityManagementModule { }
