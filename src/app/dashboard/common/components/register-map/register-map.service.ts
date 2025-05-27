import {ElementRef, Injectable, isDevMode} from '@angular/core';

import MapView from '@arcgis/core/views/MapView';
import Popup from '@arcgis/core/widgets/Popup';
import FeatureFilter from '@arcgis/core/layers/support/FeatureFilter';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import WebMap from '@arcgis/core/WebMap';
import {CommonBuildingService} from '../../service/common-building.service';
import {CommonEntranceService} from '../../service/common-entrance.service';
import {CommonEsriAuthService} from '../../service/common-esri-auth.service';
import {RegisterFilterService} from '../../../register/register-table-view/register-filter.service';
import {FeatureSelectionService} from "./custom-map-logic/feature-selection";
import {BaseMapChangeService} from "./custom-map-logic/basemap-change";
import Legend from "@arcgis/core/widgets/Legend";
import {OSM_BASEMAP} from "./custom-map-logic/BasemapTypes";
import Collection from "@arcgis/core/core/Collection";
import Layer from "@arcgis/core/layers/Layer";

export type MapInitOptions = {
  enableFilter: boolean,
  enableSelection: boolean,
  bldWhereCase: string,
  entWhereCase: string,
  enableLegend: boolean
}

@Injectable()
export class RegisterMapService {
  private bldlayer;
  private entlayer;
  private eventsCleanupCallbacks: (() => void)[] = [];
  private nativeElement: string | HTMLDivElement | undefined;
  private options: MapInitOptions | undefined;
  private view: MapView | undefined;
  private graphicsLayer?: GraphicsLayer;

  constructor(
    private buildingService: CommonBuildingService,
    private entranceService: CommonEntranceService,
    private registerFilterService: RegisterFilterService,
    private baseMapChangeService: BaseMapChangeService,
    private featureSelectionService: FeatureSelectionService,
    private esriAuthService: CommonEsriAuthService) {
    this.bldlayer = this.buildingService.bldLayer;
    this.entlayer = this.entranceService.entLayer;
  }

  async init(mapViewEl?: ElementRef, options?: MapInitOptions, basemap?: any): Promise<MapView> {
    if (mapViewEl) {
      this.nativeElement = mapViewEl.nativeElement;
    }
    if (options) {
      this.options = options;
    }
    if (!this.options || !this.nativeElement) {
      throw new Error("Options or nativeElement are not defined");
    }
    this.graphicsLayer = new GraphicsLayer();

    const webmap = this.createWebMap(basemap, [this.graphicsLayer, this.bldlayer, this.entlayer]);
    this.view = this.createMapView(webmap);

    void this.view.when(() => {
      if (this.view?.popup) {
        this.view.popup.set('dockOptions', {
          breakpoint: false,
          buttonEnabled: false,
          position: 'top-left'
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
      this.featureSelectionService.createFeatureSelection(this.view, webmap, this.eventsCleanupCallbacks);
    }
    void this.baseMapChangeService.createBasemapChangeAction(this.view, this.reload.bind(this), this.eventsCleanupCallbacks);

    return this.view;
  }

  private enableLegend() {
    if (this.view) {
      let legend = new Legend({
        view: this.view,
        visible: true,
      });
      this.view.ui.add(legend, "bottom-right");
    }
  }

  private enableFilterPopup() {
    if (this.view) {
      this.view.watch('zoom', (newZoom, oldZoom) => {
        if (!this.view?.map) {
          return;
        }
        if (newZoom < 16) {
          this.view.map.layers = new Collection<Layer>();
        } else {
          this.view.map.layers = new Collection<Layer>([this.graphicsLayer, this.bldlayer, this.entlayer]);
        }
      })
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
          if (this.view.popup!.selectedFeature!.layer?.title === 'ASRDB Buildings') {
            const globalId = this.view.popup.selectedFeature.attributes['GlobalID'];
            this.registerFilterService.setBuildingGlobalIdFilter(globalId);
          }
          if (this.view.popup.selectedFeature.layer?.title === 'ASRDB Entrances') {
            const globalId = this.view.popup.selectedFeature.attributes['EntBldGlobalID'];
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
          breakpoint: false
        },
        visibleElements: {
          closeButton: false,
        }
      }),
      map: webmap,
      zoom: 20
    });
  }

  private createWebMap(basemap: any, layers: any[]) {
    return new WebMap({
      basemap: basemap ?? OSM_BASEMAP,
      layers: layers,
      applicationProperties: {
        viewing: {
          search: {
            enabled: true
          }
        },
      },
    });
  }

  cleanup() {
    this.eventsCleanupCallbacks.forEach(event => event());
    if (this.view) {
      this.view.destroy();
    }
  }

  async filterBuildingData(whereCondition: string) {
    if (!this.view) {
      return;
    }
    if (this.options) {
      this.options.bldWhereCase = whereCondition;
    }
    const layerView = await this.view.whenLayerView(this.bldlayer);
    layerView['filter'] = new FeatureFilter({
      where: whereCondition,
    });
    const query = this.bldlayer.createQuery();
    query.where = whereCondition;
    const extend = await this.bldlayer.queryExtent(query);
    void this.view.goTo(extend.extent ? extend.extent : {
      center: [19.818, 41.3285],
      zoom: 18
    });
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
}
