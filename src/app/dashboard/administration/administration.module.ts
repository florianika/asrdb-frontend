import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdministrationRoutingModule } from './administration-routing.module';
import { UserManagementComponent } from './user-management/user-management.component';
import { RoleManagementComponent } from './role-management/role-management.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { UserManagementService } from './user-management/user-management.service';
import { HttpClientModule } from '@angular/common/http';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserViewDialogComponent } from './user-management/user-view-dialog/user-view-dialog.component';
import { UserEditDialogComponent } from './user-management/user-edit-dialog/user-edit-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';


@NgModule({
  declarations: [
    UserManagementComponent,
    RoleManagementComponent,
    UserViewDialogComponent,
    UserEditDialogComponent
  ],
  imports: [
    CommonModule,
    AdministrationRoutingModule,
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
    MatInputModule
  ],
  providers: [UserManagementService]
})
export class AdministrationModule { }
