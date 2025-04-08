import { Role } from './RolePermissions.model';

export type User = {
  id: string,
  email: string,
  name: string,
  lastName: string,
  accountStatus: AccountStatus,
  accountRole: Role,
  municipality: string,
};

export type AccountStatus = 'ACTIVE' | 'TERMINATED';
