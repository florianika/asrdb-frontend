import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BuildingListViewComponent } from './building-list-view/building-list-view.component';
import { BuildingDetailsComponent } from './building-details/building-details.component';

const routes: Routes = [
  { path: '', component: BuildingListViewComponent, pathMatch: 'full' },
  { path: 'details/:id', component: BuildingDetailsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BuildingRoutingModule { }
