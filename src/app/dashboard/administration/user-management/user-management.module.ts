import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserManagementRoutingModule } from './user-management-routing.module';
import {HttpClientModule} from "@angular/common/http";
import {FormsModule} from "@angular/forms";
import {MatTableModule} from "@angular/material/table";
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatSortModule} from "@angular/material/sort";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatMenuModule} from "@angular/material/menu";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatDialogModule} from "@angular/material/dialog";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {MatInputModule} from "@angular/material/input";
import {UserManagementComponent} from "./user-management.component";
import {UserViewDialogComponent} from "./user-view-dialog/user-view-dialog.component";
import {UserEditDialogComponent} from "./user-edit-dialog/user-edit-dialog.component";
import {UserManagementService} from "./user-management.service";
import { RoleSelectorComponent } from 'src/app/common/components/role-selector/role-selector.component';


@NgModule({
  declarations: [
    UserManagementComponent,
    UserViewDialogComponent,
    UserEditDialogComponent
  ],
  imports: [
    CommonModule,
    UserManagementRoutingModule,
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
    RoleSelectorComponent
  ],
  providers: [
    UserManagementService
  ]
})
export class UserManagementModule { }
