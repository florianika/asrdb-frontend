import {Component, inject, OnDestroy} from '@angular/core';
import {MatDialog, MatDialogModule, MatDialogRef} from "@angular/material/dialog";
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {BuildingDetailComponent} from "../../building-detail/building-detail.component";
import {HistoryDetailsComponent} from "../../history-details/history-details.component";
import {Dwelling} from "../../../model/dwelling";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {DwellingDetailsService} from "../dwelling-details.service";
import {
  DwellingDetailsFormComponent
} from "../../../register-form/dwelling-details-form/dwelling-details-form.component";
import {Log} from "../../../register-log-view/model/log";
import {Subject, takeUntil} from "rxjs";
import {RegisterViewDetailsService} from "../../register-view-details.service";
import {EntranceDetailsService} from "../../entrance/entrance-details.service";

@Component({
  selector: 'asrdb-dwelling-details',
  standalone: true,
  imports: [
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    BuildingDetailComponent,
    HistoryDetailsComponent,
    MatProgressSpinner
  ],
  templateUrl: './dwelling-details.component.html',
  styleUrl: './dwelling-details.component.css'
})
export class DwellingDetailsComponent implements OnDestroy {
  private destroy$ = new Subject<boolean>();

  private matDialog = inject(MatDialog);
  private dwellingDetailsService = inject(DwellingDetailsService);
  private entranceDetailsService = inject(EntranceDetailsService);
  private registerViewDetailsService = inject(RegisterViewDetailsService);
  private viewData = this.dwellingDetailsService.viewData;
  private entranceViewData = this.entranceDetailsService.viewData;
  private buildingViewData = this.registerViewDetailsService.viewData;
  private structures = this.dwellingDetailsService.dwellingStructure;

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  get dwelling() {
    return this.viewData().selectedDwelling;
  }

  get fields() {
    return this.viewData().dwellingFields ?? [];
  }

  get isLoadingResults() {
    return this.viewData().isLoadingDwellings ?? false;
  }

  get sections() {
    return this.structures()?.sections ?? [];
  }

  constructor(public dialogRef: MatDialogRef<DwellingDetailsComponent>) {

  }

  editDwellingDetails() {
    this.matDialog
      .open(DwellingDetailsFormComponent, {
        width: '600px',
        data: {
          entrances: this.entranceViewData().entranceList,
          id: this.viewData().selectedDwelling?.GlobalID,
          entranceId: this.entranceViewData().selectedEntrance?.GlobalID,
          logs: this.dwellingDetailsService.getLogs(this.viewData().selectedDwelling?.GlobalID || ''),
        },
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: string) => {
        if (!data) {
          return;
        }
        this.registerViewDetailsService.markAsUntested(
          this.buildingViewData().building?.GlobalID || '',
          this.entranceViewData().selectedEntrance?.GlobalID || '',
        );
        this.entranceDetailsService.dialogRef?.close();
        this.dialogRef.close();
      });
  }

  getValueFromStatus(column: string) {
    if (!this.dwelling) {
      return '';
    }
    return this.dwellingDetailsService.getValueFromStatus(column as keyof Dwelling);
  }
}
