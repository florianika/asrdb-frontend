export type EsriCodedValue = {
  code: string | number;
  name: string;
};

export type EsriDomain = {
  codedValues?: EsriCodedValue[];
  name?: string;
  type?: string;
};

export type EsriField = {
  name: string;
  alias?: string;
  type: string;
  editable?: boolean;
  nullable?: boolean;
  length?: number;
  domain?: EsriDomain;
  defaultValue?: unknown;
};

export type EsriFeature<
  TAttributes = Record<string, unknown>,
  TGeometry = unknown,
> = {
  attributes: TAttributes;
  geometry?: TGeometry;
};

export type EsriFeatureSet<
  TAttributes = Record<string, unknown>,
  TGeometry = unknown,
> = {
  features: Array<EsriFeature<TAttributes, TGeometry>>;
  fields: EsriField[];
};

export type EsriQueryResponse<
  TAttributes = Record<string, unknown>,
  TGeometry = unknown,
> = {
  count: number;
  data: EsriFeatureSet<TAttributes, TGeometry>;
  globalIds?: string[];
};
