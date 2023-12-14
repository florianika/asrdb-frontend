import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OverviewRoutingModule } from './overview-routing.module';
import { OverviewComponent } from './overview.component';
import { PlotlyModule } from 'angular-plotly.js';
import * as PlotlyJS from 'plotly.js-dist-min';
import { GraphsComponent } from './components/graphs/graphs.component';
import { MatCardModule } from '@angular/material/card';
import { GoogleMapsModule } from '@angular/google-maps';
import { MatTableModule } from '@angular/material/table';
import { MapComponent } from './components/map/map.component';
import { OverviewService } from './components/service/overview.service';
import { GraphsService } from './components/graphs/graphs.service';
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatMenuModule} from "@angular/material/menu";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import { CommonEsriAuthService } from '../buildings-register/common/service/common-esri-auth.service';
import { CommonBuildingService } from '../buildings-register/common/service/common-building.service';
import { CommonEntranceService } from '../buildings-register/common/service/common-entrance.service';

PlotlyModule.plotlyjs = PlotlyJS;

@NgModule({
  declarations: [
    OverviewComponent,
    GraphsComponent,
    MapComponent
  ],
  imports: [
    CommonModule,
    OverviewRoutingModule,
    PlotlyModule,
    MatCardModule,
    GoogleMapsModule,
    MatTableModule,
    MatPaginatorModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule
  ],
  providers: [
    OverviewService,
    GraphsService,
    CommonEsriAuthService,
    CommonBuildingService,
    CommonEntranceService
  ]
})
export class OverviewModule { }
