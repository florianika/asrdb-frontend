import { ElementRef, Injectable } from '@angular/core';

import MapView from '@arcgis/core/views/MapView';
import Popup from '@arcgis/core/widgets/Popup';
import FeatureFilter from '@arcgis/core/layers/support/FeatureFilter';
import Sketch from '@arcgis/core/widgets/Sketch';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import WebMap from '@arcgis/core/WebMap';
import { CommonBuildingService } from '../../service/common-building.service';
import { CommonEntranceService } from '../../service/common-entrance.service';
import { CommonEsriAuthService } from '../../service/common-esri-auth.service';
import { RegisterFilterService } from '../register-filter.service';

@Injectable()
export class RegisterMapService {
  private bldlayer;
  private entlayer;

  constructor(
    private buildingService: CommonBuildingService,
    private entranceService: CommonEntranceService,
    private registerFilterService: RegisterFilterService,
    private esriAuthService: CommonEsriAuthService) {
      this.bldlayer = this.buildingService.bldLayer;
      this.entlayer = this.entranceService.entLayer;
    }

  async init(mapViewEl: ElementRef, enableEdditing: boolean): Promise<MapView> {
    const container = mapViewEl.nativeElement;
    const graphicsLayer = new GraphicsLayer();

    const webmap = new WebMap({
      basemap: 'hybrid',
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
      // const centerPoint = this.view?.center.clone();
      if (enableEdditing) {
        const sketch = new Sketch({
          layer: graphicsLayer,
          view: view,
          // graphic will be selected as soon as it is created
          creationMode: 'update',
        });

        sketch.on('create', (event) => {
          if (event.state === 'complete') {
            console.log(event.graphic.geometry.toJSON());
          }
        });

        sketch.on('update', (event) => {
          if (event.state === 'complete') {
            console.log(event.graphics[0].geometry.toJSON());
          }
        });

        view.ui.add(sketch, 'top-right');
      }

      view.popup.set('dockOptions', {
        breakpoint: false,
        buttonEnabled: false,
        position: 'top-left'
      });
    });

    view.on('click', () => {
      // event is the event handle returned after the event fires.
      setTimeout(() => {
        console.log(view.popup.selectedFeature);
        if (!view.popup.selectedFeature) {
          this.registerFilterService.setBuildingGlobalIdFilter('');
          return;
        }
        const globalId = view.popup.selectedFeature.attributes['GlobalID'];
        this.registerFilterService.setBuildingGlobalIdFilter(globalId);
      }, 100);
    });

    await view.whenLayerView(this.bldlayer);
    view.goTo(this.bldlayer.fullExtent);

    return view;
  }

  async filterBuildingData(view: MapView, whereCondition: string) {
    if (!view) {
      return;
    }
    (await view.whenLayerView(this.bldlayer)).filter = new FeatureFilter({
      where: whereCondition,
    });
    view.goTo(this.bldlayer.fullExtent);
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
