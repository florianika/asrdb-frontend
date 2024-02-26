import { ElementRef, Injectable } from '@angular/core';
import { CommonEsriAuthService } from '../service/common-esri-auth.service';
import WebMap from '@arcgis/core/WebMap';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import MapView from '@arcgis/core/views/MapView';
import Sketch from '@arcgis/core/widgets/Sketch';
import { Subject } from 'rxjs';
import { MapData } from '../model/map-data';
import Graphic from '@arcgis/core/Graphic';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import { MatSnackBar } from '@angular/material/snack-bar';

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

  constructor(
    private esriAuthService: CommonEsriAuthService,
    private matSnackBar: MatSnackBar
  ) {
  }

  public async initBuildingCreationmap(mapViewEl: ElementRef, editingGeometry?: any[]) {
    const availableCreateTools = editingGeometry?.length ? ['point'] : ['polygon', 'point'];
    return this.init(mapViewEl, availableCreateTools, editingGeometry);
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
        defaultUpdateOptions: {
          multipleSelectionEnabled: false,
        },
        visibleElements: {
          duplicateButton: false,
          undoRedoMenu: false,
          selectionTools: {
            'rectangle-selection': false,
            'lasso-selection': false
          },
          settingsMenu: false
        }
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
      if (event.graphics[0].attributes.id?.toString().startsWith('{')) {
        // stop the delete by adding back the graphic in the layer
        setTimeout(() => {
          this.addExistingGraphics([{
            ...event.graphics[0].geometry.toJSON(),
            id: event.graphics[0].attributes.id,
            type: event.graphics[0].geometry.toJSON().rings ? 'polygon' : 'point'
          }], sketch.layer);
        }, 100);
        this.matSnackBar.open('You cannot delete already existing entities!', 'Ok', {
          duration: 3000
        });
        return;
      }
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
          id: event.graphics[0].attributes.id,
          centroid: (event.graphics[0].geometry as any)['centroid']
        });
      }
    });
  }

  private registerCreateEvent(sketch: Sketch) {
    sketch.on('create', (event) => {
      if (event.state === 'complete') {
        console.log(event.graphic.geometry.toJSON());

        const id = event.graphic.geometry.type === 'polygon' ? null : ('New (' + Math.random() + ')');
        this.valueUpdate.next({
          ...event.graphic.geometry.toJSON(),
          id: id,
          centroid: (event.graphic.geometry as any)['centroid']
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

  private addCentoidPoint(graphic: Graphic, graphicsLayer: GraphicsLayer) {
    const pointTest = new Graphic({
      geometry: new Point({
        x: graphic.geometry.extent.center.x,
        y: graphic.geometry.extent.center.y
      }),
      symbol: new SimpleMarkerSymbol({
        style: 'circle',
        outline: {
          width: '1px'
        },
        size: 6,
        color: 'red'
      })
    });
    graphicsLayer.add(pointTest);
  }
}