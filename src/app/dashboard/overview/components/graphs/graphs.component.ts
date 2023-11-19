import { Component, OnInit, isDevMode } from '@angular/core';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { EChartsOption } from 'echarts';
import { OverviewService } from '../service/overview.service';

@Component({
  selector: 'asrdb-graphs',
  templateUrl: './graphs.component.html',
  styleUrls: ['./graphs.component.css']
})
export class GraphsComponent implements OnInit {

  constructor(private overviewService: OverviewService) {}

  public graph = {
    data: [{
      values: [] as string[],
      labels: [] as string[],
      type: 'pie'
    }],
    layout: {
      autosize: true,
      title: 'Building types',
      textinfo: "label+percent",
      textposition: "outside",
      automargin: true,
      legend: {orientation: 'h', side: 'top'}
    },
  };

  options: EChartsOption | null = null;
  async initializeChart(): Promise<any> {
    await this.getStats(this.overviewService.bldLayer);
  }

  private async getStats(layer: FeatureLayer): Promise<{ name: any, value: any }[]> {
    const query = layer.createQuery();
    query.where = "1=1";
    query.outFields = ["*"];
    query.returnGeometry = false;
    query.groupByFieldsForStatistics = ["BldStatus"];
    query.orderByFields = [`BldStatus`];
    query.outStatistics = [{
      statisticType: "count",
      onStatisticField: "BldStatus",
      outStatisticFieldName: "value"
    }] as __esri.StatisticDefinition[]

    const statsResults = await layer.queryFeatures(query);
    const chartData = statsResults.features.map((feature) => { return { name: feature.attributes.BldStatus, value: feature.attributes.value } });
    const data = statsResults.features.map((feature) => feature.attributes.value);
    const labels = statsResults.features.map((feature) => feature.attributes.BldStatus).map((label) => {
      const newLabel = this.overviewService.uniqueValueInfos.find(o => o.value === label);
      return newLabel?.label ?? label;
    });
    this.graph.data[0].values = data;
    this.graph.data[0].labels = labels;
    console.log(chartData);
    return chartData;
  }

  ngOnInit(): void {
    this.initializeChart().then(() => {
      if (isDevMode()) {
        console.log("chart initialized");
      }
    });
  }
}
