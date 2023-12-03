import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DwellingsRoutingModule } from './dwellings-routing.module';
import { DwellingDetailsComponent } from './dwelling-details/dwelling-details.component';
import { DwellingListViewComponent } from './dwelling-list-view/dwelling-list-view.component';


@NgModule({
  declarations: [
    DwellingDetailsComponent,
    DwellingListViewComponent
  ],
  imports: [
    CommonModule,
    DwellingsRoutingModule
  ]
})
export class DwellingsModule { }
