import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserManagementComponent } from './user-management/user-management.component';
import { RoleManagementComponent } from './role-management/role-management.component';

const routes: Routes = [
  {path: '',   redirectTo: '/dashboard/administration/user-management', pathMatch: 'full'},
  {path: 'user-management', component: UserManagementComponent},
  {path: 'role-management', component: RoleManagementComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdministrationRoutingModule { }
