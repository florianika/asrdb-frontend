import {
  BUILDING_ENTITY,
  DWELLING_ENTITY,
  ENTRANCE_ENTITY,
} from '../common/constants/common-constants';

export type Role =
  | 'ADMIN'
  | 'SUPERVISOR'
  | 'ENUMERATOR'
  | 'CLIENT'
  | 'PUBLISHER'
  | 'USER';
export type EntityType =
  | typeof BUILDING_ENTITY
  | typeof ENTRANCE_ENTITY
  | typeof DWELLING_ENTITY;
export type Permission = 'WRITE' | 'READ' | 'NONE';

export type RolePermissions = {
  id: number;
  role: Role;
  entityType: EntityType | '';
  variableName: string;
  permission: Permission;
};

export type NewRolePermission = {
  role: Role;
  entityType: EntityType | '';
  variableName: string;
  permission: Permission;
};

export type RolePermissionGetResponse = {
  rolePermissionsDTO: RolePermissions[];
};
