import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GuardService } from '../common/services/guard.service';
import { GuardAdminService } from '../common/services/guard-admin.service';

const routes: Routes = [
  {path: '',   redirectTo: '/dashboard/overview', pathMatch: 'full'},
  {path: 'overview', loadChildren: () => import('./overview/overview.module').then(m => m.OverviewModule), canActivate: [GuardService]},
  {path: 'register', loadChildren: () => import('./register/register.module').then(m => m.RegisterModule), canActivate: [GuardService]},
  {path: 'quality-management', loadChildren: () => import('./quality-management/quality-management.module').then(m => m.QualityManagementModule), canActivate: [GuardAdminService]},
  {path: 'administration', loadChildren: () => import('./administration/administration.module').then(m => m.AdministrationModule), canActivate: [GuardAdminService]},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
