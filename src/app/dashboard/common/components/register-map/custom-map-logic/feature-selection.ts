import MapView from '@arcgis/core/views/MapView';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel';
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine.js';
import { Injectable } from '@angular/core';
import Geometry from '@arcgis/core/geometry/Geometry';
import { CommonBuildingService } from '../../../service/common-building.service';
import { CommonEntranceService } from '../../../service/common-entrance.service';
import { RegisterFilterService } from '../../../../register/register-table-view/register-filter.service';
import Map from '@arcgis/core/Map';
import { CommonEsriAuthService } from '../../../service/common-esri-auth.service';

@Injectable()
export class FeatureSelectionService {
  constructor(
    private buildingService: CommonBuildingService,
    private entranceService: CommonEntranceService,
    private registerFilterService: RegisterFilterService,
    private esriAuthService: CommonEsriAuthService
  ) {}

  createFeatureSelection(
    view: MapView,
    webmap: Map,
    eventsCleanupCallbacks: any[]
  ) {
    const featureSelection = this.createSelectionButton();
    const eraseSelection = this.createEraseButton();

    const polygonGraphicsLayer = new GraphicsLayer();
    webmap.add(polygonGraphicsLayer);

    const sketchViewModel = new SketchViewModel({
      view: view,
      layer: polygonGraphicsLayer,
    });

    const unsubscribe = sketchViewModel.on('create', async event => {
      if (event.state === 'complete') {
        const geometries = polygonGraphicsLayer.graphics.map(
          graphic => graphic.geometry
        );
        const queryGeometry = await geometryEngine.union(geometries.toArray());
        await this.selectFeatures(view, queryGeometry);
        polygonGraphicsLayer.removeAll();
      }
    });
    eventsCleanupCallbacks.push(() => unsubscribe.remove());

    const featureSelectionListener = () => {
      view.closePopup();
      polygonGraphicsLayer.removeAll();
      sketchViewModel.create('rectangle');
    };
    featureSelection.addEventListener('click', featureSelectionListener);
    eventsCleanupCallbacks.push(() =>
      featureSelection.removeEventListener('click', featureSelectionListener)
    );

    const eraseSelectionListener = () => {
      polygonGraphicsLayer.removeAll();
      this.registerFilterService.setBuildingsGlobalIdFilter([]);
    };
    eraseSelection.addEventListener('click', eraseSelectionListener);
    eventsCleanupCallbacks.push(() =>
      eraseSelection.removeEventListener('click', eraseSelectionListener)
    );

    view.ui.add(featureSelection, 'top-left');
    view.ui.add(eraseSelection, 'top-left');
  }

  private async selectFeatures(view: MapView, geometry: Geometry) {
    if (view) {
      const globalIds = await this.esriAuthService.withEsriRetry(async () => {
        const bldLayer = this.buildingService.bldLayer;
        const query = bldLayer.createQuery();
        query.geometry = geometry;
        query.outFields = ['GlobalID'];
        query.where = this.registerFilterService.prepareWhereCase();
        return (
          await (await bldLayer.queryFeatures(query)).toJSON()
        ).features.map((o: any) => o.attributes['GlobalID']);
      });
      if (globalIds.length) {
        this.registerFilterService.setBuildingsGlobalIdFilter(globalIds);
      }
    }
  }

  private createSelectionButton() {
    const selection = document.createElement('div');
    const span = document.createElement('span');
    selection.id = 'feature-selection';
    selection.className =
      'esri-widget esri-widget--button esri-widget esri-interactive';
    selection.title = $localize`Select buildings`;
    span.className = 'esri-icon-checkbox-unchecked';
    selection.appendChild(span);
    return selection;
  }

  private createEraseButton() {
    const erase = document.createElement('div');
    const span = document.createElement('span');
    erase.id = 'feature-selection-erase';
    erase.className =
      'esri-widget esri-widget--button esri-widget esri-interactive';
    erase.title = $localize`Erase selection`;
    span.className = 'esri-icon-erase';
    erase.appendChild(span);
    return erase;
  }
}
