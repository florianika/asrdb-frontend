import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GuardService } from '../common/services/guard.service';
import { GuardAdminService } from '../common/services/guard-admin.service';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard/overview', pathMatch: 'full' },
  {
    path: 'overview',
    loadChildren: () =>
      import('./overview/overview.module').then(m => m.OverviewModule),
    canActivate: [GuardService],
  },
  {
    path: 'register',
    loadChildren: () =>
      import('./register/register.module').then(m => m.RegisterModule),
    canActivate: [GuardService],
  },
  {
    path: 'street-management',
    loadChildren: () =>
      import('./street-management/street-management.module').then(
        m => m.StreetManagementModule
      ),
    canActivate: [GuardAdminService],
  },
  {
    path: 'quality-management',
    loadChildren: () =>
      import('./quality-management/quality-management.module').then(
        m => m.QualityManagementModule
      ),
    canActivate: [GuardAdminService],
  },
  {
    path: 'administration',
    loadChildren: () =>
      import('./administration/administration.module').then(
        m => m.AdministrationModule
      ),
    canActivate: [GuardAdminService],
  },
  {
    path: 'field-work',
    loadChildren: () =>
      import('./field-work/field-work.module').then(m => m.FieldWorkModule),
    canActivate: [GuardAdminService],
  },
  {
    path: 'statistic-export',
    loadComponent: () =>
      import('./statistic-export/statistic-export.component').then(
        m => m.StatisticExportComponent
      ),
    canActivate: [GuardAdminService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
