export type Log = {
  id: string,
  ruleId: number,
  bldId?: string,
  entId?: string
  dwlId?: string,
  entityType: string,
  variable?: string,
  qualityAction: string,
  qualityStatus: string,
  qualityMessageAl?: string,
  qualityMessageEn?: string,
  errorLevel: string,
  createdUser: string,
  createdTimestamp: string,
}
