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
  public static getUrlForType(type: EntityType) {
    return BaseUrl + type.toUpperCase();
  }

  public static getType(type: string | null) {
    if (!type) {
      return 'BUILDING';
    }
    return ['BUILDING', 'ENTRANCE', 'DWELLING'].includes(type) ? type as EntityType : 'BUILDING';
  }
}
