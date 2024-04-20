
export type Dwelling = {
  OBJECTID: number,
  DwlID: number,
  DwlCensus2023: number,
  DwlAddressID: string,
  DwlQuality: number,
  DwlFloor: number,
  DwlApartNumber: number,
  DwlStatus: number,
  DwlYearConstruction: number,
  DwlYearElimination: number,
  DwlType: number,
  DwlOwnership: number,
  DwlOccupancy: number,
  DwlSurface: number,
  DwlWaterSupply: number,
  DwlToilet: number,
  DwlBath: number,
  DwlHeatingFacility: number,
  DwlHeatingEnergy: number,
  DwlAirConditioner: number,
  DwlSolarPanel: number,
  GlobalID: string,
  created_user: string,
  created_date: number,
  last_edited_user: string,
  last_edited_date: number,
  DwlEntranceID: string,
  external_creator: string,
  external_creator_date: string,
  external_editor: string,
  external_editor_date: string,
}

export type DwellingFilter = {
  filter: {
    DwlFloor: number,
    DwlStatus: string,
    DwlType: string,
    DwlApartNumber: number;
    GlobalID: string,
    DwlEntranceID?: string
  };
  options: {
    DwlType: any[];
    DwlStatus: any[];
  }
}
