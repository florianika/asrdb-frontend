import { Role } from "./JWT.model";

export type User = {
  id: string,
  "email": string,
  "name": string,
  "lastName": string,
  "accountStatus": AccountStatus,
  "accountRole": Role
};

export type AccountStatus = "ACTIVE" | "TERMINATED";
