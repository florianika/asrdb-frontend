import { EntityType } from '../../../../common/model/entity-type';
import { QualityAction } from '../../../common/model/quality-action';

export type LogFilter = {
  entityType: EntityType | '';
  variable: string;
  status: string;
  qualityAction: QualityAction | '';
  errorLevel: string;
};
