import { QualityAction } from '../../../common/model/quality-action';

export interface QualityRuleFilter {
  localId: string;
  variable: string;
  ruleStatus: string;
  qualityAction: QualityAction | '';
}
