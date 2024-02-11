import { Injectable } from '@angular/core';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { Observable, defer, from } from 'rxjs';
import { QueryFilter } from '../model/query-filter';
import { CommonEsriAuthService } from './common-esri-auth.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CommonBuildingService {

  uniqueValueInfos = [
    {
      value: 1,
      label: 'Permitted (linked to a construction permission)',
      symbol: this.getSymbol('#00BF7')
    },
    {
      value: 2,
      label: 'Under construction (linked to a construction permission)',
      symbol: this.getSymbol('#00B4C5')
    },
    {
      value: 3,
      label: 'Completed (linked to a construction permission)',
      symbol: this.getSymbol('#5BA300')
    },
    {
      value: 4,
      label: 'Existing',
      symbol: this.getSymbol('#89CE00')
    },
    {
      value: 5,
      label: 'Abandoned (residential and non-residential use excluded)',
      symbol: this.getSymbol('#E6308A')
    },
    {
      value: 6,
      label: 'Demolished (not existing anymore)',
      symbol: this.getSymbol('#B51963')
    },
    {
      value: 9,
      label: 'Unknown building status',
      symbol: this.getSymbol('#F57600')
    }
  ];

  get bldLayer(): FeatureLayer {
    return new FeatureLayer({
      title: 'ASRDB Buildings',
      url: 'https://gislab.teamdev.it/arcgis/rest/services/SALSTAT/asrbd/FeatureServer/1',
      outFields: ['*'],
      renderer: {
        type: 'unique-value', // autocasts as new UniqueValueRenderer()
        defaultSymbol: this.getSymbol('#FAFAFA'),
        defaultLabel: 'Other',
        field: 'BldStatus',
        uniqueValueInfos: this.uniqueValueInfos
      } as __esri.RendererProperties,
      minScale: 0,
      maxScale: 0,
      // create a new popupTemplate for the layer
      popupTemplate: {
        // autocasts as new PopupTemplate()
        title: 'ASRDB Building {GlobalID}',
        content: [
          {
            // It is also possible to set the fieldInfos outside of the content
            // directly in the popupTemplate. If no fieldInfos is specifically set
            // in the content, it defaults to whatever may be set within the popupTemplate.
            type: 'fields',
            fieldInfos: [
              {
                fieldName: 'BldStatus',
                label: 'Status'
              }, {
                fieldName: 'BldEntranceRecs',
                label: 'Number of recorded entrances'
              }, {
                fieldName: 'BldDwellingRecs',
                label: 'Number of recorded dwellings'
              }
            ]
          }
        ]
      }
    });
  }

  constructor(private esriAuthService: CommonEsriAuthService, private httpClient: HttpClient) {
  }

  getSymbol(color: string) {
    return {
      type: 'simple-fill', // autocasts as new SimpleFillSymbol()
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

  createFeature(feature: any) {
    const addFeatureLayerURL = this.bldLayer.url + 'addFeatures';
    this.httpClient.post(addFeatureLayerURL, feature);
  }

  private async fetchBuildingData(filter?: Partial<QueryFilter>): Promise<{count: number, data: any, globalIds: string[]} | null> {
    const dataQuery = this.bldLayer.createQuery();
    dataQuery.start = filter?.start ?? 0;
    dataQuery.num = filter?.num ?? 5;
    dataQuery.where = filter?.where ?? '1=1';
    dataQuery.outFields = filter?.outFields ?? ['*'];
    dataQuery.returnGeometry = false;
    dataQuery.orderByFields = filter?.orderByFields ?? ['BldStatus'];
    dataQuery.outStatistics = [];

    const globalIdQuery = this.bldLayer.createQuery();
    globalIdQuery.where = filter?.where ?? '1=1';
    globalIdQuery.outFields = ['GlobalID'];
    globalIdQuery.returnGeometry = false;
    globalIdQuery.outStatistics = [];

    try {
      const featureCount = await this.bldLayer.queryFeatureCount(dataQuery);
      const features = await (await this.bldLayer.queryFeatures(dataQuery)).toJSON();
      const globalIds = (await (await this.bldLayer.queryFeatures(globalIdQuery)).toJSON()).features.map((o: any) => o.attributes['GlobalID']);

      return {
        count: featureCount,
        data: features,
        globalIds
      };
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
