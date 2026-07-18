import {
  HttpHandler,
  HttpHeaders,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injector } from '@angular/core';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthStateService } from './auth-state.service';
import { AuthInterceptor, isTrustedApiRequest } from './auth-interceptor';

describe('AuthInterceptor', () => {
  let authState: jasmine.SpyObj<AuthStateService>;
  let injector: jasmine.SpyObj<Injector>;
  let next: jasmine.SpyObj<HttpHandler>;
  let interceptor: AuthInterceptor;

  beforeEach(() => {
    authState = jasmine.createSpyObj<AuthStateService>('AuthStateService', [
      'getAuthorizationToken',
    ]);
    authState.getAuthorizationToken.and.returnValue('Bearer access-token');
    injector = jasmine.createSpyObj<Injector>('Injector', ['get']);
    injector.get.and.returnValue(authState);
    next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
    next.handle.and.returnValue(of(new HttpResponse()));
    interceptor = new AuthInterceptor(injector);
  });

  it('attaches the bearer token to the configured API origin', () => {
    const request = new HttpRequest('GET', `${environment.base_url}/users`);

    interceptor.intercept(request, next).subscribe();

    const forwardedRequest = next.handle.calls.mostRecent()
      .args[0] as HttpRequest<unknown>;
    expect(forwardedRequest.headers.get('Authorization')).toBe(
      'Bearer access-token'
    );
  });

  it('does not attach the bearer token to an external origin', () => {
    const request = new HttpRequest(
      'GET',
      'https://services.arcgis.com/example/query'
    );

    interceptor.intercept(request, next).subscribe();

    expect(next.handle).toHaveBeenCalledOnceWith(request);
    expect(injector.get).not.toHaveBeenCalled();
  });

  it('preserves an explicit authorization header', () => {
    const request = new HttpRequest(
      'GET',
      `${environment.base_url}/users`,
      undefined,
      { headers: new HttpHeaders({ Authorization: 'ApiKey map-token' }) }
    );

    interceptor.intercept(request, next).subscribe();

    expect(next.handle).toHaveBeenCalledOnceWith(request);
    expect(injector.get).not.toHaveBeenCalled();
  });

  it('rejects lookalike origins and paths', () => {
    expect(
      isTrustedApiRequest(
        'https://api.example.com.evil.test/v1/users',
        'https://api.example.com/v1',
        'https://dashboard.example.com'
      )
    ).toBeFalse();
    expect(
      isTrustedApiRequest(
        'https://api.example.com/v10/users',
        'https://api.example.com/v1',
        'https://dashboard.example.com'
      )
    ).toBeFalse();
  });
});
