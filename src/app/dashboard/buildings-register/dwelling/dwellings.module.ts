import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DwellingsRoutingModule } from './dwellings-routing.module';
import { DwellingDetailsComponent } from './dwelling-details/dwelling-details.component';
import { DwellingListViewComponent } from '../../common/component/dwelling-list-view/dwelling-list-view.component';
import { CommonEsriAuthService } from '../../common/service/common-esri-auth.service';
import { CommonBuildingRegisterHelper } from '../../common/service/common-helper.service';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { BuildingDetailComponent } from '../../common/component/building-detail/building-detail.component';
import { CommonDwellingService } from '../../common/service/common-dwellings.service';


@NgModule({
  declarations: [
    DwellingDetailsComponent,
  ],
  imports: [
    CommonModule,
    DwellingsRoutingModule,
    DwellingListViewComponent,
    MatDialogModule,
    MatCardModule,
    BuildingDetailComponent
  ],
  providers: [
    CommonEsriAuthService,
    CommonBuildingRegisterHelper,
    CommonDwellingService
  ]
})
export class DwellingsModule { }
