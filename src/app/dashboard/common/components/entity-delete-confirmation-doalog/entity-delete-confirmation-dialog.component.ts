import { Component, Inject, OnDestroy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RegisterDeleteService } from '../../../register/register-table-view/register-delete.service';
import { EntityType } from '../../../quality-management/quality-management-config';
import {
  BUILDING_ENTITY,
  DWELLING_ENTITY,
  ENTRANCE_ENTITY,
} from '../../../../common/constants/common-constants';
import { filter, Subject, take, takeUntil } from 'rxjs';

export type EntityDeleteDialogData = {
  type: EntityType;
  idToDelete: string;
  reload: () => void;
};

@Component({
  selector: 'asrdb-entity-delete-confirmation-doalog',
  imports: [
    AsyncPipe,
    MatButton,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatProgressSpinner,
  ],
  providers: [RegisterDeleteService],
  templateUrl: './entity-delete-confirmation-dialog.component.html',
  styleUrl: './entity-delete-confirmation-dialog.component.css',
})
export class EntityDeleteConfirmationDialogComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly idToDelete?: string;

  type?: EntityType;
  disableDialogButtons = false;
  loadingDeleteData;
  toDeleteState;
  reload: () => void;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EntityDeleteDialogData,
    private registerDeleteService: RegisterDeleteService,
    private dialogRef: MatDialogRef<EntityDeleteConfirmationDialogComponent>
  ) {
    this.type = data.type;
    this.idToDelete = data.idToDelete;
    this.reload = data.reload;
    this.loadingDeleteData = this.registerDeleteService.deleteDataLoading;
    this.toDeleteState = this.registerDeleteService.state;

    switch (data.type) {
      case BUILDING_ENTITY:
        this.registerDeleteService.deleteBuilding(this.idToDelete);
        break;
      case ENTRANCE_ENTITY:
        this.registerDeleteService.deleteEntrance(this.idToDelete);
        break;
      case DWELLING_ENTITY:
        this.registerDeleteService.deleteDwelling(this.idToDelete);
        break;
      default:
        throw new Error(`Unknown entity type: ${data.type}`);
    }
  }

  handleCancelClick() {
    this.disableDialogButtons = false;
    this.registerDeleteService.reset();
    this.dialogRef.close();
  }

  handleDeleteConfirm() {
    if (!this.idToDelete || this.disableDialogButtons) {
      return;
    }
    this.disableDialogButtons = true;
    this.registerDeleteService.deleteDone
      .pipe(
        takeUntil(this.destroy$),
        filter(
          deleted =>
            deleted.buildingDone && deleted.entranceDone && deleted.dwellingDone
        ),
        take(1)
      )
      .subscribe(() => {
        this.reload();
        this.dialogRef.close();
      });
    this.registerDeleteService.confirmDelete();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected readonly ENTRANCE_ENTITY = ENTRANCE_ENTITY;
  protected readonly DWELLING_ENTITY = DWELLING_ENTITY;
  protected readonly BUILDING_ENTITY = BUILDING_ENTITY;
}
