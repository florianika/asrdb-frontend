import { Component, Input, OnInit, isDevMode } from '@angular/core';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { EChartsOption } from 'echarts';
import { OverviewService } from '../service/overview.service';
import { GraphsService } from './graphs.service';

@Component({
  selector: 'asrdb-graphs',
  templateUrl: './graphs.component.html',
  styleUrls: ['./graphs.component.css']
})
export class GraphsComponent implements OnInit {
  @Input() type!: 'pie' | 'line' | 'bar';
  public graph!: any;
  public options: EChartsOption | null = null;

  constructor(private overviewService: OverviewService, private graphsService: GraphsService) {
  }

  async initializeChart(): Promise<any> {
    const statsResults = await this.graphsService.getStats(this.overviewService.bldLayer);
    this.prepareGraphByType(statsResults);
  }

  private prepareGraphByType(statsResults: __esri.FeatureSet) {
    const data = statsResults.features.map((feature) => feature.attributes.value);
    const labels = statsResults.features.map((feature) => feature.attributes.BldStatus).map((label) => {
      const newLabel = this.overviewService.uniqueValueInfos.find(o => o.value === label);
      return newLabel?.label ?? label;
    });
    if (this.type === 'pie') {
      this.graph.data[0].values = data;
      this.graph.data[0].labels = labels;
    } else if (this.type === 'bar') {
      this.graph.data[0].x = labels;
      this.graph.data[0].y = data;
    } else if (this.type === 'line') {

    }
  }

  ngOnInit(): void {
    this.graph = {
      data: [{
        type: this.type
      }],
      layout: {
        autosize: true,
        title: 'Building types',
        textinfo: "label+percent",
        textposition: "outside",
        automargin: true,
        legend: { orientation: 'h', side: 'top' }
      },
    };

    this.initializeChart().then(() => {
      if (isDevMode()) {
        console.log("chart initialized");
      }
    });
    console.log(this.type)
  }
}
