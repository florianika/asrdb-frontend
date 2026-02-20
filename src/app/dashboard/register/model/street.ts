export type Street = {
  OBJECTID: number;
  StrMunicipality: number;
  StrType: number;
  StrNameCore: string;
  StrNameFull: string;
  StrAddressID: number;
  GlobalID: string;
  created_user: string;
  created_date: number;
  last_edited_user: string;
  last_edited_date: number;
  external_creator: string;
  external_creator_date: string;
  external_editor: string;
  external_editor_date: string;
};

export type StreetFilterValues = {
  StrMunicipality: number | null;
  StrType: number[];
  StrNameCore: string;
  StrNameFull: string;
  GlobalID: string;
  StrAddressID: string;
};

export type StreetFilterOption = {
  name: string;
  code: number;
};

export type StreetFilter = {
  filter: StreetFilterValues;
  options: {
    StrType: StreetFilterOption[];
    StrMunicipality: StreetFilterOption[];
  };
};

export type StreetFilterKey = keyof StreetFilterValues;
