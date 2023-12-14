import { Injectable } from '@angular/core';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { Observable, Subscriber, TeardownLogic, defer, from, takeUntil } from 'rxjs';
import { Subject } from 'rxjs/internal/Subject';
import { AuthStateService } from 'src/app/common/services/auth-state.service';
import esriId from "@arcgis/core/identity/IdentityManager";
import esriConfig from "@arcgis/core/config"
import { QueryFilter } from '../model/query-filter';
import { CommonEsriAuthService } from './common-esri-auth.service';

@Injectable({
  providedIn: 'root'
})
export class CommonBuildingService {

  uniqueValueInfos = [
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
  ];

  get bldLayer(): FeatureLayer {
    return new FeatureLayer({
      title: "ASRDB Buildings",
      url: "https://gislab.teamdev.it/arcgis/rest/services/SALSTAT/asrbd/FeatureServer/1",
      outFields: ["*"],
      renderer: {
        type: "unique-value", // autocasts as new UniqueValueRenderer()
        defaultSymbol: this.getSymbol("#FAFAFA"),
        defaultLabel: "Other",
        field: "BldStatus",
        uniqueValueInfos: this.uniqueValueInfos
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
  }

  constructor(private esriAuthService: CommonEsriAuthService) {
  }

  getSymbol(color: string) {
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

  getBuildingData(filter?: Partial<QueryFilter>): Observable<any> {
    return defer(() => from(this.fetchBuildingData(filter)));
  }

  private async fetchBuildingData(filter?: Partial<QueryFilter>): Promise<{count: number, data: any} | null> {
    const query = this.bldLayer.createQuery();
    query.start = filter?.start ?? 0;
    query.num = filter?.num ?? 5;
    query.where = filter?.where ?? "1=1";
    query.outFields = filter?.outFields ?? ["*"];
    query.returnGeometry = false;
    query.orderByFields = filter?.orderByFields ?? [`BldStatus`];
    query.outStatistics = [];

    try {
      const featureCount = await this.bldLayer.queryFeatureCount(query);
      const features = await (await this.bldLayer.queryFeatures(query)).toJSON();

      return {
        count: featureCount,
        data: features
      }
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
