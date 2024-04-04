import { Injectable } from '@angular/core';
import { CommonEntranceService } from '../service/common-entrance.service';
import { BehaviorSubject } from 'rxjs';
import { DEFAULR_SPARTIAL_REF, Point } from '../model/map-data';
import { Entrance } from '../model/entrance';
import { EntityManageResponse } from '../model/entity-req-res';
import { MatSnackBar } from '@angular/material/snack-bar';
import {Router} from "@angular/router";
import {AuthStateService} from "../../../common/services/auth-state.service";

@Injectable()
export class EntranceManagementService {
  private isSaving = new BehaviorSubject(false);
  get isSavingObservable() {
    return this.isSaving.asObservable();
  }
  private buildingId: string = '';

  private responseHandler = () => ({
    next: (response: EntityManageResponse) => {
      if (!response['addResults']?.[0]?.success && !response['updateResults']?.[0]?.success) {
        this.snackBar.open('Could not save entrance data', 'Ok', {
          duration: 3000
        });
      }
      this.isSaving.next(false);
      this.router.navigateByUrl('/dashboard/register/details/BUILDING/' + this.buildingId);
    },
    error: () => {
      this.isSaving.next(false);
      this.snackBar.open('There was an error when trying to save entrance data', 'Ok', {
        duration: 3000
      });
    }
  });

  constructor(
    private entranceService: CommonEntranceService,
    private snackBar: MatSnackBar,
    private authState: AuthStateService,
    private router: Router) {
  }

  public saveEntranceEntity(geometry: Point, entrance: Entrance, buildingGlobalId: string) {
    this.buildingId = buildingGlobalId;
    const attributes = this.cleanAttributes(entrance, geometry, buildingGlobalId);
    attributes.EntQuality = 9;

    if (attributes?.GlobalID) {
      attributes.external_updater = `{${this.authState.getNameId()}}` ?? '';
      attributes.external_updated_date = String(Date.now());
      this.updateEntrance([{
        'geometry': {
          'x': geometry.x,
          'y': geometry.y,
          spatialReference: geometry.spatialReference ?? DEFAULR_SPARTIAL_REF
        },
        'attributes': attributes
      }]);
    } else {
      attributes.external_creator = `{${this.authState.getNameId()}}` ?? '';
      attributes.external_creation_date = String(Date.now());
      this.createEntrance([{
        'geometry': {
          'x': geometry.x,
          'y': geometry.y,
          spatialReference: geometry.spatialReference ?? DEFAULR_SPARTIAL_REF
        },
        'attributes': attributes
      }]);
    }
  }

  private createEntrance(features: {geometry: any, attributes: Entrance}[]) {
    this.entranceService.createFeature(features).subscribe(this.responseHandler());
  }

  private updateEntrance(features: {geometry: any, attributes: Entrance}[]) {
    this.entranceService.updateFeature(features).subscribe(this.responseHandler());
  }

  private cleanAttributes(entrance: Entrance, point: Point, buildingGlobalId: string) {
    entrance.fk_buildings = buildingGlobalId;
    if (!point.id.toString().startsWith('{')) {
      entrance.GlobalID = ''; // clean the temp globalID of new items
    }
    const cleanedObject = {} as any;
    Object.entries(entrance as any).forEach(([key, value]) => {
      if (value && key !== 'Point') {
        cleanedObject[key] = value;
      }
    });
    return cleanedObject as Entrance;
  }
}
