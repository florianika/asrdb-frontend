import StatisticDefinition from "@arcgis/core/rest/support/StatisticDefinition";

export type QueryFilter = {
  start: number;
  num: number,
  where: string;
  outFields: string[];
  orderByFields: string[];
  returnGeometry: boolean;
  groupByFieldsForStatistics: string[];
  outStatistics: StatisticDefinition[];
}
