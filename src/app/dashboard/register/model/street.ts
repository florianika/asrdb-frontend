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

export type StreetFilter = {
  filter: {
    StrMunicipality: number;
    StrType: string;
    StrNameCore: string;
    StrNameFull: string;
    GlobalID: string;
    StrAddressID?: string;
  };
  options: {
    StrType: any[];
    StrMunicipality: any[];
  };
};
