import { Injectable } from '@angular/core';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { Observable, defer, from, catchError, of } from 'rxjs';
import { QueryFilter } from '../../register/model/query-filter';
import { CommonEsriAuthService } from './common-esri-auth.service';
import { environment } from 'src/environments/environment';
import { EntityManageResponse } from '../../register/model/entity-req-res';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EsriFeatureApiClientService } from './esri-feature-api-client.service';
import { arcGisGlobalIdEquals } from '../helper/arcgis-query';

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
    private esriFeatureApiClient: EsriFeatureApiClientService,
    private snackBar: MatSnackBar
  ) {}

  getDwellings(filter?: Partial<QueryFilter>): Observable<any> {
    return defer(() => from(this.fetchDwellingsData(filter)));
  }

  getAttributesMetadata() {
    return defer(() => from(this.fetchAttributesMetadata()));
  }

  createFeature(features: unknown[]): Observable<EntityManageResponse> {
    return this.esriFeatureApiClient.addFeatures<EntityManageResponse>(
      environment.dwelling_url,
      this.esriAuthService.getTokenForResource(),
      features
    );
  }

  updateFeature(features: unknown[]): Observable<EntityManageResponse> {
    return this.esriFeatureApiClient.updateFeatures<EntityManageResponse>(
      environment.dwelling_url,
      this.esriAuthService.getTokenForResource(),
      features
    );
  }

  resetStatus(dwlId: string, callback?: () => void) {
    const filter = {
      where: arcGisGlobalIdEquals('GlobalID', dwlId),
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
          this.snackBar.open($localize`Could not update value`, $localize`Ok`, {
            duration: 3000,
          });
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
}
