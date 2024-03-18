import {Injectable} from '@angular/core';
import {CommonBuildingService} from '../service/common-building.service';
import {BehaviorSubject} from 'rxjs';
import {BuildingPoly, DEFAULR_SPARTIAL_REF, MapFormData, Ring} from '../model/map-data';
import {Building} from '../model/building';
import {EntityManageResponse} from '../model/entity-req-res';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from "@angular/router";

@Injectable()
export class BuildingManagementService {
  private isSaving = new BehaviorSubject(false);
  get isSavingObservable() {
    return this.isSaving.asObservable();
  }

  private responseHandler = () => ({
    next: (response: EntityManageResponse) => {
      const responseData = response['addResults']?.[0] ?? response['updateResults']?.[0];
      if (responseData?.success) {
        this.isSaving.next(false);
        this.router.navigateByUrl('/dashboard/register/details/BUILDING/' + responseData.globalId);
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

  constructor(private buildingService: CommonBuildingService,
              private snackBar: MatSnackBar,
              private router: Router
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
    const features = this.createFeatures(buildingDetails, mapFormData);
    this.buildingService.createFeature(features).subscribe(this.responseHandler());
  }

  private updateBuilding(mapFormData: BuildingPoly, buildingDetails: Building) {
    const features = this.createFeatures(buildingDetails, mapFormData);
    this.buildingService.updateFeature(features).subscribe(this.responseHandler());
  }

  private createFeatures(buildingDetails: Building, mapFormData: BuildingPoly) {
    this.isSaving.next(true);
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
