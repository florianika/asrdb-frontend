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
import { MatSortModule } from '@angular/material/sort';
import { CommonEsriAuthService } from '../../common/service/common-esri-auth.service';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { BuildingListViewFilterComponent } from './building-list-view/building-list-view-filter/building-list-view-filter.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ChipComponent } from 'src/app/common/standalone-components/chip/chip.component';

@NgModule({
  declarations: [
    BuildingListViewComponent,
    BuildingDetailsComponent,
    BuildingListViewFilterComponent,
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
    MatMenuModule,
    MatSortModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    ChipComponent
  ],
  providers: [
    CommonBuildingService,
    CommonEsriAuthService
  ]
})
export class BuildingModule { }
