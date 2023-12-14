export type Entrance = {
  OBJECTID: number;
  GlobalID: string;
  EntID: number;
  EntBuildingID: number;
  EntAddressID: number;
  EntQuality: number;
  EntLatitude: number;
  EntLongitude: number;
  EntBuildingNumber: number;
  EntEntranceNumber: number;
  EntTown: number;
  EntZipCode: number;
  created_user: string;
  created_date: string;
  last_edited_user: number;
  last_edited_date: number;
  EntStreetCode: number;
  fk_buildings: string;
  EntPointStatus: number;
  EntDwellingRecs: number;
  EntDwellingExpec: number;
  Point: {
    X: number;
    Y: number;
  }
}

export type EntranceFilter = {
  filter: {
    EntBuildingNumber: number,
    EntEntranceNumber: number,
    EntPointStatus: string,
    GlobalID: string,
    fk_buildings?: string
  };
  options: {
    EntPointStatus: any[];
  }
}
