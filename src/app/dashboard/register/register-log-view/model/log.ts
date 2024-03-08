export type Log = {
  Id: string,
  RuleId: number,
  BldId?: string,
  EntId?: string
  DwlId?: string,
  EntityType: string,
  Variable?: string,
  QualityAction: string,
  QualityStatus: string,
  QualityMessageAl?: string,
  QualityMessageEn?: string,
  ErrorLevel: string,
  CreatedUser: string,
  CreatedTimestamp: string,
}
