import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StreetManagementRoutingModule } from './street-management-routing.module';
import { StreetManagementTableComponent } from './street-management-table/street-management-table.component';
import { StreetManagementFormComponent } from './street-management-form/street-management-form.component';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { CommonRegisterHelperService } from '../common/service/common-helper.service';
import { MatDialogModule } from '@angular/material/dialog';
import { ChipComponent } from '../../common/standalone-components/chip/chip.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { StreetManagementService } from '../register/register-form/street-creation.service';
import { StreetManagementTableFilterComponent } from './street-management-table/street-management-table-filter/street-management-table-filter.component';
import { RegisterMapComponent } from '../common/components/register-map/register-map.component';
import { RegisterFilterService } from '../register/register-table-view/register-filter.service';
import { CommonEsriAuthService } from '../common/service/common-esri-auth.service';
import { MatCheckbox } from '@angular/material/checkbox';

@NgModule({
  declarations: [
    StreetManagementTableComponent,
    StreetManagementFormComponent,
    StreetManagementTableFilterComponent,
  ],
  imports: [
    FormsModule,
    CommonModule,
    StreetManagementRoutingModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ChipComponent,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    RegisterMapComponent,
    MatCheckbox,
  ],
  providers: [
    CommonEsriAuthService,
    CommonRegisterHelperService,
    RegisterFilterService,
    StreetManagementService,
  ],
})
export class StreetManagementModule {}
