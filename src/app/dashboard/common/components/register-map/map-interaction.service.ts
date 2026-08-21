import MapView from '@arcgis/core/views/MapView';
import { RegisterFilterService } from '../../service/register-filter.service';
import GraphicHit = __esri.GraphicHit;
import { CommonBuildingService } from '../../service/common-building.service';
import { CommonEntranceService } from '../../service/common-entrance.service';
import { catchError, firstValueFrom, of } from 'rxjs';
import { arcGisIntegerLiteral } from '../../helper/arcgis-query';

type ArcGisFeatureAttributes = Record<string, unknown>;

export class MapInteractionService {
  static addScaleWatcher(
    view: MapView,
    onScaleChange: (scale: number) => void
  ) {
    return view.watch('scale', scale => {
      onScaleChange(scale);
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
      const attributes = data?.graphic?.attributes as
        ArcGisFeatureAttributes | undefined;

      if (layerTitle === 'ASRDB Buildings') {
        let buildingGlobalId = MapInteractionService.getAttributeValue(
          attributes,
          'GlobalID'
        );

        if (!buildingGlobalId && objectId !== undefined) {
          buildingGlobalId =
            await MapInteractionService.getBuildingGlobalIdFromObjectId(
              objectId as string | number,
              buildingLayerService
            );
        }

        if (buildingGlobalId) {
          registerFilterService.setBuildingGlobalIdFilter(buildingGlobalId);
        }
        return;
      }

      if (layerTitle === 'ASRDB Entrances') {
        let buildingGlobalId = MapInteractionService.getAttributeValue(
          attributes,
          'EntBldGlobalID'
        );

        if (!buildingGlobalId && objectId !== undefined) {
          buildingGlobalId =
            await MapInteractionService.getEntranceBuildingGlobalIdFromObjectId(
              objectId as string | number,
              entranceLayerService
            );
        }

        if (buildingGlobalId) {
          registerFilterService.setBuildingGlobalIdFilter(buildingGlobalId);
        }
      }
    });
  }

  private static getAttributeValue(
    attributes: ArcGisFeatureAttributes | undefined,
    key: string
  ): string | null {
    const value = attributes?.[key];
    return typeof value === 'string' && value.length ? value : null;
  }

  private static async getBuildingGlobalIdFromObjectId(
    objectId: string | number,
    buildingLayerService: CommonBuildingService
  ): Promise<string | null> {
    const buildingData = await firstValueFrom(
      buildingLayerService
        .getBuildingData({
          where: `OBJECTID=${arcGisIntegerLiteral(objectId, 'ArcGIS ObjectID')}`,
          outFields: ['GlobalID'],
          num: 1,
        })
        .pipe(
          catchError(error => {
            console.error('Error fetching building data:', error);
            return of(null);
          })
        )
    );

    return MapInteractionService.getAttributeValue(
      buildingData?.data?.features?.[0]?.attributes,
      'GlobalID'
    );
  }

  private static async getEntranceBuildingGlobalIdFromObjectId(
    objectId: string | number,
    entranceLayerService: CommonEntranceService
  ): Promise<string | null> {
    const entranceData = await firstValueFrom(
      entranceLayerService
        .getEntranceData({
          where: `OBJECTID=${arcGisIntegerLiteral(objectId, 'ArcGIS ObjectID')}`,
          outFields: ['EntBldGlobalID'],
          num: 1,
        })
        .pipe(
          catchError(error => {
            console.error('Error fetching entrance data:', error);
            return of(null);
          })
        )
    );

    return MapInteractionService.getAttributeValue(
      entranceData?.data?.features?.[0]?.attributes,
      'EntBldGlobalID'
    );
  }
}
