import {
  BUILDING_ENTITY,
  DWELLING_ENTITY,
  ENTRANCE_ENTITY,
} from 'src/app/common/constants/common-constants';
import { environment } from 'src/environments/environment';
import { EntityType } from '../../common/model/entity-type';

export { EntityType } from '../../common/model/entity-type';

export type QualityConfig = {
  endpoint: string;
};
export type QualityTableColumn = {
  title: string;
  prop: string;
};
export type QualityAction = 'AUT' | 'MISS' | 'QUE' | 'ERR';

export type RuleStatus = 'ACTIVE' | 'DISABLED';

export type QualityRulesResponse = {
  rulesDTO: QualityRule[];
};

export type ActiveQualityRulesResponse = {
  shortRulesDTO: ShortQualityRule[];
};

export type QualityRuleResponse = {
  rulesDTO: QualityRule;
};

export type ShortQualityRule = {
  id: number;
  localId: string;
  entityType: EntityType;
  nameAl: string;
  nameEn: string;
};

export type QualityRule = {
  id: number;
  localId: string;
  entityType: EntityType;
  variable: string;
  nameAl: string;
  nameEn: string;
  descriptionAl: string;
  descriptionEn: string;
  version: number;
  versionRationale: string;
  expression: string;
  qualityAction: QualityAction;
  ruleStatus: RuleStatus;
  ruleRequirement: string;
  remark: string;
  qualityMessageAl: string;
  qualityMessageEn: string;
  createdUser: string;
  createdTimestamp: string;
  updatedUser: string | null;
  updatedTimestamp: string | null;
  reference: string;
};
export const BaseUrl = environment.base_url + '/qms/rules/entity/';

export class QualityManagementConfig {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static getUrlForType(_type: string | null) {
    return BaseUrl + this.getType(_type);
  }

  public static getType(type: string | null) {
    if (!type) {
      return BUILDING_ENTITY;
    }
    return [BUILDING_ENTITY, ENTRANCE_ENTITY, DWELLING_ENTITY].includes(type)
      ? (type as EntityType)
      : BUILDING_ENTITY;
  }
}
