import {Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild,} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RegisterMapService} from './register-map.service';
import {RegisterFilterService} from '../../../register/register-table-view/register-filter.service';
import {BaseMapChangeService} from './custom-map-logic/basemap-change';
import {FeatureSelectionService} from './custom-map-logic/feature-selection';

@Component({
  selector: 'asrdb-register-map',
  standalone: true,
  imports: [CommonModule],
  providers: [
    RegisterMapService,
    BaseMapChangeService,
    FeatureSelectionService,
  ],
  templateUrl: './register-map.component.html',
  styleUrls: ['./register-map.component.css'],
})
export class RegisterMapComponent implements OnInit, OnDestroy, OnChanges {
  @Input() enableFilter = true;
  @Input() enableSelection = true;
  @Input() enableLegend = false;
  @Input() buildingGlobalId?: string;
  @Input() entranceGlobalId?: string;
  @Input() skipOtherFiltersApartFromGlobalId = false;
  @Input() small = false;
  @Input() showBuildingLayer = true;
  @Input() showEntranceLayer = true;
  @ViewChild('mapViewNode', { static: true }) private mapViewEl!: ElementRef;

  constructor(
    private registerMapService: RegisterMapService,
    private registerFilterService: RegisterFilterService
  ) {}

  ngOnInit(): void {
    this.registerFilterService.skipOtherFiltersApartFromGlobalId =
      this.skipOtherFiltersApartFromGlobalId;
    this.registerFilterService.setBuildingGlobalIdFilter(this.buildingGlobalId);
    this.registerFilterService.updateGlobalIds(
      this.buildingGlobalId ? [this.buildingGlobalId] : undefined
    );
    // Initialize MapView and return an instance of MapView
    this.initializeMap().then(() => {
      console.log('The map is ready.');
    });

    if (this.small) {
      this.registerMapService.isOnlyOneBuilding = true;
    }

    this.registerFilterService.filterObservable.subscribe(async () => {
      await this.registerMapService.filterBuildingData(
        this.registerFilterService.prepareWhereCase()
      );
    });

    this.registerFilterService.globalIdsObservable.subscribe(async () => {
      await this.registerMapService.filterEntranceData(
        this.registerFilterService.prepareWhereCaseForEntrance(this.entranceGlobalId)
      );
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['entranceGlobalId'] && changes['entranceGlobalId'].currentValue) {
      void this.registerMapService.filterEntranceData(
        this.registerFilterService.prepareWhereCaseForEntrance(this.entranceGlobalId)
      );
    }
  }

  ngOnDestroy(): void {
    this.registerMapService.cleanup();
  }

  async initializeMap(): Promise<any> {
    await this.registerMapService.init(this.mapViewEl, {
      enableFilter: this.enableFilter,
      enableSelection: this.enableSelection,
      enableLegend: this.enableLegend,
      showBuildingLayer: this.showBuildingLayer,
      showEntranceLayer: this.showEntranceLayer,
      bldWhereCase: this.registerFilterService.prepareWhereCase(),
      entWhereCase: this.registerFilterService.prepareWhereCaseForEntrance(
        this.entranceGlobalId
      ),
    });
  }
}
