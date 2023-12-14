import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {path: '', pathMatch: 'full', loadChildren: () => import('./quality-management-building/quality-management-building.module').then(m => m.QualityManagementBuildingModule)},
  {path: 'entrance', pathMatch: 'full', loadChildren: () => import('./quality-management-entrance/quality-management-entrance.module').then(m => m.QualityManagementEntranceModule)},
  {path: 'dwelling', pathMatch: 'full', loadChildren: () => import('./quality-management-dwelling/quality-management-dwelling.module').then(m => m.QualityManagementDwellingModule)},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class QualityManagementRoutingModule { }
