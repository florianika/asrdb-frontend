import MapView from "@arcgis/core/views/MapView";
import WebMap from "@arcgis/core/WebMap";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine.js";
import {Injectable} from "@angular/core";
import Geometry from "@arcgis/core/geometry/Geometry";
import FeatureFilter from "@arcgis/core/layers/support/FeatureFilter";
import {CommonBuildingService} from "../../../service/common-building.service";
import {CommonEntranceService} from "../../../service/common-entrance.service";
import {RegisterFilterService} from "../../register-filter.service";

@Injectable()
export class FeatureSelectionService {

  private bldlayer;
  private entlayer;

  constructor(
    private buildingService: CommonBuildingService,
    private entranceService: CommonEntranceService,
    private registerFilterService: RegisterFilterService) {
    this.bldlayer = this.buildingService.bldLayer;
    this.entlayer = this.entranceService.entLayer;
  }

  createFeatureSelection(view: MapView, webmap: WebMap, eventsCleanupCallbacks: any[]) {
    const featureSelection = this.createSelectionButton();
    const eraseSelection = this.createEraseButton();

    const polygonGraphicsLayer = new GraphicsLayer();
    webmap.add(polygonGraphicsLayer);

    // create a new sketch view model set its layer
    const sketchViewModel = new SketchViewModel({
      view: view,
      layer: polygonGraphicsLayer
    });

    // Once user is done drawing a rectangle on the map
    // use the rectangle to select features on the map and table
    sketchViewModel.on("create", async (event) => {
      if (event.state === "complete") {
        // this polygon will be used to query features that intersect it
        const geometries = polygonGraphicsLayer.graphics.map(function (graphic) {
          return graphic.geometry;
        });
        const queryGeometry = await geometryEngine.union(geometries.toArray());
        await this.selectFeatures(view, queryGeometry);
      }
    });

    featureSelection.addEventListener("click", () => {
      view.closePopup();
      polygonGraphicsLayer.removeAll();
      sketchViewModel.create("rectangle");
    });
    eraseSelection.addEventListener("click", () => {
      polygonGraphicsLayer.removeAll();
      this.registerFilterService.setBuildingsGlobalIdFilter([]);
    });

    view.ui.add(featureSelection, "top-left");
    view.ui.add(eraseSelection, "top-left");
  }

  // This function is called when user completes drawing a rectangle
  // on the map. Use the rectangle to select features in the layer and table
  private async selectFeatures(view: MapView, geometry: Geometry) {
    if (view) {
      const query = this.bldlayer.createQuery();
      query.geometry = geometry;
      query.outFields = ['GlobalID'];
      const globalIds = (await (await this.bldlayer.queryFeatures(query)).toJSON())
        .features
        .map((o: any) => o.attributes['GlobalID']);
      this.registerFilterService.setBuildingsGlobalIdFilter(globalIds);
    }
  }

  private createSelectionButton() {
    const selection = document.createElement('div');
    const span = document.createElement('span');
    selection.id = "feature-selection";
    selection.className = "esri-widget esri-widget--button esri-widget esri-interactive";
    span.className = "esri-icon-checkbox-unchecked";
    selection.appendChild(span);
    return selection;
  }

  private createEraseButton() {
    const erase = document.createElement('div');
    const span = document.createElement('span');
    erase.id = "feature-selection";
    erase.className = "esri-widget esri-widget--button esri-widget esri-interactive";
    span.className = "esri-icon-erase";
    erase.appendChild(span);
    return erase;
  }
}

