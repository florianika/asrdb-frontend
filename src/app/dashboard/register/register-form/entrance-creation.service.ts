import { Injectable } from '@angular/core';
import { CommonEntranceService } from '../../common/service/common-entrance.service';
import { BehaviorSubject } from 'rxjs';
import { DEFAULR_SPARTIAL_REF, Point } from '../model/map-data';
import { Entrance } from '../model/entrance';
import { EntityManageResponse } from '../model/entity-req-res';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthStateService } from '../../../common/services/auth-state.service';
import { CommonBuildingService } from '../../common/service/common-building.service';
import { Router } from '@angular/router';

@Injectable()
export class EntranceManagementService {
  private isSaving = new BehaviorSubject(false);
  get isSavingObservable() {
    return this.isSaving.asObservable();
  }

  private responseHandler = (buildingId: string) => ({
    next: (response: EntityManageResponse) => {
      if (
        !response['addResults']?.[0]?.success &&
        !response['updateResults']?.[0]?.success
      ) {
        this.snackBar.open(
          $localize`Could not save entrance data`,
          $localize`Ok`,
          { duration: 3000 }
        );
        this.isSaving.next(false);
        return;
      }
      this.buildingService.resetStatus(buildingId, () => {
        this.isSaving.next(false);
        this.goToDetails(buildingId);
      });
    },
    error: () => {
      this.isSaving.next(false);
      this.snackBar.open(
        $localize`There was an error when trying to save entrance data`,
        $localize`Ok`,
        { duration: 3000 }
      );
    },
  });

  constructor(
    private buildingService: CommonBuildingService,
    private entranceService: CommonEntranceService,
    private snackBar: MatSnackBar,
    private authState: AuthStateService,
    private router: Router
  ) {}

  public saveEntranceEntity(
    geometry: Point,
    entrance: Entrance,
    buildingGlobalId: string
  ) {
    entrance.EntQuality = 9;
    const attributes = this.cleanAttributes(
      entrance,
      geometry,
      buildingGlobalId
    );

    if (attributes?.GlobalID) {
      attributes.external_editor = `{${this.authState.getNameId()}}` ?? '';
      attributes.external_editor_date = String(Date.now());
      if (attributes.EntLatitude === null || attributes.EntLongitude === null) {
        delete attributes.EntLatitude;
        delete attributes.EntLongitude;
      }
      this.isSaving.next(true);
      this.updateEntrance(
        [
          {
            geometry: {
              x: geometry.x,
              y: geometry.y,
              spatialReference:
                geometry.spatialReference ?? DEFAULR_SPARTIAL_REF,
            },
            attributes: attributes,
          },
        ],
        buildingGlobalId
      );
    } else {
      this.isSaving.next(true);
      attributes.external_creator = `{${this.authState.getNameId()}}` ?? '';
      attributes.external_creator_date = String(Date.now());
      this.createEntrance(
        [
          {
            geometry: {
              x: geometry.x,
              y: geometry.y,
              spatialReference:
                geometry.spatialReference ?? DEFAULR_SPARTIAL_REF,
            },
            attributes: attributes,
          },
        ],
        buildingGlobalId
      );
    }
  }

  private createEntrance(
    features: { geometry: any; attributes: Entrance }[],
    buildingId: string
  ) {
    this.entranceService
      .createFeature(features)
      .subscribe(this.responseHandler(buildingId));
  }

  private updateEntrance(
    features: { geometry: any; attributes: Entrance }[],
    buildingId: string
  ) {
    this.entranceService
      .updateFeature(features)
      .subscribe(this.responseHandler(buildingId));
  }

  private cleanAttributes(
    entrance: Entrance,
    point: Point,
    buildingGlobalId: string
  ) {
    entrance.EntBldGlobalID = buildingGlobalId;
    if (!point.id.toString().startsWith('{')) {
      entrance.GlobalID = ''; // clean the temp globalID of new items
    }
    const cleanedObject = {} as any;
    Object.entries(entrance as any).forEach(([key, value]) => {
      if (key !== 'Point') {
        cleanedObject[key] = value || value === 0 ? value : null;
      }
    });
    return cleanedObject as Entrance;
  }

  private goToDetails(buildingId: string) {
    void this.router.navigateByUrl(
      '/dashboard/register/details/BUILDING/' + buildingId
    );
  }
}
