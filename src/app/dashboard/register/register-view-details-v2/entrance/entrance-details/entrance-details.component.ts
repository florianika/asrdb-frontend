import { Component, inject } from '@angular/core';
import { BuildingDetailComponent } from '../../building-detail/building-detail.component';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
} from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';

import { RegisterMapComponent } from '../../../../common/components/register-map/register-map.component';
import { EntranceDetailsService } from '../entrance-details.service';
import { Router } from '@angular/router';
import { Entrance } from '../../../model/entrance';
import { DwellingListComponent } from '../../dwelling/dwelling-list/dwelling-list.component';
import { HistoryDetailsComponent } from '../../history-details/history-details.component';

@Component({
  selector: 'asrdb-entrance-details',
  imports: [
    BuildingDetailComponent,
    MatButton,
    MatCard,
    MatCardContent,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatIcon,
    MatIconButton,
    RegisterMapComponent,
    DwellingListComponent,
    HistoryDetailsComponent,
  ],
  templateUrl: './entrance-details.component.html',
  styleUrl: './entrance-details.component.css',
})
export class EntranceDetailsComponent {
  private router = inject(Router);
  private entranceDetailsService = inject(EntranceDetailsService);
  public entranceViewData = this.entranceDetailsService.viewData;
  public entranceStructure = this.entranceDetailsService.entranceStructure;

  get titleSection() {
    return this.entranceStructure().titleSection;
  }

  get sections() {
    return this.entranceStructure().sections;
  }

  get entrance() {
    return this.entranceViewData().selectedEntrance;
  }

  get buildingGlobalId() {
    return this.entranceViewData().buildingId;
  }

  get id() {
    return this.entrance?.GlobalID || '';
  }

  get isLoadingStructure() {
    return this.entranceStructure().isLoadingStructure;
  }

  openEditView() {
    void this.router.navigateByUrl(
      `/dashboard/register/form/ENTRANCE/
      ${this.entranceViewData().buildingId}
      ?entranceId=${this.entranceViewData().selectedEntrance?.GlobalID}`
    );
  }

  getValueFromStatus(key: string) {
    return this.entranceDetailsService.getValueFromStatus(
      key as keyof Entrance
    );
  }
}
