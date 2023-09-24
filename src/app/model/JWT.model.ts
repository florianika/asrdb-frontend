export type JWT = {
  id: string,
  email: string,
  name: string,
  surname: string,
  role: Role,
  nbf: number,
  exp: number,
  iat: number,
  iss: string,
  aud: string
}
export type Role = "ADMIN" | "USER" | "OTHER";
export type SigninResponse = {
  "idToken": string,
  "accessToken": string,
  "refreshToken": string
}
