import { EntityType } from '../../../common/model/entity-type';
import { QualityAction } from './quality-action';

export type Log = {
  id: string;
  ruleId: number;
  bldId?: string;
  entId?: string;
  dwlId?: string;
  reference: string;
  entityType: EntityType;
  variable?: string;
  qualityAction: QualityAction;
  qualityStatus: string;
  qualityMessageAl?: string;
  qualityMessageEn?: string;
  errorLevel: string;
  createdUser: string;
  createdTimestamp: string;
};
