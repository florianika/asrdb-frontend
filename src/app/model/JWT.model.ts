export type JWT = {
  id: string,
  email: string,
  name: string,
  surname: string,
  role: "ADMIN" | "USER" | "OTHER",
  nbf: number,
  exp: number,
  iat: number,
  iss: string,
  aud: string
}
