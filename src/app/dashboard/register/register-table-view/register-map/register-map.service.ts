import { ElementRef, Injectable } from '@angular/core';

import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import MapView from '@arcgis/core/views/MapView';
import Popup from '@arcgis/core/widgets/Popup';
import FeatureFilter from '@arcgis/core/layers/support/FeatureFilter';
import Sketch from '@arcgis/core/widgets/Sketch';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import WebMap from '@arcgis/core/WebMap';
import { CommonBuildingService } from '../../service/common-building.service';
import { CommonEntranceService } from '../../service/common-entrance.service';
import { CommonEsriAuthService } from '../../service/common-esri-auth.service';

@Injectable()
export class RegisterMapService {
  private bldlayer;
  private entlayer;

  constructor(
    private buildingService: CommonBuildingService,
    private entranceService: CommonEntranceService,
    private esriAuthService: CommonEsriAuthService) {
      this.bldlayer = this.buildingService.bldLayer;
      this.entlayer = this.entranceService.entLayer;
    }

  async init(mapViewEl: ElementRef): Promise<MapView> {
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
      view?.popup.set('dockOptions', {
        breakpoint: false,
        buttonEnabled: false,
        position: 'top-left'
      });
    });
    await view.whenLayerView(this.bldlayer);
    view.goTo(this.bldlayer.fullExtent);

    return view;
  }

  async filterData(view: MapView, whereCondition: string) {
    (await view.whenLayerView(this.bldlayer)).filter = new FeatureFilter({
      where: whereCondition,
    });
  }
}
