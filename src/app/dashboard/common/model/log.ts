import { EntityType } from '../../../common/model/entity-type';

export type Log = {
  id: string;
  ruleId: number;
  bldId?: string;
  entId?: string;
  dwlId?: string;
  reference: string;
  entityType: EntityType;
  variable?: string;
  qualityAction: string;
  qualityStatus: string;
  qualityMessageAl?: string;
  qualityMessageEn?: string;
  errorLevel: string;
  createdUser: string;
  createdTimestamp: string;
};
