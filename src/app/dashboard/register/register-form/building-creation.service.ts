import {Injectable} from '@angular/core';
import {CommonBuildingService} from '../../common/service/common-building.service';
import {BehaviorSubject} from 'rxjs';
import {BuildingPoly, DEFAULR_SPARTIAL_REF} from '../model/map-data';
import {Building} from '../model/building';
import {EntityManageResponse} from '../model/entity-req-res';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from "@angular/router";
import {AuthStateService} from "../../../common/services/auth-state.service";

@Injectable()
export class BuildingManagementService {
  private isSaving = new BehaviorSubject(false);
  get isSavingObservable() {
    return this.isSaving.asObservable();
  }

  private responseHandler = () => ({
    next: (response: EntityManageResponse) => {
      const responseData = response['addResults']?.[0] ?? response['updateResults']?.[0];
      const isCreate = !!response['addResults']?.[0] ?? false;
      if (responseData?.success) {
        if (isCreate) {
          this.startAutomaticRuleExecution(response, 'addResults');
        } else {
          this.startAutomaticRuleExecution(response, 'updateResults');
        }
        this.isSaving.next(false);
      } else {
        this.snackBar.open('Could not save building data', 'Ok', {
          duration: 3000
        });
        this.isSaving.next(false);
      }
    },
    error: () => {
      this.isSaving.next(false);
      this.snackBar.open('There was an error when trying to save building data', 'Ok', {
        duration: 3000
      });
    }
  });

  private startAutomaticRuleExecution(response: EntityManageResponse, action: 'addResults' | 'updateResults') {
    const createResponseData = response[action];
    if (createResponseData && createResponseData.length && createResponseData[0]?.['globalId']) {
      const id = createResponseData[0].globalId;
      this.buildingService.executeAutomaticRules(id, () => {
        void this.router.navigateByUrl('/dashboard/register/details/BUILDING/' + id);
      });
    }
  }

  constructor(private buildingService: CommonBuildingService,
              private snackBar: MatSnackBar,
              private router: Router,
              private authState: AuthStateService
              ) {
  }

  public saveBuilding(mapFormData: BuildingPoly, buildingDetails: Building) {
    if (buildingDetails.GlobalID) {
      this.updateBuilding(mapFormData, buildingDetails);
    } else {
      this.createBuilding(mapFormData, buildingDetails);
    }
  }

  private createBuilding(mapFormData: BuildingPoly, buildingDetails: Building) {
    buildingDetails.external_creator = `{${this.authState.getNameId()}}` ?? '';
    buildingDetails.external_creator_date = String(Date.now());
    const features = this.createFeatures(buildingDetails, mapFormData);
    this.buildingService.createFeature(features).subscribe(this.responseHandler());
  }

  private updateBuilding(mapFormData: BuildingPoly, buildingDetails: Building) {
    buildingDetails.external_editor = `{${this.authState.getNameId()}}` ?? '';
    buildingDetails.external_editor_date = String(Date.now());
    const features = this.createFeatures(buildingDetails, mapFormData);
    this.buildingService.updateFeature(features).subscribe(this.responseHandler());
  }

  private createFeatures(buildingDetails: Building, mapFormData: BuildingPoly) {
    this.isSaving.next(true);
    buildingDetails.BldQuality = 9;
    const cleanedAttributes = {} as Partial<Building>;
    Object.entries(buildingDetails).forEach(([key, value]) => {
      if (value) {
        (cleanedAttributes as any)[key] = value;
      }
    });
    return [
      {
        'geometry': {
          rings: mapFormData.rings,
          spatialReference: mapFormData.spatialReference ?? DEFAULR_SPARTIAL_REF
        },
        'attributes': cleanedAttributes
      },
    ];
  }
}
