import { Injectable } from '@angular/core';
import { Role } from '../../model/RolePermissions.model';
import { AuthSessionStore } from './auth-session.store';

export type AppCapability =
  | 'access-management'
  | 'manage-entities'
  | 'delete-entities'
  | 'manage-municipality-scope'
  | 'close-field-work'
  | 'moderate-comments'
  | 'assign-admin-role';

const ELEVATED_CAPABILITIES: readonly AppCapability[] = [
  'access-management',
  'manage-entities',
  'manage-municipality-scope',
  'close-field-work',
  'moderate-comments',
];

const CAPABILITIES_BY_ROLE: Record<Role, readonly AppCapability[]> = {
  ADMIN: [...ELEVATED_CAPABILITIES, 'delete-entities', 'assign-admin-role'],
  SUPERVISOR: ELEVATED_CAPABILITIES,
  ENUMERATOR: [],
  CLIENT: [],
  PUBLISHER: [],
  USER: [],
};

@Injectable({ providedIn: 'root' })
export class AuthorizationPolicyService {
  constructor(private authSessionStore: AuthSessionStore) {}

  can(capability: AppCapability): boolean {
    const role = this.authSessionStore.role();
    return role
      ? (CAPABILITIES_BY_ROLE[role]?.includes(capability) ?? false)
      : false;
  }
}
