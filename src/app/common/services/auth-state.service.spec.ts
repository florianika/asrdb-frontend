import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';

import { AuthStateService } from './auth-state.service';

describe('AuthStateService', () => {
  let service: AuthStateService;
  let routerSpy: jasmine.SpyObj<Router>;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
  let originalWorker: typeof Worker | undefined;

  beforeEach(() => {
    const workerGlobal = globalThis as { Worker?: typeof Worker };
    originalWorker = workerGlobal.Worker;
    workerGlobal.Worker = undefined;

    localStorage.removeItem('asrdb_jwt');
    localStorage.removeItem('ESRI-AUTH');
    localStorage.removeItem('unrelated-key');
    sessionStorage.removeItem('asrdb_jwt');
    sessionStorage.removeItem('ESRI-AUTH');
    sessionStorage.removeItem('unrelated-session-key');

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl'], {
      url: '/dashboard',
    });
    httpClientSpy = jasmine.createSpyObj<HttpClient>('HttpClient', [
      'post',
      'get',
    ]);
    service = new AuthStateService(routerSpy, httpClientSpy);
  });

  afterEach(() => {
    const workerGlobal = globalThis as { Worker?: typeof Worker };
    if (originalWorker) {
      workerGlobal.Worker = originalWorker;
    } else {
      delete workerGlobal.Worker;
    }

    localStorage.removeItem('asrdb_jwt');
    localStorage.removeItem('ESRI-AUTH');
    localStorage.removeItem('unrelated-key');
    sessionStorage.removeItem('asrdb_jwt');
    sessionStorage.removeItem('ESRI-AUTH');
    sessionStorage.removeItem('unrelated-session-key');
  });

  it('returns true when token is expired but refresh succeeds', async () => {
    spyOn(service, 'isTokenValid').and.returnValue(false);
    spyOn(service, 'refreshToken').and.returnValue(of(true));
    const setLoginStateSpy = spyOn(service, 'setLoginState');
    const logoutSpy = spyOn(service, 'logout');

    const isLoggedIn = await firstValueFrom(service.isUserLoggedIn());

    expect(isLoggedIn).toBeTrue();
    expect(setLoginStateSpy).toHaveBeenCalledWith(true);
    expect(logoutSpy).not.toHaveBeenCalled();
  });

  it('returns false when token is expired and refresh fails', async () => {
    spyOn(service, 'isTokenValid').and.returnValue(false);
    spyOn(service, 'refreshToken').and.returnValue(of(false));
    const setLoginStateSpy = spyOn(service, 'setLoginState');
    const logoutSpy = spyOn(service, 'logout');

    const isLoggedIn = await firstValueFrom(service.isUserLoggedIn());

    expect(isLoggedIn).toBeFalse();
    expect(setLoginStateSpy).toHaveBeenCalledWith(false);
    expect(logoutSpy).not.toHaveBeenCalled();
  });

  it('returns false when token is expired and refresh throws', async () => {
    spyOn(service, 'isTokenValid').and.returnValue(false);
    spyOn(service, 'refreshToken').and.returnValue(
      throwError(() => new Error('refresh failed'))
    );
    const setLoginStateSpy = spyOn(service, 'setLoginState');
    const logoutSpy = spyOn(service, 'logout');

    const isLoggedIn = await firstValueFrom(service.isUserLoggedIn());

    expect(isLoggedIn).toBeFalse();
    expect(setLoginStateSpy).toHaveBeenCalledWith(false);
    expect(logoutSpy).toHaveBeenCalled();
  });

  it('does not navigate while decoding token when there is no JWT', () => {
    const role = service.getRole();

    expect(role).toBeUndefined();
    expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
  });

  it('clears only scoped auth keys on logout', () => {
    localStorage.setItem('asrdb_jwt', 'token');
    localStorage.setItem('ESRI-AUTH', 'esri-token');
    localStorage.setItem('unrelated-key', 'should-stay');
    sessionStorage.setItem('asrdb_jwt', 'token');
    sessionStorage.setItem('ESRI-AUTH', 'esri-token');
    sessionStorage.setItem('unrelated-session-key', 'should-stay');

    service.logout();

    expect(localStorage.getItem('asrdb_jwt')).toBeNull();
    expect(localStorage.getItem('ESRI-AUTH')).toBeNull();
    expect(localStorage.getItem('unrelated-key')).toBe('should-stay');
    expect(sessionStorage.getItem('asrdb_jwt')).toBeNull();
    expect(sessionStorage.getItem('ESRI-AUTH')).toBeNull();
    expect(sessionStorage.getItem('unrelated-session-key')).toBe('should-stay');
  });
});
