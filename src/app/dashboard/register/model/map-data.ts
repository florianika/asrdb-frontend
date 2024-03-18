export type MapData = {
  rings: Ring,
  x: number,
  y: number,
  id?: number | string,
  centroid?: Centroid,
  spatialReference: any
};
export type BuildingPoly = {
  rings: Ring,
  spatialReference: any
};
export type MapFormData = {
  buildingPoly: BuildingPoly,
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
  id: number | string,
  spatialReference: any
};

export const DEFAULR_SPARTIAL_REF = {
  "latestWkid": 25834,
  "wkid": 25834
};
