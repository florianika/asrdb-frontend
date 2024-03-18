import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatStepperModule} from '@angular/material/stepper';
import {BuildingCreationComponent} from './building-creation/building-creation.component';
import {BuildingDetailsFormComponent} from './building-details-form/building-details-form.component';
import {EntranceDetailsFormComponent} from './entrance-details-form/entrance-details-form.component';
import {CommonBuildingService} from '../service/common-building.service';
import {CommonEntranceService} from '../service/common-entrance.service';
import {map, Subject, takeUntil, zip} from 'rxjs';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {BuildingManagementService} from './building-creation.service';
import {Centroid, Point} from '../model/map-data';
import {Building} from '../model/building';
import {Entrance} from '../model/entrance';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {ActivatedRoute, Router} from '@angular/router';
import Geometry from '@arcgis/core/geometry/Geometry';
import {EntranceManagementService} from './entrance-creation.service';
import {EntityType} from "../../quality-management/quality-management-config";

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
    MatSnackBarModule
  ],
  providers: [BuildingManagementService, EntranceManagementService],
  templateUrl: './register-form.component.html',
  styleUrls: ['./register-form.component.css']
})
export class RegisterFormComponent implements OnInit {
  private isSavingBuilding = this.buildingManagementService.isSavingObservable;
  private isSavingEntrance = this.entranceManagementService.isSavingObservable;

  isSaving = zip([this.isSavingBuilding, this.isSavingEntrance])
    .pipe(
      map(([isSavingBuilding, isSavingEntrance]) => {
        return isSavingBuilding && isSavingEntrance;
      })
    );

  isLoadingData = true;

  buildingId?: string;
  entityType?: EntityType;
  existingBuildingDetails?: Building;
  existingBuildingGeometry?: Geometry;
  existingEntrancesDetails?: Entrance[];
  existingEntrancesGeometry?: Geometry[];


  mapDetails = new FormGroup({});
  buildingDetails = new FormGroup({});
  entranceDetails = new FormGroup({});

  private subscriber = new Subject();
  private entranceCentroids: Centroid[] = [];
  private readonly entranceId: string | null;

  get isBuilding() {
    return this.entityType === 'BUILDING';
  }

  get isEntrance() {
    return this.entityType === 'ENTRANCE';
  }

  constructor(
    private buildingManagementService: BuildingManagementService,
    private entranceManagementService: EntranceManagementService,
    private buildingService: CommonBuildingService,
    private entranceService: CommonEntranceService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private matSnackBar: MatSnackBar) {
    this.entranceId = this.activatedRoute.snapshot.queryParamMap.get('entranceId') ?? '';
  }

  ngOnInit(): void {
    this.buildingId = this.activatedRoute.snapshot.paramMap.get('id') ?? undefined;
    this.entityType = this.activatedRoute.snapshot.paramMap.get('entity') as EntityType ?? undefined;

    if (this.entityType === 'ENTRANCE' && !this.buildingId) {
      this.matSnackBar.open('Creating an entrance before a building is not permitted', 'Ok', {
        duration: 3000
      });
      void this.router.navigateByUrl('dashboard/register');
      return;
    }

    if (this.buildingId) {
      const getBuildingRequest = this.buildingService
        .getBuildingData({ returnGeometry: true, where: `globalID='${this.buildingId}'` })
        .pipe(takeUntil(this.subscriber));
      const getEntranceRequest = this.entranceService
        .getEntranceData({ returnGeometry: true, where: `fk_buildings='${this.buildingId}'` })
        .pipe(takeUntil(this.subscriber));

      zip([getBuildingRequest, getEntranceRequest]).subscribe(([building, entrances]) => {
        this.existingBuildingDetails = building.data.features[0].attributes;
        this.existingBuildingGeometry = { ...building.data.features[0].geometry, type: 'polygon', id: this.buildingId };

        this.existingEntrancesDetails = entrances.data.features.map((featrue: any) => featrue.attributes);
        this.existingEntrancesGeometry = entrances.data.features.map((featrue: any) => ({ ...featrue.geometry, type: 'point', id: featrue.attributes.GlobalID }));
        this.isLoadingData = false;
      });
    } else {
      this.isLoadingData = false;
    }
  }

  updateCentroid(centroid: Centroid) {
    if (this.buildingId === centroid.id || !centroid.id) {
      this.buildingDetails.patchValue({
        BldLatitude: centroid.latitude,
        BldLongitude: centroid.longitude
      });
    } else if (centroid.id) {
      this.entranceCentroids.push(centroid);
    }
  }

  save() {
    if (this.mapDetails.invalid || this.buildingDetails.invalid || this.entranceDetails.invalid) {
      this.matSnackBar.open('Data cannot be saved. Please check the form for invalid data.', 'Ok', {
        duration: 3000
      });
      this.mapDetails.markAllAsTouched();
      this.buildingDetails.markAllAsTouched();
      this.entranceDetails.markAllAsTouched();
      return;
    }

    const buildingDetails = this.prepareBuildingDetails();
    const entranceDetails = this.prepareEntranceDetails();

    if (this.isBuilding) {
      const buildingPoly = (this.mapDetails.value as any)['buildingPoly'];
      this.buildingManagementService.saveBuilding(buildingPoly, buildingDetails);
    } else if (this.isEntrance && this.buildingId) {
      const entranceToSave = this.getEntrancePointToSave();
      this.entranceManagementService.saveEntranceEntity(entranceToSave as Point, entranceDetails, this.buildingId);
    }
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
        throw new Error("Centroid must have an id for the entrance");
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
