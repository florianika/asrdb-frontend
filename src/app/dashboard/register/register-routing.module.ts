import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {path: '', pathMatch: 'full', loadComponent: () => import('./register-table-view/register-table-view.component').then(c => c.RegisterTableViewComponent)},
  {path: 'details/:entity/:id', pathMatch: 'full', loadComponent: () => import('./register-view-details/register-view-details.component').then(c => c.RegisterViewDetailsComponent)},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RegisterRoutingModule { }