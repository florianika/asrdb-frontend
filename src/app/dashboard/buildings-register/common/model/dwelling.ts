

export type DwellingFilter = {
  filter: {
    DwlEntranceID: number,
    DwlFloor: number,
    DwlStatus: string,
    DwlType: string,
    DwlApartNumber: number;
    GlobalID: string,
    fk_entrance?: string
  };
  options: {
    DwlType: any[];
    DwlStatus: any[];
  }
}
