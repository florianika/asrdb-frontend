import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class QmsApiClientService {
  private readonly jsonHeaders = { 'Content-Type': 'application/json' };

  constructor(private httpClient: HttpClient) {}

  get<TResponse>(path: string): Observable<TResponse> {
    return this.httpClient.get<TResponse>(this.getUrl(path));
  }

  postJson<TRequest extends object, TResponse>(
    path: string,
    body: TRequest
  ): Observable<TResponse> {
    return this.httpClient.post<TResponse>(
      this.getUrl(path),
      JSON.stringify(body),
      {
        headers: this.jsonHeaders,
      }
    );
  }

  patch<TResponse>(path: string, body: unknown = null): Observable<TResponse> {
    return this.httpClient.patch<TResponse>(this.getUrl(path), body);
  }

  private getUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${environment.base_url}${normalizedPath}`;
  }
}
