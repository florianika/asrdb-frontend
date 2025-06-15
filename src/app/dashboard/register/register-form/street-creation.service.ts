import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { EntityManageResponse } from '../model/entity-req-res';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Dwelling } from '../model/dwelling';
import { AuthStateService } from '../../../common/services/auth-state.service';
import { CommonStreetService } from '../../common/service/common-street.service';
import { Street } from '../model/street';

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
        this.snackBar.open('Could not save street data', 'Ok', {
          duration: 3000,
        });
      }
      this.isSaving.next(false);
    },
    error: () => {
      this.isSaving.next(false);
      this.snackBar.open(
        'There was an error when trying to save street data',
        'Ok',
        {
          duration: 3000,
        }
      );
    },
  });

  constructor(
    private commonStreetService: CommonStreetService,
    private snackBar: MatSnackBar,
    private authState: AuthStateService
  ) {}

  public saveStreet(streetDetails: Street) {
    if (streetDetails.GlobalID) {
      this.updateStreet(streetDetails);
    } else {
      this.createStreet(streetDetails);
    }
  }

  private createStreet(street: Street) {
    street.external_creator = `{${this.authState.getNameId()}}` ?? '';
    street.external_creator_date = String(Date.now());
    const features = this.createFeatures(street);
    this.commonStreetService
      .createFeature(features)
      .subscribe(this.responseHandler());
  }

  private updateStreet(street: Street) {
    street.external_editor = `{${this.authState.getNameId()}}` ?? '';
    street.external_editor_date = String(Date.now());
    const features = this.createFeatures(street);
    this.commonStreetService
      .updateFeature(features)
      .subscribe(this.responseHandler());
  }

  private createFeatures(street: Street) {
    this.isSaving.next(true);
    const cleanedAttributes = {} as Partial<Dwelling>;
    Object.entries(street).forEach(([key, value]) => {
      (cleanedAttributes as any)[key] = value ? value : null;
    });
    return [
      {
        attributes: cleanedAttributes,
      },
    ];
  }
}
