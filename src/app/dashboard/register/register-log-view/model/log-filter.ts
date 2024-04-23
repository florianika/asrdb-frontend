import {EntityType} from "../../../quality-management/quality-management-config";

export type LogFilter = {
  entityType: EntityType | '',
  variable: string,
  status: string,
  qualityAction: string,
  errorLevel: string
}
