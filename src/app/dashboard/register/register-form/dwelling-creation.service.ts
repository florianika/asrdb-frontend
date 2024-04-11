import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {EntityManageResponse} from '../model/entity-req-res';
import {MatSnackBar} from '@angular/material/snack-bar';
import {CommonDwellingService} from '../service/common-dwellings.service';
import {Dwelling} from '../model/dwelling';
import {AuthStateService} from "../../../common/services/auth-state.service";

@Injectable()
export class DwellingManagementService {
  private isSaving = new BehaviorSubject(false);
  get isSavingObservable() {
    return this.isSaving.asObservable();
  }

  private responseHandler = () => ({
    next: (response: EntityManageResponse) => {
      if (!response['addResults']?.[0]?.success && !response['updateResults']?.[0]?.success) {
        this.snackBar.open('Could not save dwelling data', 'Ok', {
          duration: 3000
        });
      }
      this.isSaving.next(false);
    },
    error: () => {
      this.isSaving.next(false);
      this.snackBar.open('There was an error when trying to save dwelling data', 'Ok', {
        duration: 3000
      });
    }
  });

  constructor(
    private dwellingService: CommonDwellingService,
    private snackBar: MatSnackBar,
    private authState: AuthStateService) {
  }

  public saveDwelling(dwellingDetails: Dwelling) {
    if (dwellingDetails.GlobalID) {
      this.updateDwelling(dwellingDetails);
    } else {
      this.createDwelling(dwellingDetails);
    }
  }

  private createDwelling(dwelling: Dwelling) {
    dwelling.external_creator = `{${this.authState.getNameId()}}` ?? '';
    dwelling.external_creator_date = String(Date.now());
    const features = this.createFeatures(dwelling);
    this.dwellingService.createFeature(features).subscribe(this.responseHandler());
  }

  private updateDwelling(dwelling: Dwelling) {
    dwelling.external_editor = `{${this.authState.getNameId()}}` ?? '';
    dwelling.external_editor_date = String(Date.now());
    const features = this.createFeatures(dwelling);
    this.dwellingService.updateFeature(features).subscribe(this.responseHandler());
  }

  private createFeatures(dwelling: Dwelling) {
    this.isSaving.next(true);
    const cleanedAttributes = {} as Partial<Dwelling>;
    Object.entries(dwelling).forEach(([key, value]) => {
      if (value) {
        (cleanedAttributes as any)[key] = value;
      }
    });
    dwelling.DwlQuality = 9;
    return [
      {
        'attributes': cleanedAttributes
      },
    ];
  }
}
