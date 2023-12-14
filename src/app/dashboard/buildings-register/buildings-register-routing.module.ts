import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', loadChildren: () => import('./building/building.module').then(m => m.BuildingModule) },
  { path: 'entrance', loadChildren: () => import('./entrance/entrances.module').then(m => m.EntrancesModule) },
  { path: 'dwelling', loadChildren: () => import('./dwelling/dwellings.module').then(m => m.DwellingsModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BuildingsRegisterRoutingModule { }
