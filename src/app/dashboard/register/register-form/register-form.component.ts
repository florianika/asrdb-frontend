import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { BuildingCreationComponent } from './building-creation/building-creation.component';
import { BuildingDetailsFormComponent } from './building-details-form/building-details-form.component';
import { EntranceDetailsFormComponent } from './entrance-details-form/entrance-details-form.component';
import { CommonBuildingService } from '../service/common-building.service';
import { CommonEntranceService } from '../service/common-entrance.service';
import { Subject, map, takeUntil, zip } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BuildingManagementService } from './building-creation.service';
import { Centroid, MapFormData } from '../model/map-data';
import { Building } from '../model/building';
import { Entrance } from '../model/entrance';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {ActivatedRoute, Router} from '@angular/router';
import Geometry from '@arcgis/core/geometry/Geometry';
import { EntranceManagementService } from './entrance-creation.service';
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
  private isSavingBuilding = this.entityManagementService.isSavingObservable;
  private isSavingEntrance = this.entityManagementService.isSavingObservable;

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

  entranceIds: string[] = [];

  private subscriber = new Subject();
  private entranceCentroids: Centroid[] = [];

  get isBuilding() {
    return this.entityType === 'BUILDING';
  }

  get isEntrance() {
    return this.entityType === 'ENTRANCE';
  }

  constructor(
    private entityManagementService: BuildingManagementService,
    private buildingService: CommonBuildingService,
    private entranceService: CommonEntranceService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private matSnackBar: MatSnackBar) {
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

  setEntranceIds() {
    this.entranceIds = (this.mapDetails.value as MapFormData).entrancePoints.map(o => o.id.toString());
  }

  onSelectionChanged(index: number) {
    if (index !== 0) {
      this.setEntranceIds();
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

    const buildingDetails = this.buildingDetails.value as Building;
    const entrancesDetails = this.entranceDetails.value;
    const entrances: Entrance[] = [];

    if (this.buildingId) {
      buildingDetails['GlobalID'] = this.buildingId;
    }

    this.entranceIds.forEach(id => {
      const entrance = {} as any;
      const centroid = this.entranceCentroids.find(centroid => centroid.id === id);
      Object.entries(entrancesDetails).forEach(([key, value]: [string, any]) => {
        if (key.includes(id)) {
          const entranceKey = key.replace(id + '_', '');
          entrance[entranceKey] = value;
        }
      });
      entrance['GlobalId'] = id;
      entrance['EntLatitude'] = centroid?.latitude;
      entrance['EntLongitude'] = centroid?.longitude;
      entrances.push(entrance);
    });

    this.entityManagementService.saveBuilding(
      this.mapDetails.value as MapFormData,
      buildingDetails,
      entrances);
  }
}
