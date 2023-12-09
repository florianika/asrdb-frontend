import { Injectable } from '@angular/core';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { Observable, defer, from } from 'rxjs';
import { QueryFilter } from '../model/query-filter';
import { CommonEsriAuthService } from './common-esri-auth.service';

@Injectable({
  providedIn: 'root'
})
export class CommonDwellingBuildingService {

  get entLayer(): FeatureLayer {
    return new FeatureLayer({
      title: "ASRDB Dwellings",
      url: "https://gislab.teamdev.it/arcgis/rest/services/SALSTAT/asrbd/FeatureServer/2",
      outFields: ["*"],
      minScale: 0,
      maxScale: 0,
      // create a new popupTemplate for the layer
      popupTemplate: {
        // autocasts as new PopupTemplate()
        title: "ASRDB Dwelling {GlobalID}",
        content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed porttitor mi nec urna rutrum maximus. Maecenas vulputate rutrum ex, sed vulputate odio finibus quis. Sed sed sapien sed arcu facilisis sollicitudin in eu mi."
      }
    });
  }

  constructor(private esriAuthService: CommonEsriAuthService) {
  }

  getDwellings(filter?: Partial<QueryFilter>): Observable<any> {
    return defer(() => from(this.fetchDwellingsData(filter)));
  }

  private async fetchDwellingsData(filter?: Partial<QueryFilter>): Promise<{count: number, data: any} | null> {
    const query = this.entLayer.createQuery();
    query.start = filter?.start ?? 0;
    query.num = filter?.num ?? 5;
    query.where = filter?.where ?? "1=1";
    query.outFields = filter?.outFields ?? ["*"];
    query.returnGeometry = false;
    query.orderByFields = filter?.orderByFields ?? [`DwlFloor`];
    query.outStatistics = [];

    try {
      const featureCount = await this.entLayer.queryFeatureCount(query);
      const features = await (await this.entLayer.queryFeatures(query)).toJSON();

      return {
        count: featureCount,
        data: features
      }
    } catch (e) {
      return null;
    }
  }
}
