import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  arcGisGlobalIdIn,
  EMPTY_ARCGIS_GLOBAL_ID,
} from '../helper/arcgis-query';

type EsriFeatureOperation = 'addFeatures' | 'updateFeatures';

@Injectable({
  providedIn: 'root',
})
export class EsriFeatureApiClientService {
  private readonly formHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  constructor(private httpClient: HttpClient) {}

  addFeatures<TResponse>(
    layerUrl: string,
    token: string,
    features: unknown[]
  ): Observable<TResponse> {
    return this.postFeatures(layerUrl, 'addFeatures', token, features);
  }

  updateFeatures<TResponse>(
    layerUrl: string,
    token: string,
    features: unknown[]
  ): Observable<TResponse> {
    return this.postFeatures(layerUrl, 'updateFeatures', token, features);
  }

  deleteFeaturesByGlobalIds<TResponse>(
    layerUrl: string,
    token: string,
    globalIds: string[]
  ): Observable<TResponse> {
    const ids = globalIds.length ? globalIds : [EMPTY_ARCGIS_GLOBAL_ID];
    const where = arcGisGlobalIdIn('GlobalID', ids);
    const body = this.encodeFormBody({ where, f: 'json' });
    const url = `${layerUrl}/deleteFeatures?token=${token}`;
    return this.httpClient.post<TResponse>(url, body, {
      headers: this.formHeaders,
    });
  }

  private postFeatures<TResponse>(
    layerUrl: string,
    operation: EsriFeatureOperation,
    token: string,
    features: unknown[]
  ): Observable<TResponse> {
    const body = this.encodeFormBody({
      features: JSON.stringify(features),
      f: 'json',
    });
    const url = `${layerUrl}/${operation}?token=${token}`;
    return this.httpClient.post<TResponse>(url, body, {
      headers: this.formHeaders,
    });
  }

  private encodeFormBody(params: Record<string, string>): string {
    return Object.entries(params)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join('&');
  }
}
