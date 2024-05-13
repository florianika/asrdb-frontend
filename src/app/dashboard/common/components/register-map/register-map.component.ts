import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import MapView from '@arcgis/core/views/MapView';
import { RegisterMapService } from './register-map.service';
import { RegisterFilterService } from '../../../register/register-table-view/register-filter.service';
import {BaseMapChangeService} from "./custom-map-logic/basemap-change";
import {FeatureSelectionService} from "./custom-map-logic/feature-selection";

@Component({
  selector: 'asrdb-register-map',
  standalone: true,
  imports: [CommonModule],
  providers: [RegisterMapService, BaseMapChangeService, FeatureSelectionService],
  templateUrl: './register-map.component.html',
  styleUrls: ['./register-map.component.css']
})
export class RegisterMapComponent implements OnInit, OnDestroy {
  @Input() enableFilter = true;
  @Input() enableSelection = true;
  @Input() enableLegend = false;
  @Input() buildingGlobalId?: string;
  @Input() skipOtherFiltersApartFromGlobalId = false;
  @ViewChild('mapViewNode', { static: true }) private mapViewEl!: ElementRef;
  public view!: MapView;

  constructor(private registerMapService: RegisterMapService, private registerFilterService: RegisterFilterService) { }

  ngOnInit(): void {
    this.registerFilterService.skipOtherFiltersApartFromGlobalId = this.skipOtherFiltersApartFromGlobalId;
    this.registerFilterService.setBuildingGlobalIdFilter(this.buildingGlobalId);
    this.registerFilterService.updateGlobalIds(this.buildingGlobalId ? [this.buildingGlobalId] : undefined);
    // Initialize MapView and return an instance of MapView
    this.initializeMap().then(() => {
      console.log('The map is ready.');
    });

    this.registerFilterService.filterObservable.subscribe(async () => {
      await this.registerMapService.filterBuildingData(this.view, this.registerFilterService.prepareWhereCase());
    });

    this.registerFilterService.globalIdsObservable.subscribe(async () => {
      await this.registerMapService.filterEntranceData(this.view, this.registerFilterService.prepareWhereCaseForEntrance());
    });
  }

  ngOnDestroy(): void {
    if (this.view) {
      // destroy the map view
      this.view.destroy();
    }
    this.registerMapService.cleanup();
  }

  async initializeMap(): Promise<any> {
    this.view = await this.registerMapService.init(this.mapViewEl, {
      enableFilter: this.enableFilter,
      enableSelection: this.enableSelection,
      enableLegend: this.enableLegend,
      bldWhereCase: this.registerFilterService.prepareWhereCase(),
      entWhereCase: this.registerFilterService.prepareWhereCaseForEntrance(),
    });
  }
}
