import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegisterRoutingModule } from './register-routing.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RegisterTableViewComponent } from './register-table-view/register-table-view.component';
import { RegisterTableComponent } from './register-table-view/register-table/register-table.component';
import { RegisterMapComponent } from './register-table-view/register-map/register-map.component';
import { RegisterFormComponent } from './register-form/register-form.component';
import { RegisterViewDetailsComponent } from './register-view-details/register-view-details.component';
import { CommonBuildingService } from './service/common-building.service';
import { CommonEntranceService } from './service/common-entrance.service';
import { CommonDwellingService } from './service/common-dwellings.service';
import { CommonEsriAuthService } from './service/common-esri-auth.service';
import { CommonRegisterHelperService } from './service/common-helper.service';
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
    CommonRegisterHelperService,
    RegisterFilterService
  ]
})
export class RegisterModule { }
