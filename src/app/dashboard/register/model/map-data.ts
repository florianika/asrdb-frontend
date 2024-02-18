export type MapData = {
  rings: Ring,
  x: number,
  y: number,
  id: number | string
};
export type MapFormData = {
  buildingPoly: Ring,
  entrancePoints: Point[]
};

export type Ring = number[][];
export type Point = {
  x: number,
  y: number,
  id: number | string
};

export const DEFAULR_SPARTIAL_REF = {
  'latestWkid': 3857,
  'wkid': 102100
};
