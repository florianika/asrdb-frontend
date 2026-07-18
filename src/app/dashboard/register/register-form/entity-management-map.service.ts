import { ElementRef, Injectable, OnDestroy } from '@angular/core';
import { CommonEsriAuthService } from '../../common/service/common-esri-auth.service';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import MapView from '@arcgis/core/views/MapView';
import Sketch from '@arcgis/core/widgets/Sketch';
import { BehaviorSubject, Subject, firstValueFrom, takeUntil } from 'rxjs';
import { MapData } from '../model/map-data';
import Graphic from '@arcgis/core/Graphic';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EntityType } from '../../../common/model/entity-type';
import { ActivatedRoute } from '@angular/router';
import { BaseMapChangeService } from '../../common/components/register-map/custom-map-logic/basemap-change';
import { CommonBuildingService } from '../../common/service/common-building.service';
import FeatureFilter from '@arcgis/core/layers/support/FeatureFilter';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer';
import {
  AuthStateService,
  DEFAULT_MUNICIPALITY,
} from '../../../common/services/auth-state.service';
import {
  BUILDING_ENTITY,
  ENTRANCE_ENTITY,
} from '../../../common/constants/common-constants';
import SketchProperties = __esri.SketchProperties;
import { CommonMunicipalityService } from '../../common/service/common-municipality.service';
import { CleanupCallback } from '../../common/components/register-map/map-types';
import { arcGisIntegerLiteral } from '../../common/helper/arcgis-query';
import {
  configureWmtsConstraints,
  createMapSession,
  destroyMapSession,
} from '../../common/components/register-map/map-view-factory';
import { WmtsCapabilitiesService } from '../../common/components/register-map/wmts-capabilities.service';

export type EditableGeometry = {
  id?: number | string | null;
  type: 'polygon' | 'point';
  rings?: number[][][];
  x?: number;
  y?: number;
  spatialReference: __esri.SpatialReferenceProperties;
};

@Injectable()
export class EntityCreationMapService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private valueUpdate = new Subject<MapData>();
  private graphicsLayer!: GraphicsLayer;
  private eventsCleanupCallbacks: CleanupCallback[] = [];
  private readonly bldLayer: FeatureLayer;
  private readonly municipalityLayer: FeatureLayer;
  private municipality: BehaviorSubject<number | null>;
  private view: MapView | undefined = undefined;
  private createdGraphic: Graphic | null = null;
  private totalResults: number | null = null;
  private zoomVisibilityDebounce: ReturnType<typeof setTimeout> | null = null;
  private maxZoomHide = 15;

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
  private editingGeometry: EditableGeometry[] | undefined;

  private readonly entranceId: string;

  constructor(
    private esriAuthService: CommonEsriAuthService,
    private matSnackBar: MatSnackBar,
    private activatedRoute: ActivatedRoute,
    private basemapService: BaseMapChangeService,
    private buildingService: CommonBuildingService,
    private municipalityService: CommonMunicipalityService,
    private authState: AuthStateService,
    private wmtsCapabilitiesService: WmtsCapabilitiesService
  ) {
    this.municipality = new BehaviorSubject<number | null>(
      this.authState.getMunicipality() ?? DEFAULT_MUNICIPALITY
    );
    this.entranceId =
      this.activatedRoute.snapshot.queryParamMap.get('entranceId') ?? '';
    this.municipalityLayer = this.municipalityService.municipalityLayer;
    this.bldLayer = this.buildingService.bldLayer as FeatureLayer;
    (this.bldLayer.renderer as UniqueValueRenderer).uniqueValueInfos = [];
    (this.bldLayer.renderer as UniqueValueRenderer).defaultSymbol =
      new SimpleFillSymbol({
        color: 'rgba(119,119,119,0.25)',
        outline: {
          color: 'rgba(119,119,119,0.25)',
          width: 3,
        },
      });
    this.municipalityObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe(municipality => {
        if (municipality && municipality !== 99 && this.view) {
          void this.filterBuildingData(
            `BldMunicipality=${arcGisIntegerLiteral(municipality, 'municipality')}`
          );
        }
      });
  }

  public setMunicipality(municipality: number | null) {
    this.municipality.next(municipality);
  }

  public cleanup() {
    if (this.zoomVisibilityDebounce) {
      clearTimeout(this.zoomVisibilityDebounce);
      this.zoomVisibilityDebounce = null;
    }

    destroyMapSession(this.view, this.eventsCleanupCallbacks);
    this.view = undefined;
  }

  ngOnDestroy(): void {
    this.cleanup();
    this.destroy$.next();
    this.destroy$.complete();
    this.valueUpdate.complete();
    this.valueDelete.complete();
    this.municipality.complete();
  }

  public async initBuildingCreationMap(
    mapViewEl: ElementRef,
    entityType?: EntityType,
    editingGeometry?: EditableGeometry[]
  ) {
    const isReady = await firstValueFrom(
      this.esriAuthService.ensureEsriReady(1200, 'esri-auth-retry')
    );
    if (!isReady) {
      throw new Error('Map authentication failed');
    }

    const availableCreateTools = [];
    if (entityType === BUILDING_ENTITY && !editingGeometry?.length) {
      availableCreateTools.push('polygon');
    }
    if (entityType === ENTRANCE_ENTITY) {
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

  private async init(
    mapViewEl?: ElementRef,
    availableTools?: string[],
    editingGeometry?: EditableGeometry[],
    basemap?: __esri.Basemap | string
  ): Promise<MapView> {
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
      throw new Error('MapView element or available tools are not defined');
    }

    this.cleanup();

    this.graphicsLayer = new GraphicsLayer();
    const mainGraphic: Graphic | null = this.addExistingGraphics(
      this.editingGeometry,
      this.graphicsLayer
    );
    const layers: Array<GraphicsLayer | FeatureLayer> = [this.graphicsLayer];
    if (this.availableTools.includes('polygon')) {
      layers.push(this.bldLayer);
      layers.push(this.municipalityLayer);
    }
    const { view } = createMapSession(this.nativeElement, layers, {
      basemap,
    });
    this.view = view;

    this.maxZoomHide = await configureWmtsConstraints(
      this.view,
      this.wmtsCapabilitiesService
    );

    void this.view.when(() => {
      if (mainGraphic) {
        this.view!.goTo(mainGraphic);
      }
    });

    const zoomWatcher = this.view.watch('zoom', newZoom => {
      if (this.zoomVisibilityDebounce) {
        clearTimeout(this.zoomVisibilityDebounce);
      }
      this.zoomVisibilityDebounce = setTimeout(() => {
        if (!this.view?.map) {
          return;
        }
        this.bldLayer.visible =
          newZoom >= this.maxZoomHide ||
          !!(this.totalResults && this.totalResults < 1000);
      }, 500);
    });
    this.eventsCleanupCallbacks.push(() => {
      zoomWatcher.remove();
    });

    this.createSketch();
    if (this.municipality.value && this.municipality.value !== 99) {
      void this.filterBuildingData(
        `BldMunicipality=${arcGisIntegerLiteral(this.municipality.value, 'municipality')}`
      );
    }

    void this.basemapService.createBasemapChangeAction(
      this.view,
      this.reload.bind(this),
      this.eventsCleanupCallbacks
    );
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
            'lasso-selection': false,
          },
          settingsMenu: false,
        },
      } as SketchProperties);
      this.view.ui.add(sketch, 'top-right');
      this.registerCreateEvent(sketch);
      this.registerUpdateEvent(sketch);
      this.registerDeleteEvent(sketch);
      const createdGraphic = this.createdGraphic;
      if (createdGraphic) {
        setTimeout(() => {
          this.addExistingGraphics(
            [
              {
                ...createdGraphic.geometry!.toJSON(),
                id: createdGraphic.attributes.id,
                type: createdGraphic.geometry!.toJSON().rings
                  ? 'polygon'
                  : 'point',
              },
            ],
            sketch.layer
          );
        }, 100);
      }
    }
  }

  private reload(basemap: __esri.Basemap | string) {
    void this.init(undefined, undefined, undefined, basemap);
  }

  private registerDeleteEvent(sketch: Sketch) {
    const cleanup = sketch.on('delete', event => {
      if (event.graphics[0].attributes.id?.toString().startsWith('{')) {
        // stop the delete by adding back the graphic in the layer
        setTimeout(() => {
          this.addExistingGraphics(
            [
              {
                ...event.graphics[0].geometry!.toJSON(),
                id: event.graphics[0].attributes.id,
                type: event.graphics[0].geometry!.toJSON().rings
                  ? 'polygon'
                  : 'point',
              },
            ],
            sketch.layer
          );
        }, 100);
        this.matSnackBar.open(
          'You cannot delete already existing entities!',
          'Ok',
          {
            duration: 3000,
          }
        );
        return;
      }
      this.valueDelete.next({
        ...event.graphics[0].geometry!.toJSON(),
        id: event.graphics[0].attributes.id,
      });
      this.createdGraphic = null;

      const geometryType = event.graphics[0].geometry?.type;
      if (geometryType === 'polygon' || geometryType === 'point') {
        sketch.availableCreateTools = [geometryType];
      }
    });
    this.eventsCleanupCallbacks.push(() => {
      cleanup.remove();
    });
  }

  private registerUpdateEvent(sketch: Sketch) {
    const cleanup = sketch.on('update', event => {
      if (event.state === 'complete') {
        const geometry = event.graphics[0].geometry;
        const centroid = geometry
          ? this.getGeometryCentroid(geometry)
          : undefined;

        if (!geometry) {
          return;
        }
        const spatialReference = geometry.spatialReference.toJSON();

        this.valueUpdate.next({
          ...geometry.toJSON(),
          id: event.graphics[0].attributes.id,
          centroid: centroid,
          spatialReference: {
            latestWkid: spatialReference.latestWkid,
            wkid: spatialReference.wkid,
          },
        });
        const existingItemIndex = this.editingGeometry?.findIndex(
          el => el.id === event.graphics[0].attributes.id
        );
        if (existingItemIndex !== -1) {
          if (this.editingGeometry![existingItemIndex!].rings) {
            this.editingGeometry![existingItemIndex!].rings =
              geometry.toJSON().rings;
            this.editingGeometry![existingItemIndex!].spatialReference =
              geometry.toJSON().spatialReference;
          } else {
            this.editingGeometry![existingItemIndex!].x = geometry.toJSON().x;
            this.editingGeometry![existingItemIndex!].y = geometry.toJSON().y;
            this.editingGeometry![existingItemIndex!].spatialReference =
              geometry.toJSON().spatialReference;
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
    const cleanup = sketch.on('create', event => {
      if (event.state === 'complete') {
        const geometry = event.graphic.geometry;
        if (!geometry) {
          return;
        }
        const type = geometry.type;
        const id = type === 'polygon' ? null : 'New (' + Math.random() + ')';
        const centroid = this.getGeometryCentroid(geometry);
        const spatialReference = geometry.spatialReference.toJSON();
        this.valueUpdate.next({
          ...geometry.toJSON(),
          id: id,
          centroid: centroid,
          spatialReference: {
            latestWkid: spatialReference.latestWkid,
            wkid: spatialReference.wkid,
          },
        });
        event.graphic.attributes = {
          id: id,
        };
        this.createdGraphic = event.graphic;

        sketch.availableCreateTools =
          sketch.availableCreateTools?.filter(tool => tool !== type) ?? [];
      }
    });

    this.eventsCleanupCallbacks.push(() => {
      cleanup.remove();
    });
  }

  private addExistingGraphics(
    editingGeometry: EditableGeometry[] | undefined,
    graphicsLayer: GraphicsLayer
  ) {
    let mainGraphic: Graphic | null = null;

    editingGeometry?.forEach(g => {
      const geometry =
        g.type === 'point'
          ? new Point({
              x: g.x as number,
              y: g.y as number,
              spatialReference: g.spatialReference,
            })
          : new Polygon({
              rings: g.rings as number[][][],
              spatialReference: g.spatialReference,
            });

      const symbol =
        g.type === 'point'
          ? new SimpleMarkerSymbol({
              style: 'circle',
              outline: {
                width: '1px',
              },
              size: 6,
              color: this.entranceId === g.id ? 'blue' : 'red',
            })
          : new SimpleFillSymbol({
              style: 'forward-diagonal',
              outline: {
                width: '3px',
              },
            });
      const graphic = new Graphic({
        geometry,
        symbol,
        attributes: {
          id: g.id,
        },
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
      this.totalResults = extend.count;
      this.bldLayer.visible = extend.count < 1000;
      void this.view.goTo(
        extend.count !== 0
          ? extend.extent
          : {
              center: [19.818, 41.3285],
              zoom: 9,
            }
      );
    } catch (e) {
      console.log(e);
      void this.filterBuildingData(whereCondition, retires - 1);
    }
  }

  private getGeometryCentroid(geometry: __esri.Geometry) {
    if (geometry.type === 'polygon') {
      return (geometry as Polygon).centroid;
    }

    if (geometry.type === 'point') {
      const point = geometry as Point;
      return {
        latitude: point.latitude,
        longitude: point.longitude,
      };
    }

    return undefined;
  }
}
