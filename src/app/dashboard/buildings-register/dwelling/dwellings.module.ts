import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DwellingsRoutingModule } from './dwellings-routing.module';
import { DwellingDetailsComponent } from './dwelling-details/dwelling-details.component';


@NgModule({
  declarations: [
    DwellingDetailsComponent,
  ],
  imports: [
    CommonModule,
    DwellingsRoutingModule
  ]
})
export class DwellingsModule { }
