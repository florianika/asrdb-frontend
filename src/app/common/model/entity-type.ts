import {
  BUILDING_ENTITY,
  DWELLING_ENTITY,
  ENTRANCE_ENTITY,
} from '../constants/common-constants';

export type EntityType =
  | typeof BUILDING_ENTITY
  | typeof ENTRANCE_ENTITY
  | typeof DWELLING_ENTITY;
