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

  async init(mapViewEl: ElementRef, options: MapInitOptions): Promise<MapView> {
    const container = mapViewEl.nativeElement;
    const graphicsLayer = new GraphicsLayer();

    const webmap = new WebMap({
      basemap: 'osm',
      layers: [graphicsLayer, this.bldlayer, this.entlayer],
      applicationProperties: {
        viewing: {
          search: {
            enabled: true
          }
        }
      }
    });

    const view = new MapView({
      container,
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
      map: webmap
    });

    view.when(() => {
      view.popupEnabled = true;
      view.popup.set('dockOptions', {
        breakpoint: false,
        buttonEnabled: false,
        position: 'top-left'
      });
    });
    if (options.enableFilter) {
      const cleanup = view.on('click', () => {
        // event is the event handle returned after the event fires.
        setTimeout(() => {
          if (isDevMode()) {
            console.log(view.popup.selectedFeature);
          }
          if (!view.popup.selectedFeature) {
            return;
          }
          if (view.popup.selectedFeature.layer.title === 'ASRDB Buildings') {
            const globalId = view.popup.selectedFeature.attributes['GlobalID'];
            this.registerFilterService.setBuildingGlobalIdFilter(globalId);
          }
          if (view.popup.selectedFeature.layer.title === 'ASRDB Entrances') {
            const globalId = view.popup.selectedFeature.attributes['EntBuildingID'];
            this.registerFilterService.setBuildingGlobalIdFilter(globalId);
          }
        }, 100);
      });
      this.eventsCleanupCallbacks.push(() => {
        cleanup.remove();
      });
    }
    void this.filterBuildingData(view, options.bldWhereCase);
    void this.filterEntranceData(view, options.entWhereCase);
    let legend = new Legend({
      view: view,
      visible: options.enableLegend
    });
    view.ui.add(legend, "bottom-right");

    if (options.enableSelection) {
      this.featureSelectionService.createFeatureSelection(view, webmap, this.eventsCleanupCallbacks);
    }
    this.baseMapChangeService.createBasemapChangeAction(view, webmap, this.eventsCleanupCallbacks);

    return view;
  }

  cleanup() {
    this.eventsCleanupCallbacks.forEach(event => event());
  }

  async filterBuildingData(view: MapView, whereCondition: string) {
    if (!view) {
      return;
    }
    (await view.whenLayerView(this.bldlayer)).filter = new FeatureFilter({
      where: whereCondition,
    });
    const query = this.bldlayer.createQuery();
    query.where = whereCondition;
    const extend = await this.bldlayer.queryExtent(query);
    view.goTo(extend.count !== 0 ? extend.extent : {
      center: [19.818, 41.3285],
      zoom: 18
    });
  }

  async filterEntranceData(view: MapView, whereCondition: string) {
    if (!view) {
      return;
    }
    (await view.whenLayerView(this.entlayer)).filter = new FeatureFilter({
      where: whereCondition,
    });
  }
}
