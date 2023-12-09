import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DwellingListViewComponent } from '../../common/component/dwelling-list-view/dwelling-list-view.component';
import { DwellingDetailsComponent } from './dwelling-details/dwelling-details.component';

const routes: Routes = [
  {path: '', component: DwellingListViewComponent, pathMatch: 'full'},
  { path: 'details/:id', component: DwellingDetailsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DwellingsRoutingModule { }
