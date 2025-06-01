import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QualityManagementTableComponent } from './quality-management-table/quality-management-table.component';
import { QualityManagementEditComponent } from './quality-management-edit/quality-management-edit.component';
import { BUILDING_ENTITY } from '../../common/constants/common-constants';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: BUILDING_ENTITY },
  {
    path: ':entity',
    pathMatch: 'full',
    component: QualityManagementTableComponent,
  },
  {
    path: ':entity/edit/:id',
    pathMatch: 'full',
    component: QualityManagementEditComponent,
  },
  {
    path: ':entity/edit',
    redirectTo: '/dashboard/quality-management/:entity/edit/',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QualityManagementRoutingModule {}
