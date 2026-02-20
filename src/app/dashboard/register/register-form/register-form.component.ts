import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { BuildingCreationComponent } from './building-creation/building-creation.component';
import { BuildingDetailsFormComponent } from './building-details-form/building-details-form.component';
import { EntranceDetailsFormComponent } from './entrance-details-form/entrance-details-form.component';
import { CommonBuildingService } from '../../common/service/common-building.service';
import { CommonEntranceService } from '../../common/service/common-entrance.service';
import { catchError, combineLatest, map, Subject, takeUntil, zip } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BuildingManagementService } from './building-creation.service';
import { Centroid, Point } from '../model/map-data';
import { Building } from '../model/building';
import { Entrance } from '../model/entrance';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { EntranceManagementService } from './entrance-creation.service';
import { EntityType } from '../../quality-management/quality-management-config';
import { RegisterLogService } from '../register-log-view/register-log-table/register-log.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  EditableGeometry,
  EntityCreationMapService,
} from './entity-management-map.service';
import { BaseMapChangeService } from '../../common/components/register-map/custom-map-logic/basemap-change';
import {
  BUILDING_ENTITY,
  ENTRANCE_ENTITY,
} from '../../../common/constants/common-constants';
import {
  CommonEntityStructureService,
  EntityAttribute,
} from '../../common/service/common-entity-structure.service';

@Component({
  selector: 'asrdb-register-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    BuildingCreationComponent,
    BuildingDetailsFormComponent,
    EntranceDetailsFormComponent,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  providers: [
    BuildingManagementService,
    EntranceManagementService,
    RegisterLogService,
    EntityCreationMapService,
    BaseMapChangeService,
  ],
  templateUrl: './register-form.component.html',
  styleUrls: ['./register-form.component.css'],
})
export class RegisterFormComponent implements OnInit, OnDestroy {
  @ViewChild('cancelConfirmDialog') cancelConfirmDialog?: TemplateRef<any>;

  private isSavingBuilding = this.buildingManagementService.isSavingObservable;
  private isSavingEntrance = this.entranceManagementService.isSavingObservable;

  isSaving = combineLatest([this.isSavingBuilding, this.isSavingEntrance]).pipe(
    map(
      ([isSavingBuilding, isSavingEntrance]) =>
        isSavingBuilding || isSavingEntrance
    )
  );

  isLoadingData = true;

  buildingId?: string;
  entityType?: EntityType;
  existingBuildingDetails?: Building;
  existingBuildingGeometry?: EditableGeometry;
  existingEntrancesDetails?: Entrance[];
  existingEntrancesGeometry?: EditableGeometry[];
  structure: EntityAttribute[] = [];

  mapDetails = new FormGroup({});
  buildingDetails = new FormGroup({});
  entranceDetails = new FormGroup({});

  private subscriber = new Subject<void>();
  private entranceCentroids: Centroid[] = [];
  readonly entranceId: string | null;

  get isBuilding() {
    return this.entityType === BUILDING_ENTITY;
  }

  get isEntrance() {
    return this.entityType === ENTRANCE_ENTITY;
  }

  constructor(
    private buildingManagementService: BuildingManagementService,
    private entranceManagementService: EntranceManagementService,
    private buildingService: CommonBuildingService,
    private entranceService: CommonEntranceService,
    private registerLogService: RegisterLogService,
    private commonEntityStructureService: CommonEntityStructureService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar
  ) {
    this.entranceId =
      this.activatedRoute.snapshot.queryParamMap.get('entranceId') ?? '';
  }

  ngOnInit(): void {
    this.entityType =
      (this.activatedRoute.snapshot.paramMap.get('entity') as EntityType) ??
      undefined;
    if (!this.entityType) {
      this.router.navigateByUrl('dashboard/register');
      this.matSnackBar.open(
        $localize`No entity type provided`,
        $localize`Ok`,
        { duration: 3000 }
      );
      return;
    }

    this.buildingId =
      this.activatedRoute.snapshot.paramMap.get('id') ?? undefined;

    if (this.entityType === ENTRANCE_ENTITY && !this.buildingId) {
      this.matSnackBar.open(
        $localize`Creating an entrance before a building is not permitted`,
        $localize`Ok`,
        { duration: 3000 }
      );
      void this.router.navigateByUrl('dashboard/register');
      return;
    }

    if (this.buildingId) {
      this.registerLogService.loadLogs(this.buildingId);
      this.commonEntityStructureService.getEntityStructure(this.entityType);

      const getBuildingRequest = this.buildingService
        .getBuildingData({
          returnGeometry: true,
          where: `globalID='${this.buildingId}' AND BldQuality <> 0`,
        })
        .pipe(takeUntil(this.subscriber));
      const getEntranceRequest = this.entranceService
        .getEntranceData({
          returnGeometry: true,
          where: `EntBldGlobalID='${this.buildingId}' AND EntQuality <> 0`,
          num: 9999,
        })
        .pipe(takeUntil(this.subscriber));

      this.commonEntityStructureService.structureLoaded
        .pipe(takeUntil(this.subscriber))
        .subscribe(response => {
          if (!response.loading && response.structure) {
            this.structure = response.structure;
          }
        });

      zip([getBuildingRequest, getEntranceRequest])
        .pipe(
          catchError(error => {
            this.matSnackBar.open(
              $localize`Error loading data: ${error.message}`,
              $localize`Ok`,
              { duration: 5000 }
            );
            this.isLoadingData = false;
            return [];
          })
        )
        .subscribe(([building, entrances]) => {
          this.existingBuildingDetails = building?.data.features[0].attributes;
          this.existingBuildingGeometry = {
            ...building?.data.features[0].geometry,
            type: 'polygon',
            id: this.buildingId,
          };

          this.existingEntrancesDetails = entrances?.data.features.map(
            (feature: any) => feature.attributes
          );
          this.existingEntrancesGeometry = entrances?.data.features.map(
            (feature: any) => ({
              ...feature.geometry,
              type: 'point',
              id: feature.attributes.GlobalID,
            })
          );
          this.isLoadingData = false;
        });
    } else {
      this.isLoadingData = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriber.next();
    this.subscriber.complete();
  }

  updateCentroid(centroid: Centroid) {
    if (this.buildingId === centroid.id || !centroid.id) {
      this.buildingDetails.patchValue({
        BldLatitude: centroid.latitude,
        BldLongitude: centroid.longitude,
      });
    } else if (centroid.id) {
      this.entranceCentroids.push(centroid);
    }
  }

  cancel() {
    if (!this.cancelConfirmDialog) {
      return this.closeDialog();
    }
    this.matDialog
      .open(this.cancelConfirmDialog)
      .afterClosed()
      .pipe(takeUntil(this.subscriber))
      .subscribe(confirm => {
        if (confirm) {
          this.closeDialog();
        }
      });
  }

  save() {
    if (
      this.mapDetails.invalid ||
      this.buildingDetails.invalid ||
      this.entranceDetails.invalid
    ) {
      this.showErrorMessage();
      return;
    }

    const buildingDetails = this.prepareBuildingDetails();
    const entranceDetails = this.prepareEntranceDetails();

    if (this.isBuilding) {
      const buildingPoly = (this.mapDetails.value as any)['buildingPoly'];
      this.buildingManagementService.saveBuilding(
        buildingPoly,
        buildingDetails
      );
    } else if (this.isEntrance && this.buildingId) {
      const entranceToSave = this.getEntrancePointToSave();
      if (!entranceToSave) {
        this.showErrorMessage();
        return;
      }
      this.entranceManagementService.saveEntranceEntity(
        entranceToSave as Point,
        entranceDetails,
        this.buildingId
      );
    }
  }

  private showErrorMessage() {
    this.matSnackBar.open(
      $localize`Data cannot be saved. Please check the form for invalid data.`,
      $localize`Ok`,
      { duration: 3000 }
    );
    this.mapDetails.markAllAsTouched();
    this.buildingDetails.markAllAsTouched();
    this.entranceDetails.markAllAsTouched();
  }

  private closeDialog() {
    this.matSnackBar.open(
      $localize`All changes were discarded`,
      $localize`Ok`,
      { duration: 3000 }
    );
    if (this.buildingId) {
      this.router.navigateByUrl(
        'dashboard/register/details/BUILDING/' + this.buildingId
      );
    } else {
      this.router.navigateByUrl('dashboard/register');
    }
    return;
  }

  private getEntrancePointToSave() {
    const mapDetails = this.mapDetails.value;
    const entrancePoints = (mapDetails as any)['entrancePoints'];
    return entrancePoints.find((entrancePoint: any) => {
      if (this.entranceId) {
        return entrancePoint.id === this.entranceId;
      }
      return !entrancePoint.id.toString().startsWith('{');
    });
  }

  private prepareEntranceDetails() {
    const entrancesDetails = this.entranceDetails.value;
    const entrance = {} as any;
    const centroid = this.entranceCentroids.find(centroid => {
      if (!centroid.id) {
        throw new Error(
          $localize`Centroid must have an id for the entrance`
        );
      }
      if (this.entranceId) {
        return centroid.id === this.entranceId;
      }
      return !centroid.id.toString().startsWith('{');
    });

    Object.entries(entrancesDetails).forEach(([key, value]: [string, any]) => {
      if (key.includes(this.entranceId + '_')) {
        const entranceKey = key.replace(this.entranceId + '_', '');
        entrance[entranceKey] = value;
      }
    });
    entrance['GlobalID'] = this.entranceId ?? undefined;
    if (this.entranceId) {
      entrance['OBJECTID'] =
        this.existingEntrancesDetails?.find(
          ent => ent.GlobalID === (this.entranceId as string)
        )?.OBJECTID ?? '';
    }
    entrance['EntLatitude'] = centroid?.latitude;
    entrance['EntLongitude'] = centroid?.longitude;
    return entrance;
  }

  private prepareBuildingDetails() {
    const buildingDetails = this.buildingDetails.value as Building;
    if (this.buildingId) {
      buildingDetails['GlobalID'] = this.buildingId;
      buildingDetails['OBJECTID'] = this.existingBuildingDetails!.OBJECTID;
    }
    return buildingDetails;
  }
}
