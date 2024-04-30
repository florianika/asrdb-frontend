export type Entrance = {
  OBJECTID: number;
  GlobalID: string;
  EntID: number;
  EntBuildingID: number;
  EntAddressID: string;
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
  EntStreet: number;
  EntBuildingId: string;
  EntPointStatus: number;
  EntDwellingRecs: number;
  EntDwellingExpec: number;
  Point: {
    X: number;
    Y: number;
  }
  external_creator: string;
  external_creator_date: string;
  external_editor: string;
  external_editor_date: string;
}

export type EntranceFilter = {
  filter: {
    EntBuildingNumber: number,
    EntEntranceNumber: number,
    EntPointStatus: string,
    GlobalID: string,
    EntBuildingId?: string
  };
  options: {
    EntPointStatus: any[];
  }
}
