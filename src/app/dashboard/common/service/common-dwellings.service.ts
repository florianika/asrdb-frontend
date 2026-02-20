import { Injectable } from '@angular/core';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { Observable, defer, from, catchError, of } from 'rxjs';
import { QueryFilter } from '../../register/model/query-filter';
import { CommonEsriAuthService } from './common-esri-auth.service';
import { environment } from 'src/environments/environment';
import { EntityManageResponse } from '../../register/model/entity-req-res';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class CommonDwellingService {
  get dwlLayer(): FeatureLayer {
    const token = this.esriAuthService.getTokenForResource();
    return new FeatureLayer({
      title: $localize`ASRDB Dwellings`,
      apiKey: token,
      url: environment.dwelling_url,
      outFields: ['*'],
      minScale: 0,
      maxScale: 0,
      popupTemplate: {
        title: $localize`ASRDB Dwelling {GlobalID}`,
      },
    });
  }

  constructor(
    private esriAuthService: CommonEsriAuthService,
    private httpClient: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  getDwellings(filter?: Partial<QueryFilter>): Observable<any> {
    return defer(() => from(this.fetchDwellingsData(filter)));
  }

  getAttributesMetadata() {
    return defer(() => from(this.fetchAttributesMetadata()));
  }

  createFeature(features: any): Observable<EntityManageResponse> {
    const url = `${environment.dwelling_url}/addFeatures?token=${this.esriAuthService.getTokenForResource()}`;
    const body = this.createRequestBody(features);
    return this.httpClient.post<EntityManageResponse>(url, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  updateFeature(features: any): Observable<EntityManageResponse> {
    const url = `${environment.dwelling_url}/updateFeatures?token=${this.esriAuthService.getTokenForResource()}`;
    const body = this.createRequestBody(features);
    return this.httpClient.post<EntityManageResponse>(url, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  resetStatus(dwlId: string, callback?: () => void) {
    const filter = {
      where: `GlobalID = '${dwlId}'`,
      outFields: ['GlobalID', 'OBJECTID'],
    } as Partial<QueryFilter>;
    this.getDwellings(filter)
      .pipe(catchError(err => this.handleError(err)))
      .subscribe({
        next: res => this.handleResponse(res, callback),
        error: err => this.handleError(err),
      });
  }

  private handleResponse(res: any, callback?: () => void) {
    const [attributes] = res.data.features.map(
      (field: any) => field.attributes
    );
    const object = {
      GlobalID: attributes.GlobalID,
      OBJECTID: attributes.OBJECTID,
      DwlQuality: 9,
    };
    this.updateFeature([{ attributes: object }]).subscribe({
      next: response => {
        const responseData =
          response['addResults']?.[0] ?? response['updateResults']?.[0];
        if (!responseData?.success) {
          this.snackBar.open(
            $localize`Could not update value`,
            $localize`Ok`,
            { duration: 3000 }
          );
          return;
        }
        callback?.();
      },
      error: err => this.handleError(err),
    });
  }

  private handleError(err: any) {
    console.error(err);
    return of(null);
  }

  private async fetchAttributesMetadata() {
    return this.esriAuthService.withEsriRetry(async () => {
      const layer = this.dwlLayer;
      const dataQuery = layer.createQuery();
      dataQuery.start = 0;
      dataQuery.num = 1;
      dataQuery.outFields = ['*'];
      dataQuery.where = '1=1';
      dataQuery.returnGeometry = false;
      dataQuery.outStatistics = [];
      const features = await (await layer.queryFeatures(dataQuery)).toJSON();
      return features.fields;
    });
  }

  private async fetchDwellingsData(
    filter?: Partial<QueryFilter>
  ): Promise<{ count: number; data: any } | null> {
    try {
      return await this.esriAuthService.withEsriRetry(async () => {
        const layer = this.dwlLayer;
        const query = layer.createQuery();
        query.start = filter?.start ?? 0;
        query.num = filter?.num ?? 5;
        query.where = filter?.where ?? '1=1';
        query.outFields = filter?.outFields ?? ['*'];
        query.returnGeometry = false;
        query.orderByFields = filter?.orderByFields ?? ['DwlFloor'];
        query.outStatistics = [];
        const featureCount = await layer.queryFeatureCount(query);
        const features = await (await layer.queryFeatures(query)).toJSON();
        return { count: featureCount, data: features };
      });
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  private createRequestBody(features: any[]) {
    const data = [];
    data.push(
      encodeURIComponent('features') +
        '=' +
        encodeURIComponent(JSON.stringify(features))
    );
    data.push(encodeURIComponent('f') + '=' + encodeURIComponent('json'));
    return data.join('&');
  }
}
