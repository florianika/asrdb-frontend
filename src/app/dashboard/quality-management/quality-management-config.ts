import { environment } from 'src/environments/environment';

export type QualityConfig = {
  endpoint: string;
}
export type QualityTableColumn = {
  title: string;
  prop: string;
}
export type EntityType = 'BUILDING' | 'ENTRANCE' | 'DWELLING';

export type QualityAction = 'AUT' | 'MISS' | 'QUE' | 'ERR';

export type RuleStatus = 'ACTIVE' | 'DISABLED';

export type QualityRulesResponse = {
  ruleDTO: QualityRule[]
}

export type QualityRuleResponse = {
  ruleDTO: QualityRule
}

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
  ruleStaus: RuleStatus;
  ruleRequirement: string;
  remark: string;
  qualityMessageAl: string;
  qualityMessageEn: string;
  createdUser: string;
  createdTimestamp: string;
  updatedUser: string | null;
  updatedTimestamp: string | null
}
export const BaseUrl = environment.base_url + '/qms/rules/entity/';

export class QualityManagementConfig {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static getUrlForType(_type: string | null) {
    return BaseUrl + this.getType(_type);
  }

  public static getType(type: string | null) {
    if (!type) {
       return 'BUILDING';
     }
    return ['BUILDING', 'ENTRANCE', 'DWELLING'].includes(type) ? type as EntityType : 'BUILDING';
  }
}
