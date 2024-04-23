import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RoleManagementRoutingModule } from './role-management-routing.module';
import {RoleManagementComponent} from './role-management.component';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSortModule} from '@angular/material/sort';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {RoleManagementService} from './role-management.service';
import { RoleTableComponent } from './role-table/role-table.component';
import { MatCardModule } from '@angular/material/card';
import { RoleCreateDialogComponent } from './role-create-dialog/role-create-dialog.component';
import { RoleEditDialogComponent } from './role-edit-dialog/role-edit-dialog.component';
import { EntityTypeSelectorComponent } from 'src/app/common/standalone-components/entity-type-selector/entity-type-selector.component';
import { PermissionSelectorComponent } from 'src/app/common/standalone-components/permission-selector/permission-selector.component';
import { RoleSelectorComponent } from 'src/app/common/standalone-components/role-selector/role-selector.component';
import { VariableSelectorComponent } from 'src/app/common/standalone-components/variable-selector/variable-selector.component';
import { RoleDeleteDialogComponent } from './role-delete-dialog/role-delete-dialog.component';
import {MatTooltipModule} from "@angular/material/tooltip";
import {CommonEsriAuthService} from "../../register/service/common-esri-auth.service";


@NgModule({
  declarations: [
    RoleManagementComponent,
    RoleTableComponent,
    RoleCreateDialogComponent,
    RoleEditDialogComponent,
    RoleDeleteDialogComponent
  ],
  imports: [
    CommonModule,
    RoleManagementRoutingModule,
    HttpClientModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCardModule,
    RoleSelectorComponent,
    EntityTypeSelectorComponent,
    VariableSelectorComponent,
    PermissionSelectorComponent,
    MatTooltipModule
  ],
  providers: [
    RoleManagementService,
    CommonEsriAuthService
  ]
})
export class RoleManagementModule { }
