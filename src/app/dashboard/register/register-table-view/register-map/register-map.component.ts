import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import MapView from '@arcgis/core/views/MapView';
import { RegisterMapService } from './register-map.service';
import { RegisterFilterService } from '../register-filter.service';

@Component({
  selector: 'asrdb-register-map',
  standalone: true,
  imports: [CommonModule],
  providers: [RegisterMapService],
  templateUrl: './register-map.component.html',
  styleUrls: ['./register-map.component.css']
})
export class RegisterMapComponent implements OnInit, OnDestroy {
  @Input() enableEdditing = false;
  @ViewChild('mapViewNode', { static: true }) private mapViewEl!: ElementRef;
  public view!: MapView;

  constructor(private registerMapService: RegisterMapService, private registerFilterService: RegisterFilterService) { }

  ngOnInit(): void {
    // Initialize MapView and return an instance of MapView
    this.initializeMap().then(() => {
      console.log('The map is ready.');
    });

    this.registerFilterService.filterObservable.subscribe(() => {
      this.registerMapService.filterBuildingData(this.view, this.registerFilterService.prepareWhereCase());
    });

    this.registerFilterService.globalIdsObservable.subscribe(() => {
      this.registerMapService.filterEntranceData(this.view, this.registerFilterService.prepareWhereCaseForEntrance());
    });
  }

  ngOnDestroy(): void {
    if (this.view) {
      // destroy the map view
      this.view.destroy();
    }
  }

  async initializeMap(): Promise<any> {
    this.view = await this.registerMapService.init(this.mapViewEl, this.enableEdditing);
  }
}
