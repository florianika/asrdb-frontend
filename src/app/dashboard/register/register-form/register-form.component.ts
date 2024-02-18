import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { BuildingCreationComponent } from './building-creation/building-creation.component';
import { BuildingDetailsFormComponent } from './building-details-form/building-details-form.component';
import { EntranceDetailsFormComponent } from './entrance-details-form/entrance-details-form.component';
import { CommonBuildingService } from '../service/common-building.service';
import { CommonEntranceService } from '../service/common-entrance.service';
import { Subject, takeUntil, zip } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EntityManagementService } from './entity-creation.service';
import { DEFAULR_SPARTIAL_REF, MapFormData } from '../model/map-data';
import { Building } from '../model/building';
import { Entrance } from '../model/entrance';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import Geometry from '@arcgis/core/geometry/Geometry';

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
  providers: [EntityManagementService],
  templateUrl: './register-form.component.html',
  styleUrls: ['./register-form.component.css']
})
export class RegisterFormComponent implements OnInit {
  isSaving = this.entityManagementService.isSavingObservable;
  isLoadingData = true;
  buildingId?: string;
  existingBuildingDetails?: Building;
  existingBuildingGeometry?: Geometry;
  existingEntrancesDetails?: Entrance[];
  existingEntrancesGeometry?: Geometry[];

  private subscriber = new Subject();

  constructor(
    private entityManagementService: EntityManagementService,
    private buildingService: CommonBuildingService,
    private entranceService: CommonEntranceService,
    private activatedRoute: ActivatedRoute,
    private matSnackBar: MatSnackBar) {
  }

  ngOnInit(): void {
    this.buildingId = this.activatedRoute.snapshot.paramMap.get('id') ?? undefined;
    if (this.buildingId) {
      const getBuildingRequest = this.buildingService
        .getBuildingData({ returnGeometry: true, where: `globalID='${this.buildingId}'` })
        .pipe(takeUntil(this.subscriber));
      const getEntranceRequest = this.entranceService
        .getEntranceData({ returnGeometry: true, where: `fk_buildings='${this.buildingId}'` })
        .pipe(takeUntil(this.subscriber));

      zip([getBuildingRequest, getEntranceRequest]).subscribe(([building, entrances]) => {
        this.existingBuildingDetails = building.data.features[0].attributes;
        this.existingBuildingGeometry = {...building.data.features[0].geometry, type: 'polygon', id: this.buildingId};

        this.existingEntrancesDetails = entrances.data.features.map((featrue: any) => featrue.attributes);
        this.existingEntrancesGeometry = entrances.data.features.map((featrue: any) => ({...featrue.geometry, type: 'point', id: featrue.attributes.OBJECTID}));
        this.isLoadingData = false;
      });
    } else {
      this.isLoadingData = false;
    }
  }

  mapDetails = new FormGroup({});
  buildingDetails = new FormGroup({});
  entranceDetails = new FormGroup({});

  save() {
    if (this.mapDetails.invalid || this.buildingDetails.invalid || this.entranceDetails.invalid) {
      this.matSnackBar.open('Data cannot be saved. Please check the form for invalid data.', 'Ok', {
        duration: 3000
      });
      this.mapDetails.markAllAsTouched();
      this.buildingDetails.markAllAsTouched();
      this.entranceDetails.markAllAsTouched();
    }
    this.entityManagementService.createBuildingEntity(this.mapDetails.value as MapFormData,
      this.buildingDetails.value as Building,
      this.entranceDetails.value as Entrance);
  }
}
