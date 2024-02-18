import { ElementRef, Injectable } from '@angular/core';
import { CommonEsriAuthService } from '../service/common-esri-auth.service';
import WebMap from '@arcgis/core/WebMap';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import MapView from '@arcgis/core/views/MapView';
import Sketch from '@arcgis/core/widgets/Sketch';
import { Subject } from 'rxjs';
import { CommonBuildingService } from '../service/common-building.service';
import { MapData } from '../model/map-data';
import Graphic from '@arcgis/core/Graphic';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';

@Injectable()
export class EntityCreationMapService {
  private valueUpdate = new Subject<MapData>();
  get valueChanged() {
    return this.valueUpdate.asObservable();
  }

  private valueDelete = new Subject<Partial<MapData>>();
  get valueDeleted() {
    return this.valueDelete.asObservable();
  }

  constructor(private esriAuthService: CommonEsriAuthService, private commonBuildingService: CommonBuildingService) {

  }

  public async initBuildingCreationmap(mapViewEl: ElementRef, editingGeometry?: any[]) {
    return this.init(mapViewEl, ['polygon', 'point'], editingGeometry);
  }

  private async init(mapViewEl: ElementRef, availableTools: string[], editingGeometry?: any[]): Promise<MapView> {
    const container = mapViewEl.nativeElement;
    const graphicsLayer = new GraphicsLayer();
    const mainGraphic: Graphic | null = this.addExistingGraphics(editingGeometry, graphicsLayer);

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
        availableCreateTools: availableTools,
      });

      // TODO: Clear handlers
      this.registerCreateEvent(sketch);
      this.registerUpdateEvent(sketch);
      this.registerDeleteEvent(sketch);

      view.ui.add(sketch, 'top-right');
      if (mainGraphic) {
        view.goTo(mainGraphic);
      } else {
        view.goTo({
          center: [19.83, 41.33],
          zoom: 9
        });
      }
    });
    return view;
  }

  private registerDeleteEvent(sketch: Sketch) {
    sketch.on('delete', (event) => {
      console.log(event.graphics[0].geometry.toJSON());
      this.valueDelete.next({
        ...event.graphics[0].geometry.toJSON(),
        id: event.graphics[0].attributes.id
      });
      if (event.graphics[0].geometry.type === 'polygon') {
        sketch.availableCreateTools = ['polygon', 'point'];
      }
    });
  }

  private registerUpdateEvent(sketch: Sketch) {
    sketch.on('update', (event) => {
      if (event.state === 'complete') {
        console.log(event.graphics[0].geometry.toJSON());
        this.valueUpdate.next({
          ...event.graphics[0].geometry.toJSON(),
          id: event.graphics[0].attributes.id
        });
      }
    });
  }

  private registerCreateEvent(sketch: Sketch) {
    sketch.on('create', (event) => {
      if (event.state === 'complete') {
        console.log(event.graphic.geometry.toJSON());

        const id = event.graphic.geometry.type === 'polygon' ? null : Math.random();
        this.valueUpdate.next({
          ...event.graphic.geometry.toJSON(),
          id: id
        });
        event.graphic.attributes = {
          id: id
        };

        if (event.graphic.geometry.type === 'polygon') {
          sketch.availableCreateTools = ['point'];
        }
      }
    });
  }

  private addExistingGraphics(editingGeometry: any[] | undefined, graphicsLayer: GraphicsLayer) {
    let mainGraphic: Graphic | null = null;
    editingGeometry?.forEach(g => {
      const geometry = g.type === 'point'
        ? new Point({
          x: g.x,
          y: g.y,
          spatialReference: g.spatialReference
        })
        : new Polygon({
          rings: g.rings,
          spatialReference: g.spatialReference
        });

      const symbol = g.type === 'point'
      ? new SimpleMarkerSymbol({
        style: 'circle',
        outline: {
          width: '1px'
        },
        size: 6,
        color: 'white'
      })
      : new SimpleFillSymbol({
        style: 'forward-diagonal',
        outline: {
          width: '3px'
        }
      });
      const graphic = new Graphic({
        geometry,
        symbol,
        attributes: {
          id: g.id
        }
      });
      if (geometry.type === 'polygon') {
        mainGraphic = graphic;
      }
      graphicsLayer.add(graphic);
    });
    return mainGraphic;
  }
}
