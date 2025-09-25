import { Component, Inject } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
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

export type EntityDeleteDialogData = {
  type: EntityType;
  idToDelete: string;
  reload: () => void;
};

@Component({
  selector: 'asrdb-entity-delete-confirmation-doalog',
  standalone: true,
  imports: [
    AsyncPipe,
    MatButton,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatProgressSpinner,
    NgIf,
  ],
  providers: [RegisterDeleteService],
  templateUrl: './entity-delete-confirmation-dialog.component.html',
  styleUrl: './entity-delete-confirmation-dialog.component.css',
})
export class EntityDeleteConfirmationDialogComponent {
  private deleteDialog?: MatDialogRef<any>;
  private readonly idToDelete?: string;

  type?:EntityType;
  disableDialogButtons = false;
  loadingDeleteData;
  toDeleteState;
  reload: () => void;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EntityDeleteDialogData,
    private registerDeleteService: RegisterDeleteService
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
    this.deleteDialog?.close();
    this.registerDeleteService.reset();
  }

  handleDeleteConfirm() {
    if (!this.idToDelete) {
      return;
    }
    this.disableDialogButtons = true;
    this.registerDeleteService.confirmDelete();
    this.registerDeleteService.deleteDone.subscribe(deleted => {
      if (
        deleted.buildingDone &&
        deleted.entranceDone &&
        deleted.dwellingDone
      ) {
        this.reload();
      }
    });
  }

  protected readonly ENTRANCE_ENTITY = ENTRANCE_ENTITY;
  protected readonly DWELLING_ENTITY = DWELLING_ENTITY;
  protected readonly BUILDING_ENTITY = BUILDING_ENTITY;
}
