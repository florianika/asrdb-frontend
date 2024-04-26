import { Injectable } from '@angular/core';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import {Observable, defer, from, catchError, of} from 'rxjs';
import { QueryFilter } from '../../register/model/query-filter';
import { CommonEsriAuthService } from './common-esri-auth.service';
import { environment } from 'src/environments/environment';
import { EntityManageResponse } from '../../register/model/entity-req-res';
import { HttpClient } from '@angular/common/http';
import {MatSnackBar} from "@angular/material/snack-bar";

@Injectable({
  providedIn: 'root'
})
export class CommonDwellingService {

  get dwlLayer(): FeatureLayer {
    const token = this.esriAuthService.getTokenForResource();
    return new FeatureLayer({
      title: 'ASRDB Dwellings',
      apiKey: token,
      url: environment.dwelling_url + '?token='
        + token,
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

  constructor(
    private esriAuthService: CommonEsriAuthService,
    private httpClient: HttpClient,
    private snackBar: MatSnackBar) {
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
    + this.esriAuthService.getTokenForResource();
    const body = this.createRequestBody(features);
    return this.httpClient.post<EntityManageResponse>(addFeatureLayerURL, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  }

  updateFeature(features: any): Observable<EntityManageResponse> {
    const addFeatureLayerURL = environment.dwelling_url
    + '/updateFeatures?token='
    + this.esriAuthService.getTokenForResource();
    const body = this.createRequestBody(features);
    return this.httpClient.post<EntityManageResponse>(addFeatureLayerURL, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  }

  resetStatus(dwlId: string, callback?: () => void) {
    const filter = {
      where: `GlobalID = '${dwlId}'`,
      outFields: ['GlobalID', 'OBJECTID']
    } as Partial<QueryFilter>
    this.getDwellings(filter)
      .pipe(catchError((err: any) => {
        return this.handleError(err);
      }))
      .subscribe({
        next: (res: any) => {
          this.handleResponse(res, callback);
        },
        error: (err: any) => {
          return this.handleError(err);
        }
      });
  }

  private handleResponse(res: any, callback?: () => void) {
    const [attributes] = res.data.features.map((field: any) => field.attributes);
    const object = {
      GlobalID: attributes.GlobalID,
      OBJECTID: attributes.OBJECTID,
      DwlQuality: 9
    }
    this.updateFeature([{
      attributes: object
    }]).subscribe({
      next: (response: EntityManageResponse) => {
        const responseData = response['addResults']?.[0] ?? response['updateResults']?.[0];
        if (!responseData?.success) {
          this.snackBar.open('Could not update value', 'Ok', {
            duration: 3000
          });
          return;
        }
        callback?.();
      },
      error: (err: any) => {
        return this.handleError(err);
      }
    });
  }

  private handleError(err: any) {
    console.error(err);
    return of(null);
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

  private createRequestBody(features: any[]) {
    const data = [];
    data.push(encodeURIComponent('features') + '=' + encodeURIComponent(JSON.stringify(features)));
    data.push(encodeURIComponent('f') + '=' + encodeURIComponent('json'));
    return data.join('&');
  }
}
