import { Role } from './RolePermissions.model';

export type JWT = {
  nameid: string,
  id: string,
  email: string,
  name: string,
  family_name: string,
  role: Role,
  nbf: number,
  exp: number,
  iat: number,
  iss: string,
  aud: string
}
export type SigninResponse = {
  'idToken': string,
  'accessToken': string,
  'refreshToken': string
}
