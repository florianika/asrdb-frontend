import { of } from 'rxjs';
import MapView from '@arcgis/core/views/MapView';

import { MapInteractionService } from './map-interaction.service';
import { RegisterFilterService } from '../../../register/register-table-view/register-filter.service';
import { CommonBuildingService } from '../../service/common-building.service';
import { CommonEntranceService } from '../../service/common-entrance.service';

type ClickHandler = (event: { stopPropagation: () => void }) => Promise<void>;

describe('MapInteractionService', () => {
  let clickHandler: ClickHandler;
  let viewMock: jasmine.SpyObj<MapView>;
  let registerFilterServiceMock: jasmine.SpyObj<RegisterFilterService>;
  let buildingServiceMock: jasmine.SpyObj<CommonBuildingService>;
  let entranceServiceMock: jasmine.SpyObj<CommonEntranceService>;

  beforeEach(() => {
    viewMock = jasmine.createSpyObj<MapView>('MapView', ['on', 'hitTest']);
    registerFilterServiceMock = jasmine.createSpyObj<RegisterFilterService>(
      'RegisterFilterService',
      ['setBuildingGlobalIdFilter']
    );
    buildingServiceMock = jasmine.createSpyObj<CommonBuildingService>(
      'CommonBuildingService',
      ['getBuildingData']
    );
    entranceServiceMock = jasmine.createSpyObj<CommonEntranceService>(
      'CommonEntranceService',
      ['getEntranceData']
    );

    viewMock.on.and.callFake(
      ((_name: string, handler: unknown) => {
        clickHandler = handler as ClickHandler;
        return { remove: () => undefined } as __esri.Handle;
      }) as never
    );
  });

  it('sets building filter when building popup contains GlobalID', async () => {
    viewMock.hitTest.and.resolveTo({
      results: [
        {
          layer: { title: 'ASRDB Buildings' },
          graphic: { attributes: { GlobalID: '{BLD-1}' } },
        },
      ],
    } as unknown as __esri.HitTestResult);

    MapInteractionService.addPopupHandler(
      viewMock,
      registerFilterServiceMock,
      buildingServiceMock,
      entranceServiceMock
    );

    await clickHandler({ stopPropagation: () => undefined });

    expect(registerFilterServiceMock.setBuildingGlobalIdFilter).toHaveBeenCalledWith(
      '{BLD-1}'
    );
    expect(buildingServiceMock.getBuildingData).not.toHaveBeenCalled();
  });

  it('resolves building GlobalID from OBJECTID fallback', async () => {
    viewMock.hitTest.and.resolveTo({
      results: [
        {
          layer: { title: 'ASRDB Buildings' },
          graphic: { attributes: { OBJECTID: 123 } },
        },
      ],
    } as unknown as __esri.HitTestResult);
    buildingServiceMock.getBuildingData.and.returnValue(
      of({
        data: {
          features: [{ attributes: { GlobalID: '{BLD-OBJECT}' } }],
        },
      } as never)
    );

    MapInteractionService.addPopupHandler(
      viewMock,
      registerFilterServiceMock,
      buildingServiceMock,
      entranceServiceMock
    );

    await clickHandler({ stopPropagation: () => undefined });

    expect(buildingServiceMock.getBuildingData).toHaveBeenCalled();
    expect(registerFilterServiceMock.setBuildingGlobalIdFilter).toHaveBeenCalledWith(
      '{BLD-OBJECT}'
    );
  });

  it('maps entrance click to owning building through EntBldGlobalID', async () => {
    viewMock.hitTest.and.resolveTo({
      results: [
        {
          layer: { title: 'ASRDB Entrances' },
          graphic: { attributes: { EntBldGlobalID: '{BLD-ENT-1}' } },
        },
      ],
    } as unknown as __esri.HitTestResult);

    MapInteractionService.addPopupHandler(
      viewMock,
      registerFilterServiceMock,
      buildingServiceMock,
      entranceServiceMock
    );

    await clickHandler({ stopPropagation: () => undefined });

    expect(registerFilterServiceMock.setBuildingGlobalIdFilter).toHaveBeenCalledWith(
      '{BLD-ENT-1}'
    );
    expect(entranceServiceMock.getEntranceData).not.toHaveBeenCalled();
  });
});
