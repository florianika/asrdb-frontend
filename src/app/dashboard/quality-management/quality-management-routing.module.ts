import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QualityManagementComponent } from './quality-management.component';

const routes: Routes = [
  {path: '', component: QualityManagementComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class QualityManagementRoutingModule { }
