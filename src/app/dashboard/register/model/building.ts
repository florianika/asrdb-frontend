export type Building = {
  OBJECTID: number;
  Shape__Length: number;
  Shape__Area: number;
  GlobalID: string;
  BldID: number;
  BldCensus2023: number;
  BldQuality: number;
  BldMunicipality: number;
  BldEnumArea: number;
  BldLatitude: number;
  BldLongitude: number;
  BldCadastralZone: number;
  BldProperty: number;
  BldPermitNumber: number;
  BldPermitDate: string;
  BldStatus: number;
  BldYearConstruction: number;
  BldYearDemolition: number;
  BldType: number;
  BldClass: number;
  BldArea: number;
  BldFloorsAbove: number;
  BldFloorsUnder: number;
  BldHeight: number;
  BldVolume: number;
  BldPipedWater: number;
  BldRainWater: number;
  BldWasteWater: number;
  BldElectricity: number;
  BldPipedGas: number;
  BldElevator: number;
  created_user: string;
  created_date: string;
  last_edited_user: string;
  last_edited_date: string;
  external_creator: string;
  external_creator_date: string;
  external_editor: string;
  external_editor_date: string;
  BldCentroidStatus: number;
  BldDwellingRecs: number;
  BldEntranceRecs: number;
  BldAddressID: number;
}

export type BuildingFilter = {
  filter: {
    BldMunicipality: string;
    BldStatus: string[];
    BldType: string;
    BldQuality: string;
    GlobalID: string;
    BldEnumArea: string;
  };
  options: {
    BldMunicipality: any[];
    BldStatus: any[];
    BldType: any[];
    BldQuality: any[];
  }
}
