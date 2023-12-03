import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BuildingListViewComponent } from './building-list-view/building-list-view.component';

const routes: Routes = [
  { path: '', component: BuildingListViewComponent },
  { path: 'details/:id', component: BuildingListViewComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BuildingRoutingModule { }
