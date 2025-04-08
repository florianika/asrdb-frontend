import { ElementRef, Injectable } from '@angular/core';
import { CommonEsriAuthService } from '../../common/service/common-esri-auth.service';
import WebMap from '@arcgis/core/WebMap';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import MapView from '@arcgis/core/views/MapView';
import Sketch from '@arcgis/core/widgets/Sketch';
import {BehaviorSubject, Subject} from 'rxjs';
import { MapData } from '../model/map-data';
import Graphic from '@arcgis/core/Graphic';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import { MatSnackBar } from '@angular/material/snack-bar';
import {EntityType} from "../../quality-management/quality-management-config";
import {ActivatedRoute} from "@angular/router";
import {BaseMapChangeService} from "../../common/components/register-map/custom-map-logic/basemap-change";
import {CommonBuildingService} from "../../common/service/common-building.service";
import FeatureFilter from "@arcgis/core/layers/support/FeatureFilter";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import SketchProperties = __esri.SketchProperties;
import {MapInitOptions} from "../../common/components/register-map/register-map.service";
import {OSM_BASEMAP} from "../../common/components/register-map/custom-map-logic/BasemapTypes";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";

@Injectable()
export class EntityCreationMapService {
  private valueUpdate = new Subject<MapData>();
  private graphicsLayer!: GraphicsLayer;
  private eventsCleanupCallbacks: (() => void)[] = [];
  private readonly bldLayer;
  private municipality = new BehaviorSubject('99');
  private view: MapView | undefined = undefined;
  private createdGraphic: any | null = null;

  get valueChanged() {
    return this.valueUpdate.asObservable();
  }

  get municipalityObservable() {
    return this.municipality.asObservable();
  }

  private valueDelete = new Subject<Partial<MapData>>();
  get valueDeleted() {
    return this.valueDelete.asObservable();
  }

  private nativeElement: string | HTMLDivElement | undefined;
  private availableTools: string[] = [];
  private editingGeometry: any[] | undefined;

  private readonly entranceId: string;

  constructor(
    private esriAuthService: CommonEsriAuthService,
    private matSnackBar: MatSnackBar,
    private activatedRoute: ActivatedRoute,
    private basemapService: BaseMapChangeService,
    private buildingService: CommonBuildingService
  ) {
    this.entranceId = this.activatedRoute.snapshot.queryParamMap.get('entranceId') ?? '';
    this.bldLayer = this.buildingService.bldLayer as FeatureLayer;
    (this.bldLayer.renderer as UniqueValueRenderer).uniqueValueInfos = [];
    (this.bldLayer.renderer as UniqueValueRenderer).defaultSymbol = {
      type: 'simple-fill', // autocasts as new SimpleFillSymbol()
      color: 'rgb(119,119,119)',
      outline: {
        // autocasts as new SimpleLineSymbol()
        color: "rgb(119,119,119)",
        width: 3
      } as any
    } as any;
    this.municipalityObservable.subscribe(municipality => {
      if (municipality && municipality !== '99' && this.view) {
        void this.filterBuildingData(`BldMunicipality='${municipality.toString()}'`);
      }
    });
  }

  public setMunicipality(municipality: string) {
    this.municipality.next(municipality.toString());
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

  private async init(mapViewEl?: ElementRef, availableTools?: string[], editingGeometry?: any[], basemap?: any): Promise<MapView> {
    if (mapViewEl) {
      this.nativeElement = mapViewEl.nativeElement;
    }
    if (availableTools) {
      this.availableTools = availableTools;
    }
    if (editingGeometry) {
      this.editingGeometry = JSON.parse(JSON.stringify(editingGeometry));
    }

    if (!this.nativeElement || !this.availableTools) {
      throw new Error("MapView element or available tools are not defined");
    }

    this.graphicsLayer = new GraphicsLayer();
    const mainGraphic: Graphic | null = this.addExistingGraphics(this.editingGeometry, this.graphicsLayer);
    const layers: any[] = [this.graphicsLayer];
    if (this.availableTools.includes('polygon')) {
      layers.push(this.bldLayer);
    }
    const webmap = new WebMap({
      basemap: basemap ?? OSM_BASEMAP,
      layers: layers,
      applicationProperties: {
        viewing: {
          search: {
            enabled: true
          }
        }
      },
    });

    this.view = new MapView({
      container: this.nativeElement,
      map: webmap,
    });

    void this.view.when(() => {
      if (mainGraphic) {
        this.view!.goTo(mainGraphic);
      }
    });
    this.createSketch();
    if (this.municipality.value && this.municipality.value !== '99') {
      void this.filterBuildingData(`BldMunicipality='${this.municipality.value.toString()}'`);
    }

    void this.basemapService.createBasemapChangeAction(this.view, this.reload.bind(this), this.eventsCleanupCallbacks);
    return this.view;
  }

  private createSketch() {
    if (this.view) {
      const sketch = new Sketch({
        layer: this.graphicsLayer,
        view: this.view,
        // graphic will be selected as soon as it is created
        creationMode: 'update',
        availableCreateTools: this.availableTools,
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
      } as SketchProperties);
      this.view.ui.add(sketch, 'top-right');
      this.registerCreateEvent(sketch);
      this.registerUpdateEvent(sketch);
      this.registerDeleteEvent(sketch);
      if (this.createdGraphic) {
        setTimeout(() => {
          this.addExistingGraphics([{
            ...this.createdGraphic.geometry!.toJSON(),
            id: this.createdGraphic.attributes.id,
            type: this.createdGraphic.geometry!.toJSON().rings ? 'polygon' : 'point'
          }], sketch.layer);
        }, 100);
      }
    }
  }

  private reload(basemap: any) {
    void this.init(undefined, undefined, undefined, basemap);
  }

  private registerDeleteEvent(sketch: Sketch) {
    const cleanup = sketch.on('delete', (event) => {
      if (event.graphics[0].attributes.id?.toString().startsWith('{')) {
        // stop the delete by adding back the graphic in the layer
        setTimeout(() => {
          this.addExistingGraphics([{
            ...event.graphics[0].geometry!.toJSON(),
            id: event.graphics[0].attributes.id,
            type: event.graphics[0].geometry!.toJSON().rings ? 'polygon' : 'point'
          }], sketch.layer);
        }, 100);
        this.matSnackBar.open('You cannot delete already existing entities!', 'Ok', {
          duration: 3000
        });
        return;
      }
      this.valueDelete.next({
        ...event.graphics[0].geometry!.toJSON(),
        id: event.graphics[0].attributes.id
      });
      this.createdGraphic = null;

      sketch.availableCreateTools = [event.graphics[0].geometry!.type as any];
    });
    this.eventsCleanupCallbacks.push(() => {
      cleanup.remove();
    });
  }

  private registerUpdateEvent(sketch: Sketch) {
    const cleanup = sketch.on('update', (event) => {
      if (event.state === 'complete') {
        const centroid = event.graphics[0].geometry!.type === 'polygon'
        ? (event.graphics[0].geometry as any)['centroid']
        : {
          latitude: (event.graphics[0].geometry as any).latitude,
          longitude: (event.graphics[0].geometry as any).longitude
        };
        this.valueUpdate.next({
          ...event.graphics[0].geometry!.toJSON(),
          id: event.graphics[0].attributes.id,
          centroid: centroid,
          spatialReference: {
            latestWkid: (event.graphics[0].geometry!.spatialReference as any)['latestWkid'],
            wkid: event.graphics[0].geometry!.spatialReference.wkid
          }
        });
        const existingItemIndex = this.editingGeometry?.findIndex(el => el.id === event.graphics[0].attributes.id);
        if (existingItemIndex !== -1) {
          if (this.editingGeometry![existingItemIndex!].rings) {
            this.editingGeometry![existingItemIndex!].rings = event.graphics[0].geometry.toJSON().rings;
            this.editingGeometry![existingItemIndex!].spatialReference = event.graphics[0].geometry.toJSON().spatialReference;
          } else {
            this.editingGeometry![existingItemIndex!].x = event.graphics[0].geometry.toJSON().x;
            this.editingGeometry![existingItemIndex!].y = event.graphics[0].geometry.toJSON().y;
            this.editingGeometry![existingItemIndex!].spatialReference = event.graphics[0].geometry.toJSON().spatialReference;
          }
        } else {
          this.createdGraphic = event.graphics[0];
        }
      }
    });
    this.eventsCleanupCallbacks.push(() => {
      cleanup.remove();
    });
  }

  private registerCreateEvent(sketch: Sketch) {
    const cleanup = sketch.on('create', (event) => {
      if (event.state === 'complete') {
        const type = event.graphic.geometry!.type;
        const id = type === 'polygon' ? null : ('New (' + Math.random() + ')');
        const centroid = event.graphic.geometry!.type === 'polygon'
        ? (event.graphic.geometry! as any)['centroid']
        : {
          latitude: (event.graphic.geometry! as any).latitude,
          longitude: (event.graphic.geometry! as any).longitude
        };
        this.valueUpdate.next({
          ...event.graphic.geometry!.toJSON(),
          id: id,
          centroid: centroid,
          spatialReference: {
            latestWkid: (event.graphic.geometry?.spatialReference as any)['latestWkid'],
            wkid: event.graphic.geometry?.spatialReference.wkid
          }
        });
        event.graphic.attributes = {
          id: id
        };
        this.createdGraphic = event.graphic;

        sketch.availableCreateTools = sketch.availableCreateTools?.filter(tool => tool !== type) ?? [];
      }
    });

    this.eventsCleanupCallbacks.push(() => {
      cleanup.remove();
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

  async filterBuildingData(whereCondition: string, retires = 3) {
    if (!this.view || retires === 0) {
      return;
    }
    (await this.view.whenLayerView(this.bldLayer))!.filter = new FeatureFilter({
      where: whereCondition,
    });
    const query = this.bldLayer.createQuery();
    query.where = whereCondition;
    try {
      const extend = await this.bldLayer.queryExtent(query);
      void this.view.goTo(extend.count !== 0 ? extend.extent : {
        center: [19.818, 41.3285],
        zoom: 9
      });
    } catch (e) {
      console.log(e);
      void this.filterBuildingData(whereCondition, --retires);
    }
  }
}
