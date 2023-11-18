import { Component, OnInit } from '@angular/core';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { EChartsOption } from 'echarts';

@Component({
  selector: 'asrdb-graphs',
  templateUrl: './graphs.component.html',
  styleUrls: ['./graphs.component.css']
})
export class GraphsComponent implements OnInit {

  private getSymbol(color: string) {
    return {
      type: "simple-fill", // autocasts as new SimpleFillSymbol()
      color: color,
      outline: {
        // autocasts as new SimpleLineSymbol()
        color: color,
        width: 1
      }
    };
  }

  bldlayer: FeatureLayer = new FeatureLayer({
    title: "ASRDB Buildings",
    url: "https://gislab.teamdev.it/arcgis/rest/services/SALSTAT/asrbd/FeatureServer/1",
    outFields: ["*"],
    renderer: {
      type: "unique-value", // autocasts as new UniqueValueRenderer()
      defaultSymbol: this.getSymbol("#FAFAFA"),
      defaultLabel: "Other",
      field: "BldStatus",
      uniqueValueInfos: [
        {
          value: 1,
          label: "Permitted (linked to a construction permission)",
          symbol: this.getSymbol("#00BF7")
        },
        {
          value: 2,
          label: "Under construction (linked to a construction permission)",
          symbol: this.getSymbol("#00B4C5")
        },
        {
          value: 3,
          label: "Completed (linked to a construction permission)",
          symbol: this.getSymbol("#5BA300")
        },
        {
          value: 4,
          label: "Existing",
          symbol: this.getSymbol("#89CE00")
        },
        {
          value: 5,
          label: "Abandoned (residential and non-residential use excluded)",
          symbol: this.getSymbol("#E6308A")
        },
        {
          value: 6,
          label: "Demolished (not existing anymore)",
          symbol: this.getSymbol("#B51963")
        },
        {
          value: 9,
          label: "Unknown building status",
          symbol: this.getSymbol("#F57600")
        }
      ]
    } as __esri.RendererProperties,
    minScale: 0,
    maxScale: 0,
    // create a new popupTemplate for the layer
    popupTemplate: {
      // autocasts as new PopupTemplate()
      title: "ASRDB Building {GlobalID}",
      content: [
        {
          // It is also possible to set the fieldInfos outside of the content
          // directly in the popupTemplate. If no fieldInfos is specifically set
          // in the content, it defaults to whatever may be set within the popupTemplate.
          type: "fields",
          fieldInfos: [
            {
              fieldName: "BldStatus",
              label: "Status"
            }, {
              fieldName: "BldEntranceRecs",
              label: "Number of recorded entrances"
            }, {
              fieldName: "BldDwellingRecs",
              label: "Number of recorded dwellings"
            }
          ]
        }
      ]
    }
  });

  options: EChartsOption | null = null;
  async initializeChart(): Promise<any> {
    const data = await this.getStats(this.bldlayer);
    this.options = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        top: '5%',
        left: 'center'
      },
      series: [
        {
          name: 'Try Pie',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 40,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: data
        }
      ]
    };
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
    console.log(chartData)
    return chartData;
  }

  ngOnInit(): void {
    this.initializeChart().then(() => {
      console.log("chart initialized")
    })
  }
}
