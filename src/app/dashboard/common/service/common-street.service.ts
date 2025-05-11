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
export class CommonStreetService {

  get strLayer(): FeatureLayer {
    const token = this.esriAuthService.getTokenForResource();
    return new FeatureLayer({
      title: 'ASRDB Streets',
      apiKey: token,
      url: environment.street_url + '?token='
        + token,
      outFields: ['*'],
      minScale: 0,
      maxScale: 0,
      // create a new popupTemplate for the layer
      popupTemplate: {
        // autocasts as new PopupTemplate()
        title: 'ASRDB Street {GlobalID}',
        content: ''
      }
    });
  }

  constructor(
    private esriAuthService: CommonEsriAuthService,
    private httpClient: HttpClient,
    private snackBar: MatSnackBar) {
  }

  getStreets(filter?: Partial<QueryFilter>): Observable<any> {
    return defer(() => from(this.fetchStreetsData(filter)));
  }

  getAllStreetsForMunicipality(filter?: Partial<QueryFilter>): Observable<any> {
    return defer(() => from(this.fetchAllStreetsForMunicipality(filter)));
  }

  getAttributesMetadata() {
    return defer(() => from(this.fetchAttributesMetadata()));
  }

  createFeature(features: any): Observable<EntityManageResponse> {
    const addFeatureLayerURL = environment.street_url
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
    const addFeatureLayerURL = environment.street_url
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
    this.getStreets(filter)
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
      OBJECTID: attributes.OBJECTID
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
    const dataQuery = this.strLayer.createQuery();
    dataQuery.start = 0;
    dataQuery.num = 1;
    dataQuery.outFields = ['*'];
    dataQuery.where = '1=1';
    dataQuery.returnGeometry = false;
    dataQuery.outStatistics = [];
    const features = await (await this.strLayer.queryFeatures(dataQuery)).toJSON();
    return features.fields;
  }



  private async fetchAllStreetsForMunicipality(filter?: Partial<QueryFilter>): Promise<{data: any} | null> {
    const query = this.strLayer.createQuery();
    query.start = 0;
    query.num = 999;
    query.where = filter?.where ?? '1=1';
    query.outFields = ['GlobalID', 'StrNameCore', 'StrMunicipality'];
    query.returnGeometry = false;
    query.orderByFields = ['OBJECTID'];
    query.outStatistics = [];

    try {
      const features = await (await this.strLayer.queryFeatures(query)).toJSON();

      return {
        data: features
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  private async fetchStreetsData(filter?: Partial<QueryFilter>): Promise<{count: number, data: any} | null> {
    const query = this.strLayer.createQuery();
    query.start = filter?.start ?? 0;
    query.num = filter?.num ?? 10;
    query.where = filter?.where ?? '1=1';
    query.outFields = filter?.outFields ?? ['*'];
    query.returnGeometry = false;
    query.orderByFields = filter?.orderByFields ?? ['OBJECTID'];
    query.outStatistics = [];

    try {
      const featureCount = await this.strLayer.queryFeatureCount(query);
      const features = await (await this.strLayer.queryFeatures(query)).toJSON();

      return {
        count: featureCount,
        data: features
      };
    } catch (e) {
      console.error(e);
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
