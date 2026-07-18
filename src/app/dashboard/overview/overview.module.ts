import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OverviewRoutingModule } from './overview-routing.module';
import { OverviewComponent } from './overview.component';
import { PlotlyModule } from 'angular-plotly.js';
import * as PlotlyJS from 'plotly.js-basic-dist-min';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonEsriAuthService } from '../common/service/common-esri-auth.service';
import { RegisterMapComponent } from '../common/components/register-map/register-map.component';
import { RegisterFilterService } from '../register/register-table-view/register-filter.service';
import { CommonRegisterHelperService } from '../common/service/common-helper.service';
import { ChipComponent } from '../../common/standalone-components/chip/chip.component';
import { MatDialogModule } from '@angular/material/dialog';
import { PieGraphComponent } from './components/pie-graph/pie-graph.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FilterHelper } from '../common/helper/filter-helper';

@NgModule({
  declarations: [OverviewComponent, PieGraphComponent],
  imports: [
    CommonModule,
    OverviewRoutingModule,
    PlotlyModule.forRoot(PlotlyJS),
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    RegisterMapComponent,
    ChipComponent,
    MatTooltipModule,
  ],
  providers: [
    CommonEsriAuthService,
    RegisterFilterService,
    CommonRegisterHelperService,
    FilterHelper,
  ],
})
export class OverviewModule {}
