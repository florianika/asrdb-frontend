import { Injectable } from '@angular/core';
import { CommonBuildingService } from '../service/common-building.service';
import { CommonEntranceService } from '../service/common-entrance.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { MapFormData, Point, Ring } from '../model/map-data';
import { Building } from '../model/building';
import { Entrance } from '../model/entrance';
import { EntityCreateResponse } from '../model/entity-req-res';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class EntityManagementService {
  private isSaving = new BehaviorSubject(false);
  get isSavingObservable() {
    return this.isSaving.asObservable();
  }

  constructor(private buildingService: CommonBuildingService, private entranceService: CommonEntranceService, private snackBar: MatSnackBar) {
  }

  public createBuildingEntity(mapFormData: MapFormData, buildingDetails: Building, entranceDetails: Entrance) {
    this.isSaving.next(true);
    this.createBuilding(mapFormData.buildingPoly, buildingDetails).subscribe({
      next: (response: EntityCreateResponse) => {
        if (response.addResults.success) {
          this.createEntrance(mapFormData.entrancePoints, entranceDetails, response.addResults.globalId);
        } else {
          this.snackBar.open('Could not save building data', 'Ok', {
            duration: 3000
          });
        }
        this.isSaving.next(false);
      },
      error: () => {
        this.isSaving.next(false);
        this.snackBar.open('There was an error when trying to save building data', 'Ok', {
          duration: 3000
        });
      }
    });
  }

  private createBuilding(geometry: Ring, attributes: Building): Observable<EntityCreateResponse> {
    const cleanedAttributes = {} as Partial<Building>;
    Object.entries(attributes).forEach(([key, value]) => {
      if (value) {
        (cleanedAttributes as any)[key] = value;
      }
    });
    const features = [ //TODO: Where to put this?
      {
        'geometry': {
          rings: geometry,
          spatialReference: {
            'latestWkid': 3857,
            'wkid': 102100
          }
        },
        'attributes': cleanedAttributes
      },
    ];
    return this.buildingService.createFeature(features);
  }

  private createEntrance(geometry: Point[], attributes: Entrance, buildingGlobalId: string) {
    attributes.fk_buildings = buildingGlobalId;
    const features: any[] = [];
    geometry.forEach(point => {
      features.push({
        'geometry': {
          'x': point.x,
          'y': point.y,
          spatialReference: {
            'latestWkid': 3857,
            'wkid': 102100
          }
        },
        'attributes': attributes
      });
    });

    this.entranceService.createFeature(features).subscribe({
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
  }
}
