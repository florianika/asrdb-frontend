import { AuthSessionStore } from './auth-session.store';

describe('AuthSessionStore', () => {
  it('keeps signal and observable session views synchronized', () => {
    const store = new AuthSessionStore();
    const observed: boolean[] = [];
    const subscription = store.session$.subscribe(session =>
      observed.push(session.isLoggedIn)
    );

    store.patchSession({ isLoggedIn: true, role: 'ADMIN' });

    expect(store.session().isLoggedIn).toBeTrue();
    expect(store.role()).toBe('ADMIN');
    expect(observed).toEqual([false, true]);
    subscription.unsubscribe();
  });

  it('keeps refresh state views synchronized', () => {
    const store = new AuthSessionStore();
    const observed: string[] = [];
    const subscription = store.refreshState$.subscribe(state =>
      observed.push(state)
    );

    store.setRefreshState('refreshing');

    expect(store.refreshState()).toBe('refreshing');
    expect(store.isRefreshing()).toBeTrue();
    expect(observed).toEqual(['idle', 'refreshing']);
    subscription.unsubscribe();
  });
});
