import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmailTemplateManagementService } from './email-template-management/email-template-management.service';
import { TestBuildingService } from './test-buildings/test-building.service';

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
      import('./email-template-management/email-template-management.module').then(
        m => m.EmailTemplateManagementModule
      ),
    providers: [EmailTemplateManagementService],
  },
  {
    path: 'test-buildings',
    loadComponent: () =>
      import('./test-buildings/test-buildings.component').then(
        m => m.TestBuildingsComponent
      ),
    providers: [TestBuildingService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdministrationRoutingModule {}
