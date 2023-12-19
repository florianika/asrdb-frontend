import { Injectable } from '@angular/core';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';

@Injectable()
export class GraphsService {
  async getStats(layer: FeatureLayer): Promise<__esri.FeatureSet> {
    const query = layer.createQuery();
    query.where = '1=1';
    query.outFields = ['*'];
    query.returnGeometry = false;
    query.groupByFieldsForStatistics = ['BldStatus'];
    query.orderByFields = ['BldStatus'];
    query.outStatistics = [{
      statisticType: 'count',
      onStatisticField: 'BldStatus',
      outStatisticFieldName: 'value'
    }] as __esri.StatisticDefinition[];

    return await layer.queryFeatures(query);
  }
}
