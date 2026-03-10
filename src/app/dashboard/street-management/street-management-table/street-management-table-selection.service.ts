import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { QueryFilter } from '../../register/model/query-filter';
import { RegisterFilterService } from '../../register/register-table-view/register-filter.service';
import { CommonBuildingService } from '../../common/service/common-building.service';
import { CommonEntranceService } from '../../common/service/common-entrance.service';

type ArcGisAttributes = Record<string, unknown>;
type ArcGisFeature = { attributes: ArcGisAttributes };
type ArcGisResponse = { data?: { features?: ArcGisFeature[] } } | null;

@Injectable()
export class StreetManagementTableSelectionService {
  constructor(
    private commonEntranceService: CommonEntranceService,
    private commonBuildingService: CommonBuildingService,
    private registerFilterService: RegisterFilterService
  ) {}

  loadEntranceCountByStreet(streetIds: string[]): Observable<Map<string, number>> {
    if (!streetIds.length) {
      return of(new Map<string, number>());
    }

    const filter: Partial<QueryFilter> = {
      outFields: ['EntStrGlobalID'],
      where: `${this.buildInClause('EntStrGlobalID', streetIds)} AND EntQuality <> 0`,
      start: 0,
      num: 20000,
    };

    return this.commonEntranceService.getEntranceData(filter).pipe(
      map(response => this.mapEntranceCounts(response)),
      catchError(() => of(new Map<string, number>()))
    );
  }

  syncRegisterMapSelection(streetIds: string[]): Observable<void> {
    if (!streetIds.length) {
      this.resetRegisterSelection();
      return of(void 0);
    }

    const entranceFilter: Partial<QueryFilter> = {
      outFields: ['EntBldGlobalID'],
      where: `${this.buildInClause('EntStrGlobalID', streetIds)} AND EntQuality <> 0`,
      start: 0,
      num: 20000,
    };

    return this.commonEntranceService.getEntranceData(entranceFilter).pipe(
      map(response => this.extractStringValues(response, 'EntBldGlobalID')),
      switchMap(buildingIdsFromEntrances => {
        if (!buildingIdsFromEntrances.length) {
          this.resetRegisterSelection();
          return of(void 0);
        }

        const buildingFilter: Partial<QueryFilter> = {
          outFields: ['GlobalID'],
          where: this.buildInClause('GlobalID', buildingIdsFromEntrances),
          start: 0,
          num: 20000,
        };

        return this.commonBuildingService.getBuildingData(buildingFilter).pipe(
          map(response => this.extractStringValues(response, 'GlobalID')),
          map(buildingIds => {
            this.registerFilterService.setBuildingsGlobalIdFilter(buildingIds);
            this.registerFilterService.updateGlobalIds(buildingIds);
          }),
          catchError(() => {
            this.resetRegisterSelection();
            return of(void 0);
          })
        );
      }),
      catchError(() => {
        this.resetRegisterSelection();
        return of(void 0);
      })
    );
  }

  private mapEntranceCounts(response: ArcGisResponse): Map<string, number> {
    const counts = new Map<string, number>();
    const features = response?.data?.features ?? [];

    features.forEach(feature => {
      const streetId = feature.attributes['EntStrGlobalID'];
      if (typeof streetId !== 'string' || !streetId) {
        return;
      }
      counts.set(streetId, (counts.get(streetId) ?? 0) + 1);
    });

    return counts;
  }

  private extractStringValues(response: ArcGisResponse, key: string): string[] {
    const features = response?.data?.features ?? [];
    return Array.from(
      new Set(
        features
          .map(feature => feature.attributes?.[key])
          .filter((value): value is string => typeof value === 'string' && !!value)
      )
    );
  }

  private buildInClause(column: string, ids: string[]): string {
    return `${column} in (${ids.map(id => `'${id}'`).join(',')})`;
  }

  private resetRegisterSelection() {
    this.registerFilterService.resetFilter();
    this.registerFilterService.updateGlobalIds([]);
  }
}
