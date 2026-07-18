import { AuthSessionStore } from './auth-session.store';
import { AuthorizationPolicyService } from './authorization-policy.service';

describe('AuthorizationPolicyService', () => {
  let sessionStore: AuthSessionStore;
  let policy: AuthorizationPolicyService;

  beforeEach(() => {
    sessionStore = new AuthSessionStore();
    policy = new AuthorizationPolicyService(sessionStore);
  });

  it('grants admin all defined capabilities', () => {
    sessionStore.patchSession({ role: 'ADMIN' });

    expect(policy.can('access-management')).toBeTrue();
    expect(policy.can('manage-entities')).toBeTrue();
    expect(policy.can('delete-entities')).toBeTrue();
    expect(policy.can('manage-municipality-scope')).toBeTrue();
    expect(policy.can('close-field-work')).toBeTrue();
    expect(policy.can('moderate-comments')).toBeTrue();
    expect(policy.can('assign-admin-role')).toBeTrue();
  });

  it('keeps supervisor elevated access without admin-only capabilities', () => {
    sessionStore.patchSession({ role: 'SUPERVISOR' });

    expect(policy.can('access-management')).toBeTrue();
    expect(policy.can('manage-entities')).toBeTrue();
    expect(policy.can('close-field-work')).toBeTrue();
    expect(policy.can('delete-entities')).toBeFalse();
    expect(policy.can('assign-admin-role')).toBeFalse();
  });

  it('denies privileged capabilities without an elevated role', () => {
    sessionStore.patchSession({ role: 'USER' });

    expect(policy.can('access-management')).toBeFalse();
    expect(policy.can('manage-entities')).toBeFalse();
    expect(policy.can('close-field-work')).toBeFalse();
  });
});
