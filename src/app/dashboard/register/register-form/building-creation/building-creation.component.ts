import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import MapView from '@arcgis/core/views/MapView';
import { RegisterFilterService } from '../../register-table-view/register-filter.service';
import { EntityCreationMapService } from '../entity-creation-map.service';
import { FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'asrdb-building-creation',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule
  ],
  providers: [EntityCreationMapService],
  templateUrl: './building-creation.component.html',
  styleUrls: ['./building-creation.component.css']
})
export class BuildingCreationComponent implements OnInit, OnDestroy {
  @Input() formGroup!: FormGroup;
  @ViewChild('mapViewNode', { static: true }) private mapViewEl!: ElementRef;
  public view!: MapView;

  constructor(private mapService: EntityCreationMapService, private registerFilterService: RegisterFilterService) { }

  ngOnInit(): void {
    // Initialize MapView and return an instance of MapView
    this.initializeMap().then(() => {
      console.log('The map is ready.');
    });

    this.mapService.valueChanged.subscribe((value) => {
      if (value.rings) {
        this.formGroup.patchValue({
          buildingPolly: value.rings
        });
      } else if (value.x && value.y) {
        const currentMapPoint = this.formGroup.value.mapPoint.filter((mp: {x: number, y: number}) => mp.x !== value.x && mp.y !== value.y);
        currentMapPoint.push({
          x: value.x,
          y: value.y
        });
        this.formGroup.patchValue({
          mapPoint: currentMapPoint
        });
      }
      console.log(this.formGroup.value);
    });

    this.mapService.valueDeleted.subscribe((value) => {
      if (value.rings) {
        this.formGroup.patchValue({
          buildingPolly: null
        });
      } else if (value.x && value.y) {
        const currentMapPoint = this.formGroup.value.mapPoint.filter((mp: {x: number, y: number}) => mp.x !== value.x && mp.y !== value.y);
        this.formGroup.patchValue({
          mapPoint: currentMapPoint
        });
      }
      console.log(this.formGroup.value);
    });
  }

  ngOnDestroy(): void {
    if (this.view) {
      // destroy the map view
      this.view.destroy();
    }
  }

  async initializeMap(): Promise<any> {
    this.view = await this.mapService.initBuildingCreationmap(this.mapViewEl);
  }
}
