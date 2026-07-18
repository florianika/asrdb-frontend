export type FieldWork = {
  fieldWorkId: number;
  startDate: string;
  endDate: string;
  fieldWorkStatus: string;
  description: string;
  fieldWorkName: string;
  openEmailTemplateId: number;
  createdUser: string;
  createdTimestamp: string;
  updatedUser?: string;
  updatedTimestamp?: string;
  remarks?: string;
};

export type SelectedRule = {
  id: number;
  localId: string;
  ruleId: number;
  createdUser: string;
  createdTimestamp: string;
  ruleNameAl: string;
  ruleNameEn: string;
  ruleLocalId: string;
  ruleEntityType: string;
};

export type FieldWorkListResponse = { fieldworksDTO: FieldWork[] };

export type FieldWorkCreateRequest = {
  fieldWorkName: string;
  description: string;
  startDate: string;
  endDate: string;
  createdUser: string;
};

export type FieldWorkClosureStatusResponse = {
  fieldWorkId: number;
  canBeClosed: boolean;
  reasons: string;
  lastChecked: string;
};
