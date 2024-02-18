import { Injectable } from '@angular/core';
import { CommonEntranceService } from '../service/common-entrance.service';
import { BehaviorSubject } from 'rxjs';
import { DEFAULR_SPARTIAL_REF, Point } from '../model/map-data';
import { Entrance } from '../model/entrance';
import { EntityCreateResponse } from '../model/entity-req-res';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class EntranceManagementService {
  private isSaving = new BehaviorSubject(false);
  get isSavingObservable() {
    return this.isSaving.asObservable();
  }

  private responseHandler = () => ({
    next: (response: EntityCreateResponse) => {
      if (!response.addResults.success) {
        this.snackBar.open('Could not save entrance data', 'Ok', {
          duration: 3000
        });
      }
      this.isSaving.next(false);
    },
    error: () => {
      this.isSaving.next(false);
      this.snackBar.open('There was an error when trying to save entrance data', 'Ok', {
        duration: 3000
      });
    }
  });

  constructor(private entranceService: CommonEntranceService, private snackBar: MatSnackBar) {
  }

  public saveEntrancesEntity(geometry: Point[], entrances: Entrance[], buildingGlobalId: string) {
    const createFeatures: any[] = [];
    const updateFeatures: any[] = [];
    geometry.forEach(point => {
      const attributes = this.cleanAttributes(entrances, point, buildingGlobalId);
      const feature = {
        'geometry': {
          'x': point.x,
          'y': point.y,
          spatialReference: DEFAULR_SPARTIAL_REF
        },
        'attributes': attributes
      };
      if (attributes?.GlobalID) {
        updateFeatures.push(feature);
      } else {
        createFeatures.push(feature);
      }
    });

    this.createEntrance(createFeatures);
    this.updateEntrance(updateFeatures);
  }

  private createEntrance(features: {geometry: any, attributes: Entrance}[]) {
    this.entranceService.createFeature(features).subscribe(this.responseHandler());
  }

  private updateEntrance(features: {geometry: any, attributes: Entrance}[]) {
    this.entranceService.updateFeature(features).subscribe(this.responseHandler());
  }

  private cleanAttributes(entrances: Entrance[], point: Point, buildingGlobalId: string) {
    const attributes = entrances.find(entrance => entrance.GlobalID === point.id);
    if (attributes) {
      attributes.fk_buildings = buildingGlobalId;
      if (!point.id.toString().startsWith('{')) {
        attributes.GlobalID = ''; // clean the temp globalID of new items
      }
    }
    return attributes;
  }
}
