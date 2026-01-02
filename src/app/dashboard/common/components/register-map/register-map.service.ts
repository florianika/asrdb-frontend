import { ElementRef, Injectable } from '@angular/core';
import { CommonBuildingService } from '../../service/common-building.service';
import { CommonEntranceService } from '../../service/common-entrance.service';
import { CommonMunicipalityService } from '../../service/common-municipality.service';
import { RegisterFilterService } from '../../../register/register-table-view/register-filter.service';
import { BaseMapChangeService } from './custom-map-logic/basemap-change';
import { FeatureSelectionService } from './custom-map-logic/feature-selection';
import { WmtsCapabilitiesService } from './wmts-capabilities.service';
import { LayerFilterService } from './layer-filter.service';
import { MapInteractionService } from './map-interaction.service';
import { createMapView, createWebMap } from './map-view-factory';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import WMTSLayer from '@arcgis/core/layers/WMTSLayer';
import MapView from '@arcgis/core/views/MapView';
import LOD from '@arcgis/core/layers/support/LOD';

export type MapInitOptions = {
  enableFilter: boolean;
  enableSelection: boolean;
  bldWhereCase: string;
  entWhereCase: string;
  enableLegend: boolean;
  showBuildingLayer: boolean;
  showEntranceLayer: boolean;
};

@Injectable()
export class RegisterMapService {
  public isOnlyOneBuilding = false;

  private view?: MapView;
  private bldlayer?: FeatureLayer;
  private entlayer?: FeatureLayer;
  private municipalityLayer?: FeatureLayer;
  private graphicsLayer?: GraphicsLayer;
  private options?: MapInitOptions;
  private nativeElement?: string | HTMLDivElement;
  private eventsCleanupCallbacks: (() => void)[] = [];
  private customZoom: number | null = null;
  private alreadyFocused = false;
  private totalResults: number | null = null;
  private _goToDebounce: any;
  private maxZoomHide = 15;

  constructor(
    private buildingService: CommonBuildingService,
    private entranceService: CommonEntranceService,
    private municipalityService: CommonMunicipalityService,
    private registerFilterService: RegisterFilterService,
    private baseMapChangeService: BaseMapChangeService,
    private featureSelectionService: FeatureSelectionService,
    private wmtsCapabilitiesService: WmtsCapabilitiesService
  ) {
    this.bldlayer = this.buildingService.bldLayer.clone();
    this.entlayer = this.entranceService.entLayer.clone();
    this.municipalityLayer = this.municipalityService.municipalityLayer.clone();
  }

  /** Initialize the map */
  async init(
    containerEl?: ElementRef,
    options?: MapInitOptions,
    basemap?: any
  ) {
    if (containerEl) this.nativeElement = containerEl.nativeElement;
    if (options) this.options = options;
    if (!this.nativeElement || !this.options)
      throw new Error('Map container or options missing');

    this.graphicsLayer = new GraphicsLayer();
    const layers = [this.municipalityLayer, this.graphicsLayer];
    if (this.options.showBuildingLayer) layers.push(this.bldlayer);
    if (this.options.showEntranceLayer) layers.push(this.entlayer);

    const webmap = createWebMap(basemap, layers);
    this.view = createMapView(
      this.nativeElement,
      webmap,
      this.options.enableLegend
    );

    // WMTS LODs
    this.maxZoomHide = 15;
    const wmts = this.view.map.basemap.baseLayers.find(
      l => l instanceof WMTSLayer
    ) as WMTSLayer;
    if (wmts) {
      const lods = await this.wmtsCapabilitiesService.getLODs(wmts.url);
      if (lods.length) {
        this.view.constraints = { lods: lods as LOD[] };
        const maxZoom = lods[lods.length - 1].level + 1;
        this.maxZoomHide = Math.floor(maxZoom / 2);
      }
    }

    // Map interactions
    const zoomHandler = MapInteractionService.addZoomWatcher(
      this.view,
      this.bldlayer!,
      this.entlayer!,
      () => this.totalResults,
      zoom => (this.customZoom = zoom),
      this.maxZoomHide
    );

    const popupHandler = MapInteractionService.addPopupHandler(
      this.view,
      this.registerFilterService,
      this.buildingService,
      this.entranceService
    );

    this.eventsCleanupCallbacks.push(
      () => zoomHandler.remove(),
      () => popupHandler.remove()
    );

    // Initial filtering
    await this.filterBuildingData(this.options.bldWhereCase);
    await this.filterEntranceData(this.options.entWhereCase);

    // Feature selection
    if (this.options.enableSelection) {
      this.featureSelectionService.createFeatureSelection(
        this.view,
        webmap,
        this.eventsCleanupCallbacks
      );
    }

    // Basemap change
    await this.baseMapChangeService.createBasemapChangeAction(
      this.view,
      this.reload.bind(this),
      this.eventsCleanupCallbacks
    );

    return this.view;
  }

  /** Filter building layer (server-side) */
  async filterBuildingData(whereCondition: string) {
    if (!this.view || !this.bldlayer) return;

    this.options!.bldWhereCase = whereCondition;
    await LayerFilterService.filterFeatureLayer(
      this.bldlayer,
      this.view,
      whereCondition
    );

    const extent = await LayerFilterService.queryExtent(
      this.bldlayer,
      whereCondition
    );
    this.totalResults = extent.count;

    this.updateLayerVisibility();
    this.handleGoToDebounced(
      extent.extent ?? { center: [19.818, 41.3285], zoom: 18 }
    );
  }

  /** Filter entrance layer (server-side now) */
  async filterEntranceData(whereCondition: string) {
    if (!this.view || !this.entlayer) return;

    this.options!.entWhereCase = whereCondition;

    // Use server-side filtering instead of client-side FeatureFilter
    await LayerFilterService.filterFeatureLayer(
      this.entlayer,
      this.view,
      whereCondition
    );

    // Optionally, update visibility if needed (same logic as buildings)
    try {
      const extent = await LayerFilterService.queryExtent(
        this.entlayer,
        whereCondition
      );
      if (extent.count === 0) {
        this.entlayer.visible = false;
      } else {
        this.entlayer.visible = true;
      }
    } catch (error) {
      console.error(error);
    }
  }

  /** Clean up map resources */
  cleanup() {
    this.eventsCleanupCallbacks.forEach(fn => fn());
    this.eventsCleanupCallbacks = [];
    this.view?.destroy();
    this.view = undefined;
  }

  /** Private helpers */

  private updateLayerVisibility() {
    if (!this.bldlayer || !this.entlayer) return;

    const lessThan10000 = this.totalResults && this.totalResults < 10000;
    if (
      this.customZoom &&
      this.customZoom < this.maxZoomHide &&
      !lessThan10000
    ) {
      this.bldlayer.visible = false;
      this.entlayer.visible = false;
      this.alreadyFocused = false;
    } else {
      this.bldlayer.visible = true;
      this.entlayer.visible = true;
    }
  }

  private handleGoTo(goTo: any) {
    if (!this.view) return;

    if (this.isOnlyOneBuilding) {
      setTimeout(() => void this.view?.goTo(goTo), 500);
      return;
    }

    const size = this.getBuildingIdsSize(this.options?.bldWhereCase || '');
    switch (size) {
      case 1:
        void this.view.goTo(goTo);
        this.alreadyFocused = true;
        break;
      case 0:
        if (!this.alreadyFocused) {
          void this.view.goTo(goTo);
        } else {
          const zoom = this.customZoom ?? goTo.zoom;
          if (zoom) {
            void this.view.goTo({
              ...goTo,
              zoom: this.customZoom ?? goTo.zoom,
            });
          } else {
            void this.view.goTo(goTo);
          }
        }
        break;
      default:
        void this.view.goTo(goTo);
        this.alreadyFocused = true;
        break;
    }
  }

  private getBuildingIdsSize(whereCondition: string): number {
    const split = whereCondition.split(' ');
    const idx = split.indexOf('GlobalID');
    if (idx === -1 || idx + 2 >= split.length) return 0;
    return split[idx + 2].split(',').length;
  }

  private reload(basemap?: any) {
    this.customZoom = 0;
    void this.init(undefined, undefined, basemap);
  }
  private handleGoToDebounced(goTo: any) {
    clearTimeout(this._goToDebounce);
    this._goToDebounce = setTimeout(() => this.handleGoTo(goTo), 500); // 100ms debounce
  }
}
