import { Injectable } from '@angular/core';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { Observable, defer, from } from 'rxjs';
import { QueryFilter } from '../model/query-filter';
import { CommonEsriAuthService } from './common-esri-auth.service';
import { environment } from 'src/environments/environment';
import { EntityManageResponse } from '../model/entity-req-res';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CommonDwellingService {

  get dwlLayer(): FeatureLayer {
    return new FeatureLayer({
      title: 'ASRDB Dwellings',
      url: environment.dwelling_url,
      outFields: ['*'],
      minScale: 0,
      maxScale: 0,
      // create a new popupTemplate for the layer
      popupTemplate: {
        // autocasts as new PopupTemplate()
        title: 'ASRDB Dwelling {GlobalID}',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed porttitor mi nec urna rutrum maximus. Maecenas vulputate rutrum ex, sed vulputate odio finibus quis. Sed sed sapien sed arcu facilisis sollicitudin in eu mi.'
      }
    });
  }

  constructor(private esriAuthService: CommonEsriAuthService, private httpClient: HttpClient) {
  }

  getDwellings(filter?: Partial<QueryFilter>): Observable<any> {
    return defer(() => from(this.fetchDwellingsData(filter)));
  }

  getAttributesMetadata() {
    return defer(() => from(this.fetchAttributesMetadata()));
  }

  createFeature(features: any): Observable<EntityManageResponse> {
    const addFeatureLayerURL = environment.dwelling_url
    + '/addFeatures?token='
    + this.esriAuthService.getTokenForResource(environment.dwelling_url);
    return this.httpClient.post<EntityManageResponse>(addFeatureLayerURL, JSON.stringify({ features, format: 'json' }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  updateFeature(features: any): Observable<EntityManageResponse> {
    const addFeatureLayerURL = environment.dwelling_url
    + '/updateFeatures?token='
    + this.esriAuthService.getTokenForResource(environment.dwelling_url);
    return this.httpClient.post<EntityManageResponse>(addFeatureLayerURL, JSON.stringify({ features, format: 'json' }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  private async fetchAttributesMetadata() {
    const dataQuery = this.dwlLayer.createQuery();
    dataQuery.start = 0;
    dataQuery.num = 1;
    dataQuery.outFields = ['*'];
    dataQuery.where = '1=1';
    dataQuery.returnGeometry = false;
    dataQuery.outStatistics = [];
    const features = await (await this.dwlLayer.queryFeatures(dataQuery)).toJSON();
    return features.fields;
  }

  private async fetchDwellingsData(filter?: Partial<QueryFilter>): Promise<{count: number, data: any} | null> {
    const query = this.dwlLayer.createQuery();
    query.start = filter?.start ?? 0;
    query.num = filter?.num ?? 5;
    query.where = filter?.where ?? '1=1';
    query.outFields = filter?.outFields ?? ['*'];
    query.returnGeometry = false;
    query.orderByFields = filter?.orderByFields ?? ['DwlFloor'];
    query.outStatistics = [];

    try {
      const featureCount = await this.dwlLayer.queryFeatureCount(query);
      const features = await (await this.dwlLayer.queryFeatures(query)).toJSON();

      return {
        count: featureCount,
        data: features
      };
    } catch (e) {
      return null;
    }
  }
}
