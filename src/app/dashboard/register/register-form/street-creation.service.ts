import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, of } from 'rxjs';
import { EntityManageResponse } from '../model/entity-req-res';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Dwelling } from '../model/dwelling';
import { AuthStateService } from '../../../common/services/auth-state.service';
import { CommonStreetService } from '../../common/service/common-street.service';
import { Street } from '../model/street';
import { QueryFilter } from '../model/query-filter';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { CommonEntranceService } from '../../common/service/common-entrance.service';

@Injectable()
export class StreetManagementService {
  private isSaving = new BehaviorSubject(false);
  get isSavingObservable() {
    return this.isSaving.asObservable();
  }

  private responseHandler = () => ({
    next: (response: EntityManageResponse) => {
      if (
        !response['addResults']?.[0]?.success &&
        !response['updateResults']?.[0]?.success
      ) {
        this.snackBar.open(
          $localize`Could not save street data`,
          $localize`Ok`,
          { duration: 3000 }
        );
      }
      this.isSaving.next(false);
    },
    error: () => {
      this.isSaving.next(false);
      this.snackBar.open(
        $localize`There was an error when trying to save street data`,
        $localize`Ok`,
        { duration: 3000 }
      );
    },
  });

  constructor(
    private commonStreetService: CommonStreetService,
    private commonEntranceService: CommonEntranceService,
    private snackBar: MatSnackBar,
    private authState: AuthStateService,
    private matDialog: MatDialog
  ) {}

  public saveStreet(streetDetails: Street) {
    if (streetDetails.GlobalID) {
      this.validateStreetNameUniqueness(
        streetDetails.StrNameCore,
        streetDetails.StrMunicipality,
        () => this.updateStreet(streetDetails),
        (foundStreetId: string) =>
          this.mergeStreets(streetDetails, foundStreetId),
        streetDetails.GlobalID
      );
    } else {
      this.validateStreetNameUniqueness(
        streetDetails.StrNameCore,
        streetDetails.StrMunicipality,
        () => this.createStreet(streetDetails)
      );
    }
  }

  private validateStreetNameUniqueness(
    name: string,
    municipality: number,
    callback: () => void,
    mergeCallback?: (foundStreetIds: string) => void,
    globalId?: string
  ) {
    let whereClause = `StrMunicipality=${municipality} AND StrNameCore='${name}'`;
    if (globalId) {
      whereClause += ` AND GlobalID<>'${globalId}'`;
    }
    const filter = {
      where: whereClause,
      start: 0,
      num: 1,
      outFields: ['GlobalID'],
    };
    this.commonStreetService
      .getStreets(filter)
      .pipe(catchError(() => of(null)))
      .subscribe(data => {
        if (!data) {
          this.snackBar.open(
            $localize`Could not validate street name uniqueness. Please try again.`,
            $localize`Ok`,
            { duration: 5000 }
          );
          return;
        }
        if (data.count > 0) {
          if (!globalId) {
            this.snackBar.open(
              $localize`A street with this name already exists in the selected municipality.`,
              $localize`Ok`,
              { duration: 5000 }
            );
            return;
          } else if (mergeCallback) {
            const foundStreetId = data.data.features.map(
              (f: any) => f.attributes.GlobalID
            )?.[0];
            mergeCallback(foundStreetId);
            return;
          }
        }
        callback();
      });
  }

  private createStreet(street: Street) {
    street.external_creator = `{${this.authState.getNameId()}}`;
    street.external_creator_date = String(Date.now());
    const features = this.createFeatures(street);
    this.commonStreetService
      .createFeature(features)
      .subscribe(this.responseHandler());
  }

  private updateStreet(street: Street) {
    street.external_editor = `{${this.authState.getNameId()}}`;
    street.external_editor_date = String(Date.now());
    const features = this.createFeatures(street);
    this.commonStreetService
      .updateFeature(features)
      .subscribe(this.responseHandler());
  }

  private mergeStreets(street: Street, foundStreetIds: string) {
    this.isSaving.next(true);
    this.matDialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        height: '400px',
        data: {
          title: $localize`Confirm Street Merge`,
          message: $localize`A street with the name "${street.StrNameCore}" already exists in the selected municipality. Do you want to merge the streets? This action will:\n\t- Move all entrances associated with this street to the existing street.\n\t- Delete the current street entry.\n\nThis action cannot be undone.`,
          confirmButtonText: $localize`Merge Streets`,
          cancelButtonText: $localize`Cancel`,
        },
        disableClose: true,
      })
      .afterClosed()
      .subscribe((confirm: boolean | undefined) => {
        if (confirm) {
          const existingStreetId = street.GlobalID!;
          this.commonEntranceService.mergeEntrances(
            existingStreetId,
            foundStreetIds,
            (success: boolean) => {
              if (success) {
                this.deleteStreet(existingStreetId);
              } else {
                this.snackBar.open(
                  $localize`Could not merge streets. Please try again.`,
                  $localize`Ok`,
                  { duration: 5000 }
                );
              }
            }
          );
        } else {
          this.snackBar.open(
            $localize`Street merge cancelled.`,
            $localize`Ok`,
            { duration: 3000 }
          );
        }
      });
  }

  private deleteStreet(streetId: string) {
    const features = [{ attributes: { GlobalID: streetId } }];
    this.commonStreetService
      .deleteFeature(features)
      .pipe(catchError(() => of(null)))
      .subscribe(data => {
        if (!data) {
          this.snackBar.open(
            $localize`Could not delete duplicate street. Please try again.`,
            $localize`Ok`,
            { duration: 5000 }
          );
          this.isSaving.next(false);
          return;
        }
        this.snackBar.open(
          $localize`Streets merged successfully.`,
          $localize`Ok`,
          { duration: 5000 }
        );
        this.isSaving.next(false);
      });
  }

  private createFeatures(street: Street) {
    this.isSaving.next(true);
    const cleanedAttributes = {} as Partial<Dwelling>;
    Object.entries(street).forEach(([key, value]) => {
      (cleanedAttributes as any)[key] = value ? value : null;
    });
    return [{ attributes: cleanedAttributes }];
  }
}
