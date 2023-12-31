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
import { CommonBuildingService } from '../common/service/common-building.service';
import { MatSortModule } from '@angular/material/sort';
import { CommonEsriAuthService } from '../common/service/common-esri-auth.service';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { BuildingListViewFilterComponent } from './building-list-view/building-list-view-filter/building-list-view-filter.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ChipComponent } from 'src/app/common/standalone-components/chip/chip.component';
import { CommonBuildingRegisterHelper } from '../common/service/common-helper.service';
import { EntranceListViewComponent } from '../common/component/entrance-list-view/entrance-list-view.component';
import { DwellingListViewComponent } from '../common/component/dwelling-list-view/dwelling-list-view.component';
import { FormsModule } from '@angular/forms';
import { BuildingDetailComponent } from '../common/component/building-detail/building-detail.component';

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
    ChipComponent,
    EntranceListViewComponent,
    DwellingListViewComponent,
    FormsModule,
    BuildingDetailComponent
  ],
  providers: [
    CommonBuildingService,
    CommonEsriAuthService,
    CommonBuildingRegisterHelper
  ]
})
export class BuildingModule { }
