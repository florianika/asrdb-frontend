import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { take } from 'rxjs';
import { Log } from '../../register-log-view/model/log';
import { EntranceDetailsComponent } from './entrance-details/entrance-details.component';
import { EntranceDetailsService } from './entrance-details.service';

@Injectable()
export class EntranceDetailsDialogService {
  private dialogRef?: MatDialogRef<EntranceDetailsComponent>;

  constructor(
    private dialog: MatDialog,
    private detailsService: EntranceDetailsService
  ) {}

  open(id: string, logs: Log[], streetName?: string): void {
    this.detailsService.viewEntranceDetails(id, streetName, () => {
      this.dialogRef = this.dialog.open(EntranceDetailsComponent, {
        data: { logs },
        disableClose: true,
      });
      this.dialogRef
        .afterClosed()
        .pipe(take(1))
        .subscribe(() => {
          this.detailsService.clearSelection();
          this.dialogRef = undefined;
        });
    });
  }

  close(): void {
    this.dialogRef?.close();
  }
}
