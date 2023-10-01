import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OverviewRoutingModule } from './overview-routing.module';
import { OverviewComponent } from './overview.component';
import { PlotlyModule } from 'angular-plotly.js';
import * as PlotlyJS from 'plotly.js-dist-min';
import { GraphsComponent } from './components/graphs/graphs.component';
import { MapsComponent } from './components/maps/maps.component';
import { TablesComponent } from './components/tables/tables.component';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';

PlotlyModule.plotlyjs = PlotlyJS;

@NgModule({
  declarations: [
    OverviewComponent,
    GraphsComponent,
    MapsComponent,
    TablesComponent
  ],
  imports: [
    CommonModule,
    OverviewRoutingModule,
    PlotlyModule,
    MatCardModule,
    MatGridListModule
  ]
})
export class OverviewModule { }
