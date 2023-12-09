import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EntrancesRoutingModule } from './entrances-routing.module';
import { EntranceDetailsComponent } from './entrance-details/entrance-details.component';
import { EntranceListViewComponent } from '../../common/component/entrance-list-view/entrance-list-view.component';
import { CommonEsriAuthService } from '../../common/service/common-esri-auth.service';
import { CommonBuildingRegisterHelper } from '../../common/service/common-helper.service';
import { MatDialogModule } from '@angular/material/dialog';


@NgModule({
  declarations: [
    EntranceDetailsComponent
  ],
  imports: [
    CommonModule,
    EntrancesRoutingModule,
    EntranceListViewComponent,
    MatDialogModule
  ],
  providers: [
    CommonEsriAuthService,
    CommonBuildingRegisterHelper
  ]
})
export class EntrancesModule { }
