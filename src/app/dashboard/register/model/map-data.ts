export type MapData = {
  rings: Ring,
  x: number,
  y: number
};
export type MapFormData = {
  buildingPoly: Ring,
  entrancePoints: Point[]
};

export type Ring = number[][];
export type Point = {
  x: number,
  y: number
};
