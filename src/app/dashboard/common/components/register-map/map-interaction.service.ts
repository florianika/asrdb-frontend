import MapView from '@arcgis/core/views/MapView';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { RegisterFilterService } from '../../../register/register-table-view/register-filter.service';
import GraphicHit = __esri.GraphicHit;
import { CommonBuildingService } from '../../service/common-building.service';
import { CommonEntranceService } from '../../service/common-entrance.service';
import { catchError, of } from 'rxjs';

export class MapInteractionService {
  static addZoomWatcher(
    view: MapView,
    buildingLayer: FeatureLayer,
    entranceLayer: FeatureLayer,
    getTotalResults: () => number | null,
    onZoomChange?: (zoom: number) => void,
    maxZoomHide?: number
  ) {
    return view.watch('zoom', zoom => {
      const totalResults = getTotalResults();
      const lessThan10000 = totalResults && totalResults < 10000;
      if (zoom < (maxZoomHide || 15) && !lessThan10000) {
        buildingLayer.visible = false;
        entranceLayer.visible = false;
      } else {
        buildingLayer.visible = true;
        entranceLayer.visible = true;
      }
      if (onZoomChange) {
        onZoomChange(zoom);
      }
    });
  }

  static addPopupHandler(
    view: MapView,
    registerFilterService: RegisterFilterService,
    buildingLayerService: CommonBuildingService,
    entranceLayerService: CommonEntranceService
  ) {
    return view.on('click', async event => {
      // Prevent the default popup
      event.stopPropagation();
      const response = await view.hitTest(event);
      const data = response.results[0] as GraphicHit;
      const layerTitle = data?.layer?.title;
      const objectId = data?.graphic?.attributes['OBJECTID'];
      // load data from the feature using the globalId

      if (layerTitle === 'ASRDB Buildings') {
        buildingLayerService
          .getBuildingData({
            where: `OBJECTID=${objectId}`,
            outFields: ['*'],
            num: 1,
          })
          .pipe(
            catchError((error: any) => {
              console.error('Error fetching building data:', error);
              return of(null);
            })
          )
          .subscribe({
            next: (buildingData: any) => {
              if (!buildingData) {
                return;
              }
              if (buildingData.data?.features?.length > 0) {
                registerFilterService.setBuildingGlobalIdFilter(
                  buildingData.data?.features[0].attributes['GlobalID']
                );
              }
            },
          });
      }
      if (layerTitle === 'ASRDB Entrances') {
        entranceLayerService
          .getEntranceData({
            where: `OBJECTID=${objectId}`,
            outFields: ['*'],
            num: 1,
          })
          .pipe(
            catchError((error: any) => {
              console.error('Error fetching entrance data:', error);
              return of(null);
            })
          )
          .subscribe({
            next: (buildingData: any) => {
              if (!buildingData) {
                return;
              }
              if (buildingData.data?.features?.length > 0) {
                registerFilterService.setBuildingGlobalIdFilter(
                  buildingData.data?.features[0].attributes['GlobalID']
                );
              }
            },
          });
      }
    });
  }
}
