import { Injectable } from '@angular/core';
import {BehaviorSubject, catchError, of} from 'rxjs';
import { EntityManageResponse } from '../model/entity-req-res';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Dwelling } from '../model/dwelling';
import { AuthStateService } from '../../../common/services/auth-state.service';
import { CommonStreetService } from '../../common/service/common-street.service';
import { Street } from '../model/street';
import {QueryFilter} from "../model/query-filter";

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
      this.validateStreetNameUniqueness(
        streetDetails.StrNameCore,
        streetDetails.StrMunicipality,
        () => this.updateStreet(streetDetails),
        streetDetails.GlobalID
      )
    } else {
      this.validateStreetNameUniqueness(
        streetDetails.StrNameCore,
        streetDetails.StrMunicipality,
        () => this.createStreet(streetDetails)
      )
    }
  }

  private validateStreetNameUniqueness(name: string, municipality: number, callback: () => void, globalId?: string) {
    let whereClause = "StrMunicipality=" + municipality + " AND StrNameCore='" + name + "'";
    if (globalId) {
      whereClause += " AND GlobalID<>'" + globalId + "'";
    }
    const filter = {
      where: whereClause,
      start: 0,
      num: 1,
      outFields: ['GlobalID'],
    } as QueryFilter;
    this.commonStreetService.getStreets(filter)
      .pipe(catchError(() => of(null)))
      .subscribe((data) => {
        if (!data) {
          this.snackBar.open('Could not validate street name uniqueness. Please try again.', 'Ok', {
            duration: 5000,
          });
          return;
        }
        if (data && data.count > 0) {
          this.snackBar.open('A street with this name already exists in the selected municipality.', 'Ok', {
            duration: 5000,
          });
          return;
        }
        callback();
      })
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
