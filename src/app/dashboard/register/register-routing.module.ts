import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {GuardAdminService} from "../../common/services/guard-admin.service";

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./register-table-view/register-table-view.component').then(
        c => c.RegisterTableViewComponent
      ),
  },
  {
    path: 'details/:entity/:id',
    pathMatch: 'full',
    loadComponent: () =>
      import('./register-view-details-v2/register-view-details-v2.component').then(
        c => c.RegisterViewDetailsV2Component
      ),
  },
  {
    path: 'logs',
    pathMatch: 'full',
    loadComponent: () =>
      import('./register-log-view/register-log-view.component').then(
        c => c.RegisterLogViewComponent
      ),
  },
  {
    path: 'form/:entity',
    canActivate: [GuardAdminService],
    loadComponent: () =>
      import('./register-form/register-form.component').then(
        c => c.RegisterFormComponent
      ),
  },
  {
    path: 'form/:entity/:id',
    canActivate: [GuardAdminService],
    loadComponent: () =>
      import('./register-form/register-form.component').then(
        c => c.RegisterFormComponent
      ),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegisterRoutingModule {}
