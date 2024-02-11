import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegisterRoutingModule } from './register-routing.module';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RegisterTableViewComponent } from './register-table-view/register-table-view.component';
import { RegisterTableComponent } from './register-table-view/register-table/register-table.component';
import { RegisterMapComponent } from './register-table-view/register-map/register-map.component';
import { RegisterFormComponent } from './register-table-view/register-form/register-form.component';
import { RegisterViewDetailsComponent } from './register-view-details/register-view-details.component';
import { CommonBuildingService } from './service/common-building.service';
import { CommonEntranceService } from './service/common-entrance.service';
import { CommonDwellingService } from './service/common-dwellings.service';
import { CommonEsriAuthService } from './service/common-esri-auth.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { CommonBuildingRegisterHelper } from './service/common-helper.service';
import { RegisterFilterService } from './register-table-view/register-filter.service';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RegisterRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatStepperModule,
    RegisterTableViewComponent,
    RegisterTableComponent,
    RegisterMapComponent,
    RegisterFormComponent,
    RegisterViewDetailsComponent,
  ],
  providers: [
    CommonBuildingService,
    CommonEntranceService,
    CommonDwellingService,
    CommonEsriAuthService,
    CommonBuildingRegisterHelper,
    RegisterFilterService
  ]
})
export class RegisterModule { }
