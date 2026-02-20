import { Injectable } from '@angular/core';
import { Observable, filter, map, take } from 'rxjs';
import { Building } from '../model/building';
import { CommonBuildingService } from '../../common/service/common-building.service';
import { CommonEntranceService } from '../../common/service/common-entrance.service';
import {
  CommonEntityStructureService,
  EntityAttribute,
} from '../../common/service/common-entity-structure.service';
import { BUILDING_ENTITY } from '../../../common/constants/common-constants';
import { QueryFilter } from '../model/query-filter';
import { RegisterLogService } from '../register-log-view/register-log-table/register-log.service';
import { EntityManageResponse } from '../model/entity-req-res';

type BuildingDataResponse = {
  data?: {
    fields?: EntityAttribute[];
    features?: Array<{ attributes: Building }>;
  };
};

@Injectable()
export class RegisterViewDetailsApiAdapter {
  constructor(
    private commonBuildingService: CommonBuildingService,
    private registerLogService: RegisterLogService,
    private commonEntityStructureService: CommonEntityStructureService,
    private commonEntranceService: CommonEntranceService
  ) {}

  loadBuildingData(id: string): Observable<BuildingDataResponse | null> {
    const filter: Partial<QueryFilter> = {
      where: `GlobalID='${id}'`,
    };
    return this.commonBuildingService.getBuildingData(filter);
  }

  loadBuildingStructure(): Observable<EntityAttribute[]> {
    this.commonEntityStructureService.getEntityStructure(BUILDING_ENTITY);
    return this.commonEntityStructureService.structureLoaded.pipe(
      filter(
        response =>
          !response.loading &&
          !!response.structure &&
          response.type === BUILDING_ENTITY
      ),
      map(response => response.structure ?? []),
      take(1)
    );
  }

  loadLogs(id: string) {
    return this.registerLogService.loadLogs(id);
  }

  updateBuildingReview(
    building: Building,
    reviewStatus: number
  ): Observable<EntityManageResponse> {
    return this.commonBuildingService.updateFeature([
      {
        attributes: {
          ...building,
          BldReview: reviewStatus,
        },
      },
    ]);
  }

  resetBuildingStatus(id: string, callback: () => void) {
    this.commonBuildingService.resetStatus(id, callback);
  }

  resetEntranceStatus(entranceId: string, callback: () => void) {
    this.commonEntranceService.resetStatus(entranceId, callback);
  }
}
