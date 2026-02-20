import { Injectable } from '@angular/core';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { catchError, defer, from, Observable, of } from 'rxjs';
import { QueryFilter } from '../../register/model/query-filter';
import { CommonEsriAuthService } from './common-esri-auth.service';
import { environment } from 'src/environments/environment';
import { EntityManageResponse } from '../../register/model/entity-req-res';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EsriFeatureApiClientService } from './esri-feature-api-client.service';

@Injectable({
  providedIn: 'root',
})
export class CommonEntranceService {
  get entLayer(): FeatureLayer {
    const token = this.esriAuthService.getTokenForResource();
    return new FeatureLayer({
      title: $localize`ASRDB Entrances`,
      apiKey: token,
      url: environment.entrance_url,
      outFields: ['*'],
      minScale: 0,
      maxScale: 0,
      popupTemplate: {
        title: $localize`ASRDB Entrance {GlobalID}`,
      },
    });
  }

  constructor(
    private esriAuthService: CommonEsriAuthService,
    private esriFeatureApiClient: EsriFeatureApiClientService,
    private snackBar: MatSnackBar
  ) {}

  getEntranceData(filter?: Partial<QueryFilter>): Observable<any> {
    return defer(() => from(this.fetchEntranceData(filter)));
  }

  getAttributesMetadata() {
    return defer(() => from(this.fetchAttributesMetadata()));
  }

  createFeature(features: unknown[]): Observable<EntityManageResponse> {
    return this.esriFeatureApiClient.addFeatures<EntityManageResponse>(
      environment.entrance_url,
      this.esriAuthService.getTokenForResource(),
      features
    );
  }

  updateFeature(features: unknown[]): Observable<EntityManageResponse> {
    return this.esriFeatureApiClient.updateFeatures<EntityManageResponse>(
      environment.entrance_url,
      this.esriAuthService.getTokenForResource(),
      features
    );
  }

  resetStatus(entId: string, callback?: () => void) {
    const filter = {
      where: `GlobalID = '${entId}'`,
      outFields: ['GlobalID', 'OBJECTID'],
    } as Partial<QueryFilter>;
    this.getEntranceData(filter)
      .pipe(catchError(err => this.handleError(err)))
      .subscribe({
        next: res => this.handleResponse(res, callback),
        error: err => this.handleError(err),
      });
  }

  mergeEntrances(
    existingStreetId: string,
    foundStreetIds: string,
    callback?: (success: boolean) => void
  ) {
    this.getEntranceData({
      where: `EntStrGlobalID IN ('${existingStreetId}')`,
      start: 0,
      num: 20000,
      outFields: ['*'],
    })
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        if (!res?.data?.features) {
          console.log($localize`No features found with that EntStrGlobalID`);
          callback?.(false);
          return;
        }

        if (!res.data.features.length) {
          this.snackBar.open(
            $localize`No entrances found for this street. Deleting current street.`,
            $localize`Ok`,
            { duration: 3000 }
          );
          callback?.(true);
          return;
        }

        const updates = res.data.features.map((f: any) => {
          f.attributes.EntStrGlobalID = foundStreetIds;
          return f;
        });

        this.updateFeature(updates).subscribe({
          next: (response: EntityManageResponse) => {
            const responseData =
              response['addResults']?.[0] ?? response['updateResults']?.[0];
            if (!responseData?.success) {
              this.snackBar.open(
                $localize`Could not update value`,
                $localize`Ok`,
                { duration: 3000 }
              );
              callback?.(false);
              return;
            }
            callback?.(true);
          },
          error: err => {
            this.handleError(err);
            callback?.(false);
          },
        });
      });
  }

  private handleResponse(res: any, callback?: () => void) {
    const [attributes] = res.data.features.map((f: any) => f.attributes);
    const object = {
      GlobalID: attributes.GlobalID,
      OBJECTID: attributes.OBJECTID,
      EntQuality: 9,
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
      const layer = this.entLayer;
      const dataQuery = layer.createQuery();
      dataQuery.start = 0;
      dataQuery.num = 1;
      dataQuery.outFields = ['*'];
      dataQuery.outStatistics = [];
      dataQuery.returnGeometry = false;
      const features = await (await layer.queryFeatures(dataQuery)).toJSON();
      return features.fields;
    });
  }

  private async fetchEntranceData(
    filter?: Partial<QueryFilter>
  ): Promise<{ count: number; data: any } | null> {
    try {
      return await this.esriAuthService.withEsriRetry(async () => {
        const layer = this.entLayer;
        const query = layer.createQuery();
        query.start = filter?.start ?? 0;
        query.num = filter?.num ?? 5;
        query.where = filter?.where ?? '1=1';
        query.outFields = filter?.outFields ?? ['*'];
        query.returnGeometry = filter?.returnGeometry ?? false;
        query.orderByFields = filter?.orderByFields ?? ['EntBuildingNumber'];
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
