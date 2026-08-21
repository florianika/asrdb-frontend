import { ElementRef, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommonBuildingService } from '../../service/common-building.service';
import { CommonEntranceService } from '../../service/common-entrance.service';
import { CommonMunicipalityService } from '../../service/common-municipality.service';
import { CommonEsriAuthService } from '../../service/common-esri-auth.service';
import { RegisterFilterService } from '../../service/register-filter.service';
import { BaseMapChangeService } from './custom-map-logic/basemap-change';
import {
  getBasemapSpatialReferenceWkid,
  WEB_MERCATOR_WKID,
} from './custom-map-logic/BasemapTypes';
import { FeatureSelectionService } from './custom-map-logic/feature-selection';
import { LayerFilterService } from './layer-filter.service';
import { MapInteractionService } from './map-interaction.service';
import {
  DETAIL_LAYER_VISIBILITY_SCALE,
  configureWmtsConstraints,
  createMapSession,
  destroyMapSession,
} from './map-view-factory';
import {
  BasemapInput,
  CleanupCallback,
  GoToTarget,
  MapLayer,
} from './map-types';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import MapView from '@arcgis/core/views/MapView';
import {
  arcGisGlobalIdEquals,
  arcGisGlobalIdIn,
} from '../../helper/arcgis-query';

export type MapInitOptions = {
  enableFilter: boolean;
  enableSelection: boolean;
  bldWhereCase: string;
  entWhereCase: string;
  enableLegend: boolean;
  showBuildingLayer: boolean;
  showEntranceLayer: boolean;
};

type BuildingFilterOptions = {
  navigateToExtent?: boolean;
};

@Injectable()
export class RegisterMapService {
  public isOnlyOneBuilding = false;

  private view?: MapView;
  private bldlayer!: FeatureLayer;
  private entlayer!: FeatureLayer;
  private municipalityLayer!: FeatureLayer;
  private graphicsLayer?: GraphicsLayer;
  private options?: MapInitOptions;
  private nativeElement?: string | HTMLDivElement;
  private eventsCleanupCallbacks: CleanupCallback[] = [];
  private customZoom: number | null = null;
  private alreadyFocused = false;
  private entranceHasResults = false;
  private _goToDebounce: ReturnType<typeof setTimeout> | null = null;
  private buildingHighlightHandle?: __esri.Handle;
  private buildingHighlightRequestId = 0;
  private buildingFilterRequestId = 0;
  private highlightedBuildingGlobalIds: string[] = [];
  private entranceHighlightHandle?: __esri.Handle;
  private entranceHighlightRequestId = 0;
  private highlightedEntranceGlobalId?: string;

  constructor(
    private buildingService: CommonBuildingService,
    private entranceService: CommonEntranceService,
    private esriAuthService: CommonEsriAuthService,
    private municipalityService: CommonMunicipalityService,
    private registerFilterService: RegisterFilterService,
    private baseMapChangeService: BaseMapChangeService,
    private featureSelectionService: FeatureSelectionService
  ) {
    this.createLayerInstances();
  }

  private createLayerInstances() {
    this.bldlayer = this.buildingService.bldLayer.clone();
    this.entlayer = this.entranceService.entLayer.clone();
    this.municipalityLayer = this.municipalityService.municipalityLayer.clone();
  }

  /** Initialize the map */
  async init(
    containerEl?: ElementRef,
    options?: MapInitOptions,
    basemap?: BasemapInput,
    viewpoint?: __esri.Viewpoint
  ) {
    if (containerEl) this.nativeElement = containerEl.nativeElement;
    if (options) this.options = options;
    if (!this.nativeElement || !this.options)
      throw new Error('Map container or options missing');

    this.cleanup();
    this.createLayerInstances();
    this.entranceHasResults = false;

    this.graphicsLayer = new GraphicsLayer();
    const layers: MapLayer[] = [this.municipalityLayer, this.graphicsLayer];
    if (this.options.showBuildingLayer) layers.push(this.bldlayer);
    if (this.options.showEntranceLayer) layers.push(this.entlayer);

    const { webmap, view } = createMapSession(this.nativeElement, layers, {
      basemap,
      enableLegend: this.options.enableLegend,
      initialZoom: 15,
      dockPopup: true,
    });
    this.view = view;

    await configureWmtsConstraints(this.view);

    // Map interactions
    const scaleHandler = MapInteractionService.addScaleWatcher(
      this.view,
      scale => {
        if (this.view!.zoom >= 0) {
          this.customZoom = this.view!.zoom;
        }
        this.updateLayerVisibility(scale);
      }
    );
    if (this.view.zoom >= 0) {
      this.customZoom = this.view.zoom;
    }
    this.updateLayerVisibility();

    const popupHandler = MapInteractionService.addPopupHandler(
      this.view,
      this.registerFilterService,
      this.buildingService,
      this.entranceService
    );

    this.eventsCleanupCallbacks.push(
      () => scaleHandler.remove(),
      () => popupHandler.remove()
    );

    // Initial filtering
    await this.filterBuildingData(this.options.bldWhereCase);
    await this.filterEntranceData(this.options.entWhereCase);

    if (viewpoint) {
      this.cancelPendingGoTo();
      await this.restoreViewpoint(viewpoint);
    }

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
      this.changeBasemap.bind(this),
      this.eventsCleanupCallbacks
    );

    if (viewpoint) {
      await this.highlightBuildings(this.highlightedBuildingGlobalIds);
      await this.highlightEntrance(this.highlightedEntranceGlobalId);
    }

    return this.view;
  }

  /** Filter building layer (server-side) */
  async filterBuildingData(
    whereCondition: string,
    options: BuildingFilterOptions = {}
  ) {
    if (!this.view || !this.bldlayer) return;
    const requestId = ++this.buildingFilterRequestId;
    const navigateToExtent = options.navigateToExtent ?? true;

    if (!navigateToExtent) {
      this.cancelPendingGoTo();
    }

    try {
      this.options!.bldWhereCase = whereCondition;
      await LayerFilterService.filterFeatureLayer(
        this.bldlayer,
        this.view,
        whereCondition
      );

      if (requestId !== this.buildingFilterRequestId) {
        return;
      }

      this.updateLayerVisibility();
      if (!navigateToExtent) {
        return;
      }

      const extent = await LayerFilterService.queryExtent(
        this.bldlayer,
        whereCondition
      );

      if (requestId !== this.buildingFilterRequestId) {
        return;
      }

      this.handleGoToDebounced(
        extent.extent ?? { center: [19.818, 41.3285], zoom: 18 }
      );
    } catch (error) {
      if (requestId !== this.buildingFilterRequestId) {
        return;
      }
      const handled = await this.handleEsriAuthFailure(error);
      if (!handled) {
        throw error;
      }
    }
  }

  async highlightBuildings(globalIds: string[]) {
    this.highlightedBuildingGlobalIds = [...globalIds];
    if (!this.view || !this.bldlayer) return;

    const requestId = ++this.buildingHighlightRequestId;
    this.clearBuildingHighlight();

    if (!globalIds.length) {
      return;
    }

    try {
      const objectIds = await this.queryBuildingObjectIds(globalIds);
      if (requestId !== this.buildingHighlightRequestId || !objectIds.length) {
        return;
      }

      const layerView = await this.view.whenLayerView(this.bldlayer);
      if (requestId !== this.buildingHighlightRequestId) {
        return;
      }

      this.buildingHighlightHandle = layerView.highlight(objectIds);
    } catch (error) {
      const handled = await this.handleEsriAuthFailure(error);
      if (!handled) {
        throw error;
      }
    }
  }

  async highlightEntrance(globalId?: string) {
    this.highlightedEntranceGlobalId = globalId;
    if (!this.view || !this.entlayer) return;

    const requestId = ++this.entranceHighlightRequestId;
    this.clearEntranceHighlight();

    if (!globalId) {
      return;
    }

    try {
      const objectIds = await this.queryEntranceObjectIds(globalId);
      if (requestId !== this.entranceHighlightRequestId || !objectIds.length) {
        return;
      }

      const layerView = await this.view.whenLayerView(this.entlayer);
      if (requestId !== this.entranceHighlightRequestId) {
        return;
      }

      this.entranceHighlightHandle = layerView.highlight(objectIds);
    } catch (error) {
      const handled = await this.handleEsriAuthFailure(error);
      if (!handled) {
        throw error;
      }
    }
  }

  /** Filter entrance layer (server-side now) */
  async filterEntranceData(whereCondition: string) {
    if (!this.view || !this.entlayer) return;

    try {
      this.options!.entWhereCase = whereCondition;
      // Use server-side filtering instead of client-side FeatureFilter
      await LayerFilterService.filterFeatureLayer(
        this.entlayer,
        this.view,
        whereCondition
      );

      // Optionally, update visibility if needed (same logic as buildings)
      const extent = await LayerFilterService.queryExtent(
        this.entlayer,
        whereCondition
      );
      this.entranceHasResults = extent.count > 0;
      this.updateLayerVisibility();
    } catch (error) {
      const handled = await this.handleEsriAuthFailure(error);
      if (!handled) {
        throw error;
      }
    }
  }

  /** Clean up map resources */
  cleanup() {
    this.buildingFilterRequestId++;
    this.buildingHighlightRequestId++;
    this.entranceHighlightRequestId++;
    this.clearBuildingHighlight();
    this.clearEntranceHighlight();
    this.cancelPendingGoTo();
    destroyMapSession(this.view, this.eventsCleanupCallbacks);
    this.view = undefined;
  }

  hasActiveView(): boolean {
    return !!this.view;
  }

  /** Private helpers */

  private clearBuildingHighlight() {
    this.buildingHighlightHandle?.remove();
    this.buildingHighlightHandle = undefined;
  }

  private clearEntranceHighlight() {
    this.entranceHighlightHandle?.remove();
    this.entranceHighlightHandle = undefined;
  }

  private async queryBuildingObjectIds(globalIds: string[]) {
    const query = this.bldlayer.createQuery();
    query.where = arcGisGlobalIdIn('GlobalID', globalIds);
    return (await this.bldlayer.queryObjectIds(query)) ?? [];
  }

  private async queryEntranceObjectIds(globalId: string) {
    const query = this.entlayer.createQuery();
    query.where = arcGisGlobalIdEquals('GlobalID', globalId);
    return (await this.entlayer.queryObjectIds(query)) ?? [];
  }

  private updateLayerVisibility(scale = this.view?.scale ?? Infinity) {
    if (!this.bldlayer || !this.entlayer) return;

    const layersVisible = scale > 0 && scale <= DETAIL_LAYER_VISIBILITY_SCALE;
    this.bldlayer.visible = layersVisible;
    this.entlayer.visible = layersVisible && this.entranceHasResults;
    if (!layersVisible) {
      this.alreadyFocused = false;
    }
  }

  private handleGoTo(goTo: GoToTarget) {
    if (!this.view) return;

    if (this.isOnlyOneBuilding) {
      setTimeout(() => void this.view?.goTo(goTo), 500);
      return;
    }

    const size =
      this.registerFilterService.getSelectedBuildingGlobalIds().length;
    switch (size) {
      case 1:
        void this.view.goTo(goTo);
        this.alreadyFocused = true;
        break;
      case 0:
        if (!this.alreadyFocused) {
          void this.view.goTo(goTo);
        } else {
          const zoom = this.customZoom ?? this.getTargetZoom(goTo);
          if (
            zoom !== undefined &&
            goTo &&
            typeof goTo === 'object' &&
            !Array.isArray(goTo)
          ) {
            void this.view.goTo({
              ...goTo,
              zoom,
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

  private changeBasemap(basemap: BasemapInput) {
    if (!this.view?.map) {
      return;
    }

    const targetWkid = getBasemapSpatialReferenceWkid(basemap);
    const sameSpatialReference =
      this.view.spatialReference.wkid === targetWkid ||
      (targetWkid === WEB_MERCATOR_WKID &&
        this.view.spatialReference.isWebMercator);

    if (sameSpatialReference) {
      this.view.map.basemap = basemap;
      void configureWmtsConstraints(this.view)
        .then(() => this.updateLayerVisibility())
        .catch(error => console.error('Failed to change basemap:', error));
      return;
    }

    const viewpoint = this.view.viewpoint.clone();
    void this.init(undefined, undefined, basemap, viewpoint).catch(error =>
      console.error('Failed to change map spatial reference:', error)
    );
  }

  private async handleEsriAuthFailure(error: unknown): Promise<boolean> {
    if (!this.esriAuthService.isEsriAuthError(error)) {
      return false;
    }

    const isReady = await firstValueFrom(
      this.esriAuthService.ensureEsriReady(1, 'esri-auth-retry')
    );

    if (isReady) {
      const basemap = this.view?.map?.basemap;
      if (basemap) {
        this.changeBasemap(basemap);
      }
      return true;
    }
    return false;
  }

  private handleGoToDebounced(goTo: GoToTarget) {
    this.cancelPendingGoTo();
    this._goToDebounce = setTimeout(() => this.handleGoTo(goTo), 500);
  }

  private cancelPendingGoTo() {
    if (!this._goToDebounce) {
      return;
    }
    clearTimeout(this._goToDebounce);
    this._goToDebounce = null;
  }

  private async restoreViewpoint(viewpoint: __esri.Viewpoint) {
    if (!this.view) {
      return;
    }

    await this.view.when();
    try {
      await this.view.goTo(viewpoint, { animate: false });
    } catch (error) {
      if ((error as { name?: string })?.name !== 'AbortError') {
        throw error;
      }
    }
  }

  private getTargetZoom(goTo: GoToTarget): number | undefined {
    if (!goTo || typeof goTo !== 'object' || !('zoom' in goTo)) {
      return undefined;
    }
    const zoomValue = goTo.zoom;
    return typeof zoomValue === 'number' ? zoomValue : undefined;
  }
}
