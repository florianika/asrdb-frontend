import { Injectable } from '@angular/core';
import { CommonBuildingService } from '../service/common-building.service';
import { BehaviorSubject } from 'rxjs';
import { DEFAULR_SPARTIAL_REF, MapFormData } from '../model/map-data';
import { Building } from '../model/building';
import { Entrance } from '../model/entrance';
import { EntityCreateResponse } from '../model/entity-req-res';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EntranceManagementService } from './entrance-creation.service';

@Injectable()
export class BuildingManagementService {
  private isSaving = new BehaviorSubject(false);
  get isSavingObservable() {
    return this.isSaving.asObservable();
  }

  private responseHandler = (mapFormData: MapFormData, entrancesDetails: Entrance[]) => ({
    next: (response: EntityCreateResponse) => {
      if (response.addResults.success) {
        this.entranceService.saveEntrancesEntity(mapFormData.entrancePoints, entrancesDetails, response.addResults.globalId);
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

  constructor(private buildingService: CommonBuildingService, private entranceService: EntranceManagementService, private snackBar: MatSnackBar) {
  }

  public saveBuilding(mapFormData: MapFormData, buildingDetails: Building, entrancesDetails: Entrance[]) {
    if (buildingDetails.GlobalID) {
      this.updateBuilding(mapFormData, buildingDetails, entrancesDetails);
    } else {
      this.createBuilding(mapFormData, buildingDetails, entrancesDetails);
    }
  }

  private createBuilding(mapFormData: MapFormData, buildingDetails: Building, entrancesDetails: Entrance[]) {
    const features = this.createFeatures(buildingDetails, mapFormData);
    this.buildingService.createFeature(features).subscribe(this.responseHandler(mapFormData, entrancesDetails));
  }

  private updateBuilding(mapFormData: MapFormData, buildingDetails: Building, entrancesDetails: Entrance[]) {
    const features = this.createFeatures(buildingDetails, mapFormData);
    this.buildingService.updateFeature(features).subscribe(this.responseHandler(mapFormData, entrancesDetails));
  }

  private createFeatures(buildingDetails: Building, mapFormData: MapFormData) {
    this.isSaving.next(true);
    const cleanedAttributes = {} as Partial<Building>;
    Object.entries(buildingDetails).forEach(([key, value]) => {
      if (value) {
        (cleanedAttributes as any)[key] = value;
      }
    });
    const features = [
      {
        'geometry': {
          rings: mapFormData.buildingPoly,
          spatialReference: DEFAULR_SPARTIAL_REF
        },
        'attributes': cleanedAttributes
      },
    ];
    return features;
  }
}
