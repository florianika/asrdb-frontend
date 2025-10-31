import { ElementRef, Injectable, isDevMode } from '@angular/core';

import MapView from '@arcgis/core/views/MapView';
import Popup from '@arcgis/core/widgets/Popup';
import FeatureFilter from '@arcgis/core/layers/support/FeatureFilter';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import WebMap from '@arcgis/core/WebMap';
import { CommonBuildingService } from '../../service/common-building.service';
import { CommonEntranceService } from '../../service/common-entrance.service';
import { CommonEsriAuthService } from '../../service/common-esri-auth.service';
import { RegisterFilterService } from '../../../register/register-table-view/register-filter.service';
import { FeatureSelectionService } from './custom-map-logic/feature-selection';
import { BaseMapChangeService } from './custom-map-logic/basemap-change';
import Legend from '@arcgis/core/widgets/Legend';
import { OSM_BASEMAP } from './custom-map-logic/BasemapTypes';
import {CommonMunicipalityService} from "../../service/common-municipality.service";

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
  private bldlayer;
  private entlayer;
  private municipalityLayer;
  private eventsCleanupCallbacks: (() => void)[] = [];
  private nativeElement: string | HTMLDivElement | undefined;
  private options: MapInitOptions | undefined;
  private view: MapView | undefined;
  private graphicsLayer?: GraphicsLayer;
  private customZoom: null | number = null;
  private alreadyFocused = false;
  private totalResults = null;

  public isOnlyOneBuilding = false;

  constructor(
    private buildingService: CommonBuildingService,
    private entranceService: CommonEntranceService,
    private municipalityService: CommonMunicipalityService,
    private registerFilterService: RegisterFilterService,
    private baseMapChangeService: BaseMapChangeService,
    private featureSelectionService: FeatureSelectionService,
    private esriAuthService: CommonEsriAuthService
  ) {
    this.bldlayer = this.buildingService.bldLayer;
    this.entlayer = this.entranceService.entLayer;
    this.municipalityLayer = this.municipalityService.municipalityLayer;
  }

  async init(
    mapViewEl?: ElementRef,
    options?: MapInitOptions,
    basemap?: any
  ): Promise<MapView> {
    if (mapViewEl) {
      this.nativeElement = mapViewEl.nativeElement;
    }
    if (options) {
      this.options = options;
    }
    if (!this.options || !this.nativeElement) {
      throw new Error('Options or nativeElement are not defined');
    }
    this.graphicsLayer = new GraphicsLayer();
    const layers = [this.municipalityLayer, this.graphicsLayer];
    if (this.options.showBuildingLayer) {
      layers.push(this.bldlayer);
    }
    if (this.options.showEntranceLayer) {
      layers.push(this.entlayer);
    }
    const webmap = this.createWebMap(basemap, layers);
    this.view = this.createMapView(webmap);

    void this.view.when(() => {
      if (this.view?.popup) {
        this.view.popup.set('dockOptions', {
          breakpoint: false,
          buttonEnabled: false,
          position: 'top-left',
        });
      }
    });
    this.enableFilterPopup();
    if (this.options.enableLegend) {
      this.enableLegend();
    }

    void this.filterBuildingData(this.options.bldWhereCase);
    void this.filterEntranceData(this.options.entWhereCase);

    if (this.options.enableSelection) {
      this.featureSelectionService.createFeatureSelection(
        this.view,
        webmap,
        this.eventsCleanupCallbacks
      );
    }
    void this.baseMapChangeService.createBasemapChangeAction(
      this.view,
      this.reload.bind(this),
      this.eventsCleanupCallbacks
    );

    return this.view;
  }

  private enableLegend() {
    if (this.view) {
      const legend = new Legend({
        view: this.view,
        visible: true,
      });
      this.view.ui.add(legend, 'bottom-right');
    }
  }

  private enableFilterPopup() {
    if (this.view) {
      this.view.watch('zoom', (newZoom) => {
        if (!this.view?.map) {
          return;
        }
        this.customZoom = Math.min(newZoom, 18);
        const lessThan10000 = this.totalResults && this.totalResults < 10000;
        if (newZoom < 15 && !lessThan10000) {
          this.bldlayer.visible = false;
          this.entlayer.visible = false;
          this.alreadyFocused = false;
        } else {
          this.bldlayer.visible = true;
          this.entlayer.visible = true;
        }
      });
      const cleanup = this.view.on('click', () => {
        // event is the event handle returned after the event fires.
        setTimeout(() => {
          if (isDevMode()) {
            if (this.view?.popup) {
              this.view.popup.close();
              console.log(this.view.popup?.selectedFeature);
            }
          }
          if (!this.options?.enableFilter) {
            return;
          }
          if (!this.view?.popup?.selectedFeature) {
            return;
          }
          if (
            this.view.popup!.selectedFeature!.layer?.title === 'ASRDB Buildings'
          ) {
            const globalId =
              this.view.popup.selectedFeature.attributes['GlobalID'];
            this.registerFilterService.setBuildingGlobalIdFilter(globalId);
          }
          if (
            this.view.popup.selectedFeature.layer?.title === 'ASRDB Entrances'
          ) {
            const globalId =
              this.view.popup.selectedFeature.attributes['EntBldGlobalID'];
            this.registerFilterService.setBuildingGlobalIdFilter(globalId);
          }
        }, 50);
      });
      this.eventsCleanupCallbacks.push(() => {
        cleanup.remove();
      });
    }
  }

  private createMapView(webmap: __esri.WebMap) {
    return new MapView({
      container: this.nativeElement,
      popup: new Popup({
        dockEnabled: true,
        dockOptions: {
          // Disables the dock button from the popup
          buttonEnabled: false,
          // Ignore the default sizes that trigger responsive docking
          breakpoint: false,
        },
        visibleElements: {
          closeButton: false,
        },
      }),
      map: webmap,
      zoom: 15,
    });
  }

  private createWebMap(basemap: any, layers: any[]) {
    return new WebMap({
      basemap: basemap ?? OSM_BASEMAP,
      layers: layers,
      applicationProperties: {
        viewing: {
          search: {
            enabled: true,
          },
        },
      },
    });
  }

  cleanup() {
    this.eventsCleanupCallbacks.forEach(event => event());
    this.eventsCleanupCallbacks = [];
    this.isOnlyOneBuilding = false;
    if (this.view) {
      this.view.destroy();
      this.view = undefined;
      this.alreadyFocused = false;
      this.customZoom = null;
      this.totalResults = null;
    }
  }

  async filterBuildingData(whereCondition: string) {
    if (!this.view) {
      return;
    }
    if (this.options) {
      this.options.bldWhereCase = whereCondition;
    }
    try {
      const layerView = await this.view.whenLayerView(this.bldlayer);
      layerView['filter'] = new FeatureFilter({
        where: whereCondition,
      });
    } catch (e) {
      console.error(e);
    }
    const query = this.bldlayer.createQuery();
    query.where = whereCondition;
    const extend = await this.bldlayer.queryExtent(query);
    this.totalResults = extend.count;
    if ((this.totalResults && this.totalResults < 10000) || (this.customZoom && this.customZoom >= 15)) {
      this.bldlayer.visible = true;
      this.entlayer.visible = true;
    } else {
      this.bldlayer.visible = false;
      this.entlayer.visible = false;
    }
    const goTo = extend.extent
      ? { target: extend.extent }
      : { center: [19.818, 41.3285], zoom: 18 };
    if (this.isOnlyOneBuilding) {
      setTimeout(() => {
        void this.view?.goTo(extend.extent);
        return
      }, 500);
    }
    const size = this.getBuildingIdsSize(whereCondition);
    switch (size) {
      case 1: {
        void this.view?.goTo(goTo);
        this.alreadyFocused = true;
        break;
      }
      case 0: {
        if (this.alreadyFocused) {
          return;
        }
        if (this.customZoom) {
          void this.view?.goTo({...goTo, zoom: this.customZoom });
        } else {
          void this.view?.goTo(goTo);
        }
        break;
      }
      default: {
        void this.view?.goTo(goTo);
        this.alreadyFocused = true;
        break;
      }
    }
  }

  async filterEntranceData(whereCondition: string) {
    if (!this.view) {
      return;
    }
    if (this.options) {
      this.options.entWhereCase = whereCondition;
    }
    const layerView = await this.view.whenLayerView(this.entlayer);
    layerView['filter'] = new FeatureFilter({
      where: whereCondition,
    });
  }

  private reload(basemap: any) {
    void this.init(undefined, undefined, basemap);
  }

  private getBuildingIdsSize(whereCondition: string): number {
    const splitCondition = whereCondition.split(' ');
    const globalIdIndex = splitCondition.indexOf('GlobalID');
    if (globalIdIndex === -1 || globalIdIndex + 2 >= splitCondition.length) {
      return 0;
    }
    const globalIdValue = splitCondition[globalIdIndex + 2];
    return globalIdValue.split(',').length;
  }
}
