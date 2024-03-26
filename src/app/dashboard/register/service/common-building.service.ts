import {Injectable} from '@angular/core';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import {defer, from, Observable} from 'rxjs';
import {QueryFilter} from '../model/query-filter';
import {CommonEsriAuthService} from './common-esri-auth.service';
import {HttpClient} from '@angular/common/http';
import {environment} from 'src/environments/environment';
import {EntityManageResponse} from '../model/entity-req-res';
import MapView from "@arcgis/core/views/MapView";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine.js";
import Collection from "@arcgis/core/core/Collection";
import Geometry from "@arcgis/core/geometry/Geometry";

@Injectable({
  providedIn: 'root'
})
export class CommonBuildingService {

  uniqueValueInfos = [
    {
      value: 1,
      label: 'Permitted (linked to a construction permission)',
      symbol: this.getSymbol('#00BF7')
    },
    {
      value: 2,
      label: 'Under construction (linked to a construction permission)',
      symbol: this.getSymbol('#00B4C5')
    },
    {
      value: 3,
      label: 'Completed (linked to a construction permission)',
      symbol: this.getSymbol('#5BA300')
    },
    {
      value: 4,
      label: 'Existing',
      symbol: this.getSymbol('#89CE00')
    },
    {
      value: 5,
      label: 'Abandoned (residential and non-residential use excluded)',
      symbol: this.getSymbol('#E6308A')
    },
    {
      value: 6,
      label: 'Demolished (not existing anymore)',
      symbol: this.getSymbol('#B51963')
    },
    {
      value: 9,
      label: 'Unknown building status',
      symbol: this.getSymbol('#F57600')
    }
  ];

  get bldLayer(): FeatureLayer {
    return new FeatureLayer({
      title: 'ASRDB Buildings',
      url: environment.building_url,
      outFields: ['*'],
      renderer: {
        type: 'unique-value', // autocasts as new UniqueValueRenderer()
        defaultSymbol: this.getSymbol('#FAFAFA'),
        defaultLabel: 'Other',
        field: 'BldStatus',
        uniqueValueInfos: this.uniqueValueInfos
      } as __esri.RendererProperties,
      minScale: 0,
      maxScale: 0,
      // create a new popupTemplate for the layer
      popupTemplate: {
        // autocasts as new PopupTemplate()
        title: 'ASRDB Building {GlobalID}',
        content: [
          {
            // It is also possible to set the fieldInfos outside of the content
            // directly in the popupTemplate. If no fieldInfos is specifically set
            // in the content, it defaults to whatever may be set within the popupTemplate.
            type: 'fields',
            fieldInfos: [
              {
                fieldName: 'BldStatus',
                label: 'Status'
              }, {
                fieldName: 'BldEntranceRecs',
                label: 'Number of recorded entrances'
              }, {
                fieldName: 'BldDwellingRecs',
                label: 'Number of recorded dwellings'
              }
            ]
          }
        ]
      }
    });
  }

  constructor(private esriAuthService: CommonEsriAuthService, private httpClient: HttpClient) {
  }

  getSymbol(color: string) {
    return {
      type: 'simple-fill', // autocasts as new SimpleFillSymbol()
      color: color,
      outline: {
        // autocasts as new SimpleLineSymbol()
        color: color,
        width: 1
      }
    };
  }

  getBuildingData(filter?: Partial<QueryFilter>): Observable<any> {
    return defer(() => from(this.fetchBuildingData(filter)));
  }

  getAttributesMetadata() {
    return defer(() => from(this.fetchAttributesMetadata()));
  }

  createFeature(features: any): Observable<EntityManageResponse> {
    const addFeatureLayerURL = environment.building_url
    + '/addFeatures?token='
    + this.esriAuthService.getTokenForResource(environment.building_url);
    const body = this.createRequestBody(features);
    return this.httpClient.post<EntityManageResponse>(addFeatureLayerURL, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  }

  updateFeature(features: any): Observable<EntityManageResponse> {
    const addFeatureLayerURL = environment.building_url
    + '/updateFeatures?token='
    + this.esriAuthService.getTokenForResource(environment.building_url);
    const body = this.createRequestBody(features);
    return this.httpClient.post<EntityManageResponse>(addFeatureLayerURL, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  }

  // This function is called when user completes drawing a rectangle
  // on the map. Use the rectangle to select features in the layer and table
  async checkIntersectingBuildings(view: MapView, geometries: Collection<Geometry>) {
    const query = this.bldLayer.createQuery();
    query.geometry = await geometryEngine.union(geometries.toArray());
    query.outFields = ['GlobalID'];
    return (await (await this.bldLayer.queryFeatures(query)).toJSON())
      .features
      .map((o: any) => o.attributes['GlobalID'])
      .length;
  }

  private async fetchAttributesMetadata() {
    const dataQuery = this.bldLayer.createQuery();
    dataQuery.start = 0;
    dataQuery.num = 1;
    dataQuery.outFields = ['*'];
    dataQuery.outStatistics = [];
    dataQuery.returnGeometry = false;
    const features = await (await this.bldLayer.queryFeatures(dataQuery)).toJSON();
    return features.fields;
  }

  private async fetchBuildingData(filter?: Partial<QueryFilter>): Promise<{ count: number, data: any, globalIds: string[] } | null> {
    const dataQuery = this.bldLayer.createQuery();
    dataQuery.start = filter?.start ?? 0;
    dataQuery.num = filter?.num ?? 5;
    dataQuery.where = filter?.where ?? '1=1';
    dataQuery.outFields = filter?.outFields ?? ['*'];
    dataQuery.returnGeometry = filter?.returnGeometry ?? false;
    dataQuery.orderByFields = filter?.orderByFields ?? ['BldStatus'];
    dataQuery.outStatistics = [];

    const globalIdQuery = this.bldLayer.createQuery();
    globalIdQuery.where = filter?.where ?? '1=1';
    globalIdQuery.outFields = ['GlobalID'];
    globalIdQuery.returnGeometry = false;
    globalIdQuery.outStatistics = [];

    try {
      const featureCount = await this.bldLayer.queryFeatureCount(dataQuery);
      const features = await (await this.bldLayer.queryFeatures(dataQuery)).toJSON();
      const globalIds = (await (await this.bldLayer.queryFeatures(globalIdQuery)).toJSON()).features.map((o: any) => o.attributes['GlobalID']);

      return {
        count: featureCount,
        data: features,
        globalIds
      };
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  private createRequestBody(features: any[]) {
    const data = [];
    data.push(encodeURIComponent('features') + '=' + encodeURIComponent(JSON.stringify(features)));
    data.push(encodeURIComponent('f') + '=' + encodeURIComponent('json'));
    return data.join('&');
  }
}
