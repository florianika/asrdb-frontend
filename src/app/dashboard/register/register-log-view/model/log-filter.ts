import { EntityType } from '../../../../common/model/entity-type';

export type LogFilter = {
  entityType: EntityType | '';
  variable: string;
  status: string;
  qualityAction: string;
  errorLevel: string;
};
