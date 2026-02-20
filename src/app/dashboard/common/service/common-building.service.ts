import { Injectable } from '@angular/core';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { catchError, defer, from, map, Observable, of } from 'rxjs';
import { QueryFilter } from '../../register/model/query-filter';
import { CommonEsriAuthService } from './common-esri-auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { EntityManageResponse } from '../../register/model/entity-req-res';
import MapView from '@arcgis/core/views/MapView';
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine.js';
import Collection from '@arcgis/core/core/Collection';
import Geometry from '@arcgis/core/geometry/Geometry';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthStateService } from '../../../common/services/auth-state.service';
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer';
import UniqueValueInfoProperties = __esri.UniqueValueInfoProperties;
import PopupTemplateProperties = __esri.PopupTemplateProperties;

type EntityDataResponse = { count: number; data: any; globalIds: string[] };

@Injectable({
  providedIn: 'root',
})
export class CommonBuildingService {
  uniqueValueInfos = [
    {
      value: 1,
      label: $localize`Leja e ndërtimit e lëshuar`,
      symbol: this.getSymbol('#89CE00'),
    },
    {
      value: 2,
      label: $localize`Në ndërtim`,
      symbol: this.getSymbol('#5BA300'),
    },
    {
      value: 4,
      label: $localize`Ekzistuese`,
      symbol: this.getSymbol('#B51963'),
    },
    {
      value: 5,
      label: $localize`E rrënuar`,
      symbol: this.getSymbol('#F57600'),
    },
    {
      value: 6,
      label: $localize`E shkatërruar / nuk ekziston më`,
      symbol: this.getSymbol('rgba(145,145,145,0.53)'),
    },
  ] as UniqueValueInfoProperties[];

  get bldLayer(): FeatureLayer {
    const token = this.esriAuthService.getTokenForResource();
    return new FeatureLayer({
      title: $localize`ASRDB Buildings`,
      apiKey: token,
      url: environment.building_url,
      outFields: ['GlobalID'],
      renderer: new UniqueValueRenderer({
        field: 'BldStatus',
        uniqueValueInfos: this.uniqueValueInfos as UniqueValueInfoProperties[],
      }),
      legendEnabled: true,
      popupTemplate: {
        title: $localize`ASRDB Building {GlobalID}`,
        content: [
          {
            type: 'fields',
            fieldInfos: [
              {
                fieldName: 'BldStatus',
                label: $localize`Status`,
              },
              {
                fieldName: 'BldEntranceRecs',
                label: $localize`Number of recorded entrances`,
              },
              {
                fieldName: 'BldDwellingRecs',
                label: $localize`Number of recorded dwellings`,
              },
            ],
          },
        ],
      } as PopupTemplateProperties,
    });
  }

  constructor(
    private esriAuthService: CommonEsriAuthService,
    private authState: AuthStateService,
    private httpClient: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  getSymbol(color: string) {
    return {
      type: 'simple-fill',
      color: 'transparent',
      outline: { color: color, width: 3 },
    };
  }

  getBuildingMunicipality(buildingId: string): Observable<any> {
    return defer(() => from(this.fetchBuildingMunicipality(buildingId)));
  }

  getBuildingData(
    filter?: Partial<QueryFilter>
  ): Observable<EntityDataResponse | null> {
    return defer(() => from(this.fetchBuildingData(filter)));
  }

  getBuildingStats(filter: Partial<QueryFilter>): Observable<any> {
    return defer(() => from(this.getStats(filter)));
  }

  getAttributesMetadata() {
    return defer(() => from(this.fetchAttributesMetadata()));
  }

  createFeature(features: any): Observable<EntityManageResponse> {
    const url = `${environment.building_url}/addFeatures?token=${this.esriAuthService.getTokenForResource()}`;
    const body = this.createRequestBody(features);
    return this.httpClient.post<EntityManageResponse>(url, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  updateFeature(features: any): Observable<EntityManageResponse> {
    const url = `${environment.building_url}/updateFeatures?token=${this.esriAuthService.getTokenForResource()}`;
    const body = this.createRequestBody(features);
    return this.httpClient.post<EntityManageResponse>(url, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  getBuildingQuality(bldId: string): Observable<string | null> {
    const filter = {
      where: `GlobalID = '${bldId}'`,
      outFields: ['BldQuality'],
    } as Partial<QueryFilter>;
    return this.getBuildingData(filter).pipe(
      catchError((err: any) => this.handleError(err)),
      map((res: EntityDataResponse | null) => {
        if (!res) return res;
        const [attributes] = res.data.features.map(
          (field: any) => field.attributes
        );
        const codedValues = res.data.fields[0].domain.codedValues;
        return (
          codedValues.find(
            (cv: { name: string; code: number }) =>
              cv.code === attributes.BldQuality
          )?.name ?? '-'
        );
      })
    );
  }

  resetStatus(bldId: string, callback?: () => void) {
    const filter = {
      where: `GlobalID = '${bldId}'`,
      outFields: ['GlobalID', 'OBJECTID'],
    } as Partial<QueryFilter>;
    this.getBuildingData(filter)
      .pipe(catchError(err => this.handleError(err)))
      .subscribe({
        next: res => this.handleResponse(res, callback),
        error: err => this.handleError(err),
      });
  }

  private handleResponse(res: any, callback?: () => void) {
    const [attributes] = res.data.features.map((f: any) => f.attributes);
    const object = {
      GlobalID: attributes.GlobalID,
      OBJECTID: attributes.OBJECTID,
      BldQuality: 9,
    };
    this.updateFeature([{ attributes: object }]).subscribe({
      next: response => {
        const success =
          response['addResults']?.[0]?.success ??
          response['updateResults']?.[0]?.success;
        if (!success) {
          this.snackBar.open(
            $localize`Could not update value`,
            $localize`Ok`,
            { duration: 3000 }
          );
          return;
        }
        this.executeAutomaticRules(attributes.GlobalID, callback);
      },
      error: err => this.handleError(err),
    });
  }

  private handleError(err: any) {
    console.error(err);
    return of(null);
  }

  executeAutomaticRules(buildingId: string, callback?: () => void) {
    const body = {
      buildingIds: [buildingId.replace('{', '').replace('}', '')],
      executionUser: this.authState.getNameId(),
    };
    this.httpClient
      .post(
        environment.base_url + '/qms/check/automatic',
        JSON.stringify(body),
        { headers: { 'Content-Type': 'application/json' } }
      )
      .subscribe({
        next: () => callback?.(),
        error: err => {
          this.snackBar.open(
            $localize`Could not start automatic rules execution`,
            $localize`Ok`,
            { duration: 3000 }
          );
          callback?.();
          return this.handleError(err);
        },
      });
  }

  async checkIntersectingBuildings(
    view: MapView,
    geometries: Collection<Geometry>
  ) {
    return this.esriAuthService.withEsriRetry(async () => {
      const layer = this.bldLayer;
      const query = layer.createQuery();
      query.geometry = await geometryEngine.union(geometries.toArray());
      query.outFields = ['GlobalID'];
      const response = await layer.queryFeatures(query);
      const JSONResponse = await response.toJSON();
      return JSONResponse.features.map((o: any) => o.attributes['GlobalID'])
        .length;
    });
  }

  hasUntestedBuildings(): Observable<boolean> {
    const filter = {
      where: 'BldQuality = 9',
      outFields: ['GlobalID'],
    } as Partial<QueryFilter>;
    return this.getBuildingData(filter).pipe(
      catchError(() => of(null)),
      map(res => (res ? res.count > 0 : false))
    );
  }

  getAllBuildingIdsWithPendingQueLogs(): Observable<any> {
    return this.httpClient
      .get(environment.base_url + '/qms/buildings/que/pending')
      .pipe(catchError(() => of(null)));
  }

  private async fetchAttributesMetadata() {
    return this.esriAuthService.withEsriRetry(async () => {
      const layer = this.bldLayer;
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

  private async fetchBuildingData(
    filter?: Partial<QueryFilter>
  ): Promise<EntityDataResponse | null> {
    try {
      return await this.esriAuthService.withEsriRetry(async () => {
        const layer = this.bldLayer;
        const dataQuery = layer.createQuery();
        dataQuery.start = filter?.start ?? 0;
        dataQuery.num = filter?.num ?? 5;
        dataQuery.where = filter?.where ?? '1=1';
        dataQuery.outFields = filter?.outFields ?? ['*'];
        dataQuery.returnGeometry = filter?.returnGeometry ?? false;
        dataQuery.orderByFields = filter?.orderByFields ?? ['BldStatus'];
        dataQuery.outStatistics = [];

        const globalIdQuery = layer.createQuery();
        globalIdQuery.where = filter?.where ?? '1=1';
        globalIdQuery.outFields = ['GlobalID'];
        globalIdQuery.returnGeometry = false;
        globalIdQuery.outStatistics = [];

        const featureCount = await layer.queryFeatureCount(dataQuery);
        const features = await (await layer.queryFeatures(dataQuery)).toJSON();
        const globalIds = (
          await (await layer.queryFeatures(globalIdQuery)).toJSON()
        ).features.map((o: any) => o.attributes['GlobalID']);
        return { count: featureCount, data: features, globalIds };
      });
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  private async fetchBuildingMunicipality(buildingId: string) {
    try {
      return await this.esriAuthService.withEsriRetry(async () => {
        const layer = this.bldLayer;
        const dataQuery = layer.createQuery();
        dataQuery.start = 0;
        dataQuery.num = 1;
        dataQuery.where = `GlobalID = '${buildingId}'`;
        dataQuery.outFields = ['BldMunicipality'];
        dataQuery.returnGeometry = false;
        const features = await (await layer.queryFeatures(dataQuery)).toJSON();
        return { data: features };
      });
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  private async getStats(filter: Partial<QueryFilter>) {
    return this.esriAuthService.withEsriRetry(async () => {
      const layer = this.bldLayer;
      const query = layer.createQuery();
      query.where = filter.where ?? '1=1';
      query.outFields = filter.outFields ?? ['*'];
      query.returnGeometry = false;
      query.groupByFieldsForStatistics = filter.groupByFieldsForStatistics ?? [
        'BldStatus',
      ];
      query.orderByFields = filter.orderByFields ?? ['BldStatus'];
      query.outStatistics =
        filter.outStatistics ??
        ([
          {
            statisticType: 'count',
            onStatisticField: 'BldStatus',
            outStatisticFieldName: 'value',
          },
        ] as __esri.StatisticDefinition[]);
      return layer.queryFeatures(query);
    });
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
