import {Injectable} from '@angular/core';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import {environment} from 'src/environments/environment';
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";

@Injectable({
  providedIn: 'root',
})
export class CommonMunicipalityService {

  get municipalityLayer(): FeatureLayer {
    const lineSymbol = new SimpleLineSymbol({
      color: [0, 0, 139, 1], // RGBA Red
      width: 1,
      style: "solid"
    });

    const lineRenderer = new SimpleRenderer({
      symbol: lineSymbol
    });

    return new FeatureLayer({
      title: 'ASRDB Municipality',
      url: environment.municipality_url,
      outFields: ['*'],
      renderer: lineRenderer
    });
  }

  constructor() {}
}
