import { Injectable } from '@angular/core';
import { SortDirection } from '@angular/material/sort';
import { Chip } from 'src/app/dashboard/common/components/chip/chip.component';
import { QueryFilter } from 'src/app/dashboard/common/model/query-filter';
import {
  StreetFilterKey,
  StreetFilterValues,
} from '../../register/model/street';
import {
  arcGisGlobalIdIn,
  arcGisIntegerIn,
  arcGisIntegerLiteral,
  arcGisOrderBy,
  arcGisStringContains,
  arcGisStringEquals,
} from '../../common/helper/arcgis-query';

export type StreetSortConfig = {
  active?: string;
  direction?: SortDirection;
};

@Injectable({
  providedIn: 'root',
})
export class StreetManagementTableFilterService {
  getDefaultFilterValues(municipality: number): StreetFilterValues {
    return {
      StrMunicipality: municipality,
      StrType: [],
      StrNameCore: '',
      StrNameFull: '',
      GlobalID: '',
      StrAddressID: '',
    };
  }

  normalizeFilterValues(
    rawFilter: Partial<StreetFilterValues> | undefined,
    fallbackMunicipality: number
  ): StreetFilterValues {
    if (!rawFilter) {
      return this.getDefaultFilterValues(fallbackMunicipality);
    }

    const municipality = this.toNumberOrNull(rawFilter.StrMunicipality);
    const streetTypes = this.toNumberArray(rawFilter.StrType);

    return {
      StrMunicipality: municipality ?? fallbackMunicipality,
      StrType: streetTypes,
      StrNameCore: this.toStringValue(rawFilter.StrNameCore),
      StrNameFull: this.toStringValue(rawFilter.StrNameFull),
      GlobalID: this.toStringValue(rawFilter.GlobalID),
      StrAddressID: this.toStringValue(rawFilter.StrAddressID),
    };
  }

  removeFilterValue(
    filter: StreetFilterValues,
    key: StreetFilterKey,
    chipValue?: string
  ): StreetFilterValues {
    if (key === 'StrMunicipality') {
      return { ...filter, StrMunicipality: null };
    }

    if (key === 'StrType') {
      if (!chipValue) {
        return { ...filter, StrType: [] };
      }
      const typeCode = Number.parseInt(chipValue, 10);
      if (Number.isNaN(typeCode)) {
        return { ...filter, StrType: [] };
      }
      return {
        ...filter,
        StrType: filter.StrType.filter(code => code !== typeCode),
      };
    }

    return { ...filter, [key]: '' };
  }

  buildFilterChips(
    filter: StreetFilterValues,
    resolveDisplayValue: (column: StreetFilterKey, value: string) => string
  ): Chip[] {
    const chips: Chip[] = [];

    if (filter.StrMunicipality !== null) {
      chips.push({
        column: 'StrMunicipality',
        value: resolveDisplayValue(
          'StrMunicipality',
          filter.StrMunicipality.toString()
        ),
      });
    }

    filter.StrType.forEach(typeCode => {
      chips.push({
        column: 'StrType',
        value: typeCode.toString(),
      });
    });

    if (filter.StrNameCore) {
      chips.push({
        column: 'StrNameCore',
        value: filter.StrNameCore,
      });
    }

    if (filter.StrNameFull) {
      chips.push({
        column: 'StrNameFull',
        value: filter.StrNameFull,
      });
    }

    if (filter.StrAddressID) {
      chips.push({
        column: 'StrAddressID',
        value: filter.StrAddressID,
      });
    }

    if (filter.GlobalID) {
      chips.push({
        column: 'GlobalID',
        value: filter.GlobalID,
      });
    }

    return chips;
  }

  createStreetQuery(
    filterValues: StreetFilterValues,
    pageIndex: number,
    pageSize: number,
    outFields: string[],
    sort?: StreetSortConfig
  ): Partial<QueryFilter> {
    return {
      start: pageIndex * pageSize,
      num: pageSize,
      outFields,
      where: this.buildWhereCase(filterValues),
      orderByFields: sort?.active
        ? [arcGisOrderBy(sort.active, sort.direction || 'asc')]
        : ['OBJECTID'],
    };
  }

  buildWhereCase(filterValues: StreetFilterValues): string {
    const conditions: string[] = [];

    if (filterValues.GlobalID.trim()) {
      const ids = filterValues.GlobalID.split(',')
        .map(id => id.trim().replace(/^'+|'+$/g, ''))
        .filter(Boolean);
      if (ids.length) {
        conditions.push(arcGisGlobalIdIn('GlobalID', ids));
      }
    }

    if (filterValues.StrMunicipality !== null) {
      conditions.push(
        `StrMunicipality=${arcGisIntegerLiteral(filterValues.StrMunicipality)}`
      );
    }

    if (filterValues.StrType.length) {
      conditions.push(arcGisIntegerIn('StrType', filterValues.StrType));
    }

    if (filterValues.StrNameCore.trim()) {
      conditions.push(
        arcGisStringContains('StrNameCore', filterValues.StrNameCore)
      );
    }

    if (filterValues.StrNameFull.trim()) {
      conditions.push(
        arcGisStringContains('StrNameFull', filterValues.StrNameFull)
      );
    }

    if (filterValues.StrAddressID.trim()) {
      const addressId = Number.parseInt(filterValues.StrAddressID, 10);
      if (Number.isNaN(addressId)) {
        conditions.push(
          arcGisStringEquals('StrAddressID', filterValues.StrAddressID.trim())
        );
      } else {
        conditions.push(`StrAddressID=${arcGisIntegerLiteral(addressId)}`);
      }
    }

    return conditions.length ? conditions.join(' and ') : '1=1';
  }

  private toStringValue(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private toNumberOrNull(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  private toNumberArray(value: unknown): number[] {
    if (Array.isArray(value)) {
      return value
        .map(item => Number.parseInt(item?.toString() ?? '', 10))
        .filter(code => !Number.isNaN(code));
    }

    if (typeof value === 'string' && value.trim()) {
      return value
        .split(',')
        .map(item => Number.parseInt(item.trim(), 10))
        .filter(code => !Number.isNaN(code));
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return [value];
    }

    return [];
  }
}
