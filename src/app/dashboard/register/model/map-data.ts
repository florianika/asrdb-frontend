export type MapData = {
  rings: Ring,
  x: number,
  y: number,
  id?: number | string,
  centroid?: Centroid
};
export type MapFormData = {
  buildingPoly: Ring,
  entrancePoints: Point[]
};
export type Centroid = {
  id?: string | number,
  latitude?: number,
  longitude?: number
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
