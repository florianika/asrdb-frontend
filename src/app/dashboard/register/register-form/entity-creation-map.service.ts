import { ElementRef, Injectable } from '@angular/core';
import { CommonEsriAuthService } from '../service/common-esri-auth.service';
import WebMap from '@arcgis/core/WebMap';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import MapView from '@arcgis/core/views/MapView';
import Sketch from '@arcgis/core/widgets/Sketch';
import { Subject } from 'rxjs';

@Injectable()
export class EntityCreationMapService {
  private valueUpdate = new Subject<{rings: [number[]], x: number, y: number}>();
  get valueChanged() {
    return this.valueUpdate.asObservable();
  }

  constructor(private esriAuthService: CommonEsriAuthService) {

  }

  public async initBuildingCreationmap(mapViewEl: ElementRef) {
    return this.init(mapViewEl, ['polygon', 'point']);
  }

  public async initEntranceCreationMap(mapViewEl: ElementRef) {
    return this.init(mapViewEl, ['point']);
  }

  private async init(mapViewEl: ElementRef, availableTools: string[]): Promise<MapView> {
    const container = mapViewEl.nativeElement;
    const graphicsLayer = new GraphicsLayer();

    const webmap = new WebMap({
      basemap: 'hybrid',
      layers: [graphicsLayer],
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
      map: webmap
    });

    view.when(() => {
      const sketch = new Sketch({
        layer: graphicsLayer,
        view: view,
        // graphic will be selected as soon as it is created
        creationMode: 'update',
        availableCreateTools: availableTools
      });

      sketch.on('create', (event) => {
        if (event.state === 'complete') {
          console.log(event.graphic.geometry.toJSON());
          this.valueUpdate.next(event.graphic.geometry.toJSON());
        }
      });

      sketch.on('update', (event) => {
        if (event.state === 'complete') {
          console.log(event.graphics[0].geometry.toJSON());
          this.valueUpdate.next(event.graphics[0].geometry.toJSON());
        }
      });

      view.ui.add(sketch, 'top-right');
      view.zoom = 6;
      view.goTo({
        center: [19.83, 41.33],
        zoom: 9
      });
    });
    return view;
  }
}
