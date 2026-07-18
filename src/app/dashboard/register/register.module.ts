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
import { CommonEsriAuthService } from '../common/service/common-esri-auth.service';
import { CommonRegisterHelperService } from '../common/service/common-helper.service';
import { RegisterFilterService } from './register-table-view/register-filter.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RegisterLogService } from './register-log-view/register-log-table/register-log.service';
import { CommonEntityStructureService } from '../common/service/common-entity-structure.service';
import { EntranceDetailsService } from './register-view-details-v2/entrance/entrance-details.service';
import { DwellingDetailsService } from './register-view-details-v2/dwelling/dwelling-details.service';
import { DwellingDetailsDialogService } from './register-view-details-v2/dwelling/dwelling-details-dialog.service';
import { EntranceDetailsDialogService } from './register-view-details-v2/entrance/entrance-details-dialog.service';
import { RegisterViewDetailsV2Component } from './register-view-details-v2/register-view-details-v2.component';
import { RegisterViewDetailsService } from './register-view-details-v2/register-view-details.service';
import { RegisterViewDetailsStore } from './register-view-details-v2/register-view-details.store';
import { RegisterViewDetailsMapper } from './register-view-details-v2/register-view-details.mapper';
import { RegisterViewDetailsApiAdapter } from './register-view-details-v2/register-view-details-api.adapter';

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
    CommonEsriAuthService,
    CommonRegisterHelperService,
    RegisterFilterService,
    RegisterLogService,
    CommonEntityStructureService,
    EntranceDetailsService,
    DwellingDetailsService,
    DwellingDetailsDialogService,
    EntranceDetailsDialogService,
    RegisterViewDetailsService,
    RegisterViewDetailsStore,
    RegisterViewDetailsMapper,
    RegisterViewDetailsApiAdapter,
  ],
})
export class RegisterModule {}
