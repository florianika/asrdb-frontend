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

export type QualityRuleResponse = {
  ruleDTO: QualityRule[]
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
export const BaseUrl = '/qms/rules/entity/';

export class QualityManagementConfig {
  public static getUrlForType(type: string | null) {
    return BaseUrl + this.getType(type);
  }

  public static getType(type: string | null) {
    // if (!type) {
    //   return 'BUILDING';
    // }
    // return ['BUILDING', 'ENTRANCE', 'DWELLING'].includes(type) ? type as EntityType : 'BUILDING';
    switch(type) {
      case 'BUILDING': {
        return 0;
      }
      case 'ENTRANCE': {
        return 1;
      }
      case 'DWELLING': {
        return 2
      }
      default: {
        return 0
      }
    }
  }
}
