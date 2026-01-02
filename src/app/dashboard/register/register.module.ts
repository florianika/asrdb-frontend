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
import { RegisterMapComponent } from '../common/components/register-map/register-map.component';
import { RegisterFormComponent } from './register-form/register-form.component';
import { CommonBuildingService } from '../common/service/common-building.service';
import { CommonEntranceService } from '../common/service/common-entrance.service';
import { CommonDwellingService } from '../common/service/common-dwellings.service';
import { CommonEsriAuthService } from '../common/service/common-esri-auth.service';
import { CommonRegisterHelperService } from '../common/service/common-helper.service';
import { RegisterFilterService } from './register-table-view/register-filter.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RegisterLogService } from './register-log-view/register-log-table/register-log.service';
import { CommonEntityStructureService } from '../common/service/common-entity-structure.service';
import { EntranceDetailsService } from './register-view-details-v2/entrance/entrance-details.service';
import { DwellingDetailsService } from './register-view-details-v2/dwelling/dwelling-details.service';
import { RegisterViewDetailsV2Component } from './register-view-details-v2/register-view-details-v2.component';
import { RegisterViewDetailsService } from './register-view-details-v2/register-view-details.service';

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
    MatSnackBarModule,
    RegisterTableViewComponent,
    RegisterTableComponent,
    RegisterMapComponent,
    RegisterFormComponent,
    RegisterViewDetailsV2Component,
  ],
  providers: [
    CommonBuildingService,
    CommonEntranceService,
    CommonDwellingService,
    CommonEsriAuthService,
    CommonRegisterHelperService,
    RegisterFilterService,
    RegisterLogService,
    CommonEntityStructureService,
    EntranceDetailsService,
    DwellingDetailsService,
    RegisterViewDetailsService,
  ],
})
export class RegisterModule {}
