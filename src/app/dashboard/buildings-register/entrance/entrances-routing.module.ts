import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EntranceListViewComponent } from '../common/component/entrance-list-view/entrance-list-view.component';
import { EntranceDetailsComponent } from './entrance-details/entrance-details.component';

const routes: Routes = [
  {path: '', component: EntranceListViewComponent, pathMatch: 'full'},
  { path: 'details/:id', component: EntranceDetailsComponent },];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EntrancesRoutingModule { }
