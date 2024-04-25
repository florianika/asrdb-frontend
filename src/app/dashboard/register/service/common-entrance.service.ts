import {Injectable} from '@angular/core';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import {catchError, defer, from, Observable, of} from 'rxjs';
import {QueryFilter} from '../model/query-filter';
import {CommonEsriAuthService} from './common-esri-auth.service';
import {environment} from 'src/environments/environment';
import {EntityManageResponse} from '../model/entity-req-res';
import {HttpClient} from '@angular/common/http';
import {MatSnackBar} from "@angular/material/snack-bar";

@Injectable({
  providedIn: 'root'
})
export class CommonEntranceService {

  get entLayer(): FeatureLayer {
    const token = this.esriAuthService.getTokenForResource();
    return new FeatureLayer({
      title: 'ASRDB Entrances',
      apiKey: token,
      url: environment.entrance_url + '?token='
        + token,
      outFields: ['*'],
      minScale: 0,
      maxScale: 0,
      // create a new popupTemplate for the layer
      popupTemplate: {
        // autocasts as new PopupTemplate()
        title: 'ASRDB Entrance {GlobalID}',
      }
    });
  }

  constructor(
    private esriAuthService: CommonEsriAuthService,
    private httpClient: HttpClient,
    private snackBar: MatSnackBar,) {
  }

  getEntranceData(filter?: Partial<QueryFilter>): Observable<any> {
    return defer(() => from(this.fetchEntranceData(filter)));
  }

  getAttributesMetadata() {
    return defer(() => from(this.fetchAttributesMetadata()));
  }

  createFeature(features: any[]): Observable<EntityManageResponse> {
    const addFeatureLayerURL = environment.entrance_url
    + '/addFeatures?token='
    + this.esriAuthService.getTokenForResource();
    const body = this.createRequestBody(features);
    return this.httpClient.post<EntityManageResponse>(addFeatureLayerURL, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  }

  updateFeature(features: any[]): Observable<EntityManageResponse> {
    const addFeatureLayerURL = environment.entrance_url
    + '/updateFeatures'
    + '?token=' + this.esriAuthService.getTokenForResource();
    const body = this.createRequestBody(features);
    return this.httpClient.post<EntityManageResponse>(addFeatureLayerURL, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  }

  resetStatus(entId: string, callback?: () => void) {
    const filter = {
      where: `GlobalID = '${entId}'`,
      outFields: ['GlobalID', 'OBJECTID']
    } as Partial<QueryFilter>
    this.getEntranceData(filter)
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
      EntQuality: 9
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
    const dataQuery = this.entLayer.createQuery();
    dataQuery.start = 0;
    dataQuery.num = 1;
    dataQuery.outFields = ['*'];
    dataQuery.outStatistics = [];
    dataQuery.returnGeometry = false;
    const features = await (await this.entLayer.queryFeatures(dataQuery)).toJSON();
    return features.fields;
  }

  private async fetchEntranceData(filter?: Partial<QueryFilter>): Promise<{count: number, data: any} | null> {
    const query = this.entLayer.createQuery();
    query.start = filter?.start ?? 0;
    query.num = filter?.num ?? 5;
    query.where = filter?.where ?? '1=1';
    query.outFields = filter?.outFields ?? ['*'];
    query.returnGeometry = filter?.returnGeometry ?? false;
    query.orderByFields = filter?.orderByFields ?? ['EntBuildingNumber'];
    query.outStatistics = [];

    try {
      const featureCount = await this.entLayer.queryFeatureCount(query);
      const features = await (await this.entLayer.queryFeatures(query)).toJSON();

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
