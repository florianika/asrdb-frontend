import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';
import { Log } from '../../register-log-view/model/log';
import { DwellingDetailsComponent } from './dwelling-details/dwelling-details.component';
import { DwellingDetailsService } from './dwelling-details.service';

@Injectable()
export class DwellingDetailsDialogService {
  constructor(
    private dialog: MatDialog,
    private detailsService: DwellingDetailsService
  ) {}

  open(
    id: string,
    logs: Log[],
    buildingNumber?: number,
    entranceNumber?: number,
    entranceId?: string,
    streetName?: string,
    closeParent?: () => void
  ): void {
    this.detailsService.viewDwellingDetails(
      id,
      buildingNumber,
      entranceNumber,
      entranceId,
      streetName,
      () =>
        this.openDialog(
          logs,
          buildingNumber,
          entranceNumber,
          entranceId,
          closeParent
        )
    );
  }

  private openDialog(
    logs: Log[],
    buildingNumber?: number,
    entranceNumber?: number,
    entranceId?: string,
    closeParent?: () => void
  ): void {
    this.dialog
      .open(DwellingDetailsComponent, {
        data: {
          logs,
          buildingNumber,
          entranceNumber,
          entranceId,
          closeParent,
        },
        disableClose: true,
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe(() => this.detailsService.clearSelection());
  }
}
