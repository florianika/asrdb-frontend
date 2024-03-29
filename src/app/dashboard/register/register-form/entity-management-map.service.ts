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
import {EntityType} from "../../quality-management/quality-management-config";
import {ActivatedRoute} from "@angular/router";

@Injectable()
export class EntityCreationMapService {
  private valueUpdate = new Subject<MapData>();
  private graphicsLayer!: GraphicsLayer;
  get valueChanged() {
    return this.valueUpdate.asObservable();
  }

  private valueDelete = new Subject<Partial<MapData>>();
  get valueDeleted() {
    return this.valueDelete.asObservable();
  }

  private readonly entranceId: string;

  constructor(
    private esriAuthService: CommonEsriAuthService,
    private matSnackBar: MatSnackBar,
    private activatedRoute: ActivatedRoute
  ) {
    this.entranceId = this.activatedRoute.snapshot.queryParamMap.get('entranceId') ?? '';
  }

  public async initBuildingCreationMap(mapViewEl: ElementRef, entityType?: EntityType, editingGeometry?: any[]) {
    const availableCreateTools = [];
    if (entityType === 'BUILDING' && !editingGeometry?.length) {
      availableCreateTools.push('polygon');
    }
    if (entityType === 'ENTRANCE') {
      if (!this.entranceId) {
        availableCreateTools.push('point');
      }
    }
    return this.init(mapViewEl, availableCreateTools, editingGeometry);
  }

  public getCreatedGraphic() {
    return this.graphicsLayer.graphics.map(function (graphic) {
      return graphic.geometry;
    });
  }

  private async init(mapViewEl: ElementRef, availableTools: string[], editingGeometry?: any[]): Promise<MapView> {
    const container = mapViewEl.nativeElement;
    this.graphicsLayer = new GraphicsLayer();
    const mainGraphic: Graphic | null = this.addExistingGraphics(editingGeometry, this.graphicsLayer);

    const webmap = new WebMap({
      basemap: 'osm',
      layers: [this.graphicsLayer],
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
        layer: this.graphicsLayer,
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
      this.valueDelete.next({
        ...event.graphics[0].geometry.toJSON(),
        id: event.graphics[0].attributes.id
      });

      sketch.availableCreateTools = [event.graphics[0].geometry.type];
    });
  }

  private registerUpdateEvent(sketch: Sketch) {
    sketch.on('update', (event) => {
      if (event.state === 'complete') {
        const centroid = event.graphics[0].geometry.type === 'polygon'
        ? (event.graphics[0].geometry as any)['centroid']
        : {
          latitude: (event.graphics[0].geometry as any).latitude,
          longitude: (event.graphics[0].geometry as any).longitude
        };
        this.valueUpdate.next({
          ...event.graphics[0].geometry.toJSON(),
          id: event.graphics[0].attributes.id,
          centroid: centroid,
          spatialReference: {
            latestWkid: (event.graphics[0].geometry.spatialReference as any)['latestWkid'],
            wkid: event.graphics[0].geometry.spatialReference.wkid
          }
        });
      }
    });
  }

  private registerCreateEvent(sketch: Sketch) {
    sketch.on('create', (event) => {
      if (event.state === 'complete') {
        const type = event.graphic.geometry.type;
        const id = type === 'polygon' ? null : ('New (' + Math.random() + ')');
        const centroid = event.graphic.geometry.type === 'polygon'
        ? (event.graphic.geometry as any)['centroid']
        : {
          latitude: (event.graphic.geometry as any).latitude,
          longitude: (event.graphic.geometry as any).longitude
        };
        this.valueUpdate.next({
          ...event.graphic.geometry.toJSON(),
          id: id,
          centroid: centroid,
          spatialReference: {
            latestWkid: (event.graphic.geometry.spatialReference as any)['latestWkid'],
            wkid: event.graphic.geometry.spatialReference.wkid
          }
        });
        event.graphic.attributes = {
          id: id
        };

        sketch.availableCreateTools = sketch.availableCreateTools.filter(tool => tool !== type);
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
          color: this.entranceId === g.id ? 'white' : 'red'
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
