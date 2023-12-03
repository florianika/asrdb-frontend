import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BuildingRoutingModule } from './building-routing.module';
import { BuildingListViewComponent } from './building-list-view/building-list-view.component';
import { BuildingDetailsComponent } from './building-details/building-details.component';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CommonBuildingService } from '../../common/service/common-building.service';


@NgModule({
  declarations: [
    BuildingListViewComponent,
    BuildingDetailsComponent
  ],
  imports: [
    CommonModule,
    BuildingRoutingModule,
    MatTableModule,
    MatButtonModule,
    MatPaginatorModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatMenuModule
  ],
  providers: [
    CommonBuildingService
  ]
})
export class BuildingModule { }
