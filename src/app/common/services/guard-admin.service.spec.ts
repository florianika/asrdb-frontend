import { Router, UrlTree } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { AuthStateService } from './auth-state.service';
import { GuardAdminService } from './guard-admin.service';

describe('GuardAdminService', () => {
  let authState: jasmine.SpyObj<AuthStateService>;
  let router: jasmine.SpyObj<Router>;
  let guard: GuardAdminService;

  beforeEach(() => {
    authState = jasmine.createSpyObj<AuthStateService>('AuthStateService', [
      'isUserLoggedIn',
      'isAdmin',
      'isSupervisor',
      'logout',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['parseUrl']);
    router.parseUrl.and.callFake(url => ({ url }) as unknown as UrlTree);
    guard = new GuardAdminService(authState, router);
  });

  it('redirects an authenticated user without an allowed role to 403', async () => {
    authState.isUserLoggedIn.and.returnValue(of(true));
    authState.isAdmin.and.returnValue(false);
    authState.isSupervisor.and.returnValue(false);

    const result = await firstValueFrom(guard.canActivate());

    expect(result).toBe(router.parseUrl.calls.mostRecent().returnValue);
    expect(router.parseUrl).toHaveBeenCalledOnceWith('/403');
    expect(authState.logout).not.toHaveBeenCalled();
  });

  it('allows administrators and supervisors', async () => {
    authState.isUserLoggedIn.and.returnValue(of(true));
    authState.isAdmin.and.returnValue(false);
    authState.isSupervisor.and.returnValue(true);

    expect(await firstValueFrom(guard.canActivate())).toBeTrue();
    expect(router.parseUrl).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users to sign in', async () => {
    authState.isUserLoggedIn.and.returnValue(of(false));

    await firstValueFrom(guard.canActivate());

    expect(router.parseUrl).toHaveBeenCalledOnceWith('/auth/signin');
    expect(authState.logout).not.toHaveBeenCalled();
  });
});
