import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StreetManagementTableComponent } from './street-management-table/street-management-table.component';
import { StreetManagementFormComponent } from './street-management-form/street-management-form.component';

const routes: Routes = [
  { path: '', component: StreetManagementTableComponent },
  { path: 'form', pathMatch: 'full', component: StreetManagementFormComponent },
  { path: 'form/:id', component: StreetManagementFormComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StreetManagementRoutingModule {}
