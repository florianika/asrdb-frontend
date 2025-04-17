export type Role = 'ADMIN' | 'SUPERVISOR' | 'ENUMERATOR' | 'CLIENT' | 'PUBLISHER' | 'USER';
export type EntityType = 'BUILDING' | 'ENTRANCE' | 'DWELLING';
export type Permission = 'WRITE' | 'READ' | 'NONE';

export type RolePermissions = {
  'id': number,
  'role': Role
  'entityType': EntityType | '',
  'variableName': string,
  'permission': Permission
}

export type NewRolePermission = {
  'role': Role
  'entityType': EntityType | '',
  'variableName': string,
  'permission': Permission
}

export type RolePermissionGetResponse = {
  'rolePermissionsDTO': RolePermissions[]
}
