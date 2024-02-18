
export type QueryFilter = {
  start: number;
  num: number,
  where: string;
  outFields: string[];
  orderByFields: string[];
  returnGeometry: boolean
}
