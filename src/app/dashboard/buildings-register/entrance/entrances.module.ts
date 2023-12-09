import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EntrancesRoutingModule } from './entrances-routing.module';
import { EntranceDetailsComponent } from './entrance-details/entrance-details.component';


@NgModule({
  declarations: [
    EntranceDetailsComponent
  ],
  imports: [
    CommonModule,
    EntrancesRoutingModule
  ]
})
export class EntrancesModule { }
