import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import MapView from '@arcgis/core/views/MapView';
import { EntityCreationMapService } from '../entity-management-map.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Centroid, Point } from '../../model/map-data';
import {EntityType} from "../../../quality-management/quality-management-config";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'asrdb-building-creation',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatIconModule
  ],
  providers: [EntityCreationMapService],
  templateUrl: './building-creation.component.html',
  styleUrls: ['./building-creation.component.css']
})
export class BuildingCreationComponent implements OnInit, OnDestroy {
  @Input() formGroup!: FormGroup;
  @Input() existingBuildingGeometry?: any;
  @Input() existingEntrancesGeometry?: any[];
  @Input() entityType?: EntityType;
  @Output() centroidUpdated = new EventEmitter<Centroid>();

  @ViewChild('mapViewNode', { static: true }) private mapViewEl!: ElementRef;
  public view!: MapView;

  get isBuilding() {
    return this.entityType === 'BUILDING';
  }

  get isEntrance() {
    return this.entityType === 'ENTRANCE';
  }

  constructor(private mapService: EntityCreationMapService, private matSnackBar: MatSnackBar) { }

  ngOnInit(): void {
    if (!this.formGroup) {
      this.formGroup = new FormGroup({});
    }
    if (this.isBuilding) {
      this.formGroup.addControl(
        'buildingPoly', new FormControl(this.existingBuildingGeometry ? this.existingBuildingGeometry.rings : null, [Validators.required])
      );
    }
    if (this.isEntrance) {
      this.formGroup.addControl(
        'entrancePoints', new FormControl(this.existingEntrancesGeometry
            ? this.existingEntrancesGeometry.map(o => ({
              x: o.x,
              y: o.y,
              id: o.id
            }))
            : [],
          [Validators.required, Validators.minLength(1)])
      );
    }

    // Initialize MapView and return an instance of MapView
    this.initializeMap().then(() => {
      console.log('The map is ready.');
    });

    this.mapService.valueChanged.subscribe((value) => {
      if (value.rings && !this.isBuilding) {
        this.matSnackBar
          .open('You have changed the building polygon while in "Entrance" mode. ' +
            'This operation is not allowed and changes will not be saved. ' +
            'To modify the building polygon, please edit the building.', 'Ok');
        return;
      } else if (value.x && value.y && !this.isEntrance) {
        this.matSnackBar
          .open('You have changed the entrance point while in "Building" mode. ' +
            'This operation is not allowed and changes will not be saved. ' +
            'To modify the entrance point, please edit the entrance.', 'Ok');
        return;
      }
      if (value.rings) {
        this.formGroup.patchValue({
          buildingPoly: value.rings
        });
        this.centroidUpdated.emit({ latitude: value.centroid?.latitude, longitude: value.centroid?.longitude });
      } else if (value.x && value.y) {
        const currentMapPoint = this.formGroup.value.entrancePoints.filter((mp: Point) => mp.id !== value.id);
        currentMapPoint.push({
          x: value.x,
          y: value.y,
          id: value.id
        });
        this.formGroup.patchValue({
          entrancePoints: currentMapPoint
        });

        this.centroidUpdated.emit({ latitude: value.centroid?.latitude, longitude: value.centroid?.longitude, id: value.id });
      }
      if (isDevMode()) {
        console.log(this.formGroup.value);
      }
    });

    this.mapService.valueDeleted.subscribe((value) => {
      if (value.rings) {
        this.formGroup.patchValue({
          buildingPoly: null
        });
      } else if (value.x && value.y) {
        const currentMapPoint = this.formGroup.value.entrancePoints.filter((mp: Point) => mp.id !== value.id);
        this.formGroup.patchValue({
          entrancePoints: currentMapPoint
        });
      }
      if (isDevMode()) {
        console.log(this.formGroup.value);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.view) {
      // destroy the map view
      this.view.destroy();
    }
  }

  async initializeMap(): Promise<any> {
    const editingGeometry = [];
    if (this.existingBuildingGeometry) {
      editingGeometry.push(this.existingBuildingGeometry);
    }
    if (this.existingEntrancesGeometry) {
      this.existingEntrancesGeometry.forEach(el => editingGeometry.push(el));
    }
    this.view = await this.mapService.initBuildingCreationMap(this.mapViewEl, this.entityType, editingGeometry);
  }
}
