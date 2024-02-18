import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import MapView from '@arcgis/core/views/MapView';
import { RegisterFilterService } from '../../register-table-view/register-filter.service';
import { EntityCreationMapService } from '../entity-management-map.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Point } from '../../model/map-data';
import Geometry from '@arcgis/core/geometry/Geometry';

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

  @ViewChild('mapViewNode', { static: true }) private mapViewEl!: ElementRef;
  public view!: MapView;

  constructor(private mapService: EntityCreationMapService, private registerFilterService: RegisterFilterService) { }

  ngOnInit(): void {
    if (!this.formGroup) {
      this.formGroup = new FormGroup({});
    }
    this.formGroup.addControl(
      'buildingPoly', new FormControl(this.existingBuildingGeometry ? this.existingBuildingGeometry.rings : null, [Validators.required])
    );
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

    // Initialize MapView and return an instance of MapView
    this.initializeMap().then(() => {
      console.log('The map is ready.');
    });

    this.mapService.valueChanged.subscribe((value) => {
      if (value.rings) {
        this.formGroup.patchValue({
          buildingPoly: value.rings
        });
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
    this.view = await this.mapService.initBuildingCreationmap(this.mapViewEl, editingGeometry);
  }
}
