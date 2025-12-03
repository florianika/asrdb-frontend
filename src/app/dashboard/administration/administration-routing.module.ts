import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard/administration/user-management',
    pathMatch: 'full',
  },
  {
    path: 'user-management',
    loadChildren: () =>
      import('./user-management/user-management.module').then(
        m => m.UserManagementModule
      ),
  },
  {
    path: 'email-template-management',
    loadChildren: () =>
      import(
        './email-template-management/email-template-management.module'
      ).then(m => m.EmailTemplateManagementModule),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdministrationRoutingModule {}
