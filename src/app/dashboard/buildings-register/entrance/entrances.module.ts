import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EntrancesRoutingModule } from './entrances-routing.module';
import { EntranceListViewComponent } from './entrance-list-view/entrance-list-view.component';
import { EntranceDetailsComponent } from './entrance-details/entrance-details.component';


@NgModule({
  declarations: [
    EntranceListViewComponent,
    EntranceDetailsComponent
  ],
  imports: [
    CommonModule,
    EntrancesRoutingModule
  ]
})
export class EntrancesModule { }
