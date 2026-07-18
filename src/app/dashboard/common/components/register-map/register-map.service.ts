import { ElementRef, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommonBuildingService } from '../../service/common-building.service';
import { CommonEntranceService } from '../../service/common-entrance.service';
import { CommonMunicipalityService } from '../../service/common-municipality.service';
import { CommonEsriAuthService } from '../../service/common-esri-auth.service';
import { RegisterFilterService } from '../../service/register-filter.service';
import { BaseMapChangeService } from './custom-map-logic/basemap-change';
import { FeatureSelectionService } from './custom-map-logic/feature-selection';
import { WmtsCapabilitiesService } from './wmts-capabilities.service';
import { LayerFilterService } from './layer-filter.service';
import { MapInteractionService } from './map-interaction.service';
import {
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
  private totalResults: number | null = null;
  private _goToDebounce: ReturnType<typeof setTimeout> | null = null;
  private maxZoomHide = 15;
  private buildingHighlightHandle?: __esri.Handle;
  private buildingHighlightRequestId = 0;
  private entranceHighlightHandle?: __esri.Handle;
  private entranceHighlightRequestId = 0;

  constructor(
    private buildingService: CommonBuildingService,
    private entranceService: CommonEntranceService,
    private esriAuthService: CommonEsriAuthService,
    private municipalityService: CommonMunicipalityService,
    private registerFilterService: RegisterFilterService,
    private baseMapChangeService: BaseMapChangeService,
    private featureSelectionService: FeatureSelectionService,
    private wmtsCapabilitiesService: WmtsCapabilitiesService
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
    basemap?: BasemapInput
  ) {
    if (containerEl) this.nativeElement = containerEl.nativeElement;
    if (options) this.options = options;
    if (!this.nativeElement || !this.options)
      throw new Error('Map container or options missing');

    this.cleanup();
    this.createLayerInstances();

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

    this.maxZoomHide = await configureWmtsConstraints(
      this.view,
      this.wmtsCapabilitiesService
    );

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
    try {
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
    } catch (error) {
      const handled = await this.handleEsriAuthFailure(error);
      if (!handled) {
        throw error;
      }
    }
  }

  async highlightBuildings(globalIds: string[]) {
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
      if (extent.count === 0) {
        this.entlayer.visible = false;
      } else {
        this.entlayer.visible = true;
      }
    } catch (error) {
      const handled = await this.handleEsriAuthFailure(error);
      if (!handled) {
        throw error;
      }
    }
  }

  /** Clean up map resources */
  cleanup() {
    this.buildingHighlightRequestId++;
    this.entranceHighlightRequestId++;
    this.clearBuildingHighlight();
    this.clearEntranceHighlight();
    if (this._goToDebounce) {
      clearTimeout(this._goToDebounce);
      this._goToDebounce = null;
    }
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

  private reload(basemap?: BasemapInput) {
    this.customZoom = 0;
    void this.init(undefined, undefined, basemap);
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
        this.reload(basemap);
      }
      return true;
    }
    return false;
  }

  private handleGoToDebounced(goTo: GoToTarget) {
    if (this._goToDebounce) {
      clearTimeout(this._goToDebounce);
    }
    this._goToDebounce = setTimeout(() => this.handleGoTo(goTo), 500);
  }

  private getTargetZoom(goTo: GoToTarget): number | undefined {
    if (!goTo || typeof goTo !== 'object' || !('zoom' in goTo)) {
      return undefined;
    }
    const zoomValue = goTo.zoom;
    return typeof zoomValue === 'number' ? zoomValue : undefined;
  }
}
