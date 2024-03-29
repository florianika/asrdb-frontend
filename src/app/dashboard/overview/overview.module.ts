import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OverviewRoutingModule } from './overview-routing.module';
import { OverviewComponent } from './overview.component';
import { PlotlyModule } from 'angular-plotly.js';
import * as PlotlyJS from 'plotly.js-dist-min';
import { MatCardModule } from '@angular/material/card';
import { GoogleMapsModule } from '@angular/google-maps';
import { MatTableModule } from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import { CommonBuildingService } from '../register/service/common-building.service';
import { CommonEntranceService } from '../register/service/common-entrance.service';
import { CommonEsriAuthService } from '../register/service/common-esri-auth.service';
import {RegisterMapComponent} from "../register/register-table-view/register-map/register-map.component";
import {RegisterFilterService} from "../register/register-table-view/register-filter.service";
import {CommonRegisterHelperService} from "../register/service/common-helper.service";
import {ChipComponent} from "../../common/standalone-components/chip/chip.component";
import {MatDialogModule} from "@angular/material/dialog";

PlotlyModule.plotlyjs = PlotlyJS;

@NgModule({
  declarations: [
    OverviewComponent,
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
    MatIconModule,
    MatDialogModule,
    RegisterMapComponent,
    ChipComponent,
  ],
  providers: [
    CommonEsriAuthService,
    CommonBuildingService,
    CommonEntranceService,
    RegisterFilterService,
    CommonRegisterHelperService
  ]
})
export class OverviewModule { }
