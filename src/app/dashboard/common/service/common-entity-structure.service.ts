import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EntityType } from '../../../model/RolePermissions.model';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, catchError, of } from 'rxjs';
import {
  BUILDING_ENTITY,
  DWELLING_ENTITY,
  ENTRANCE_ENTITY,
} from '../../../common/constants/common-constants';

type EntityStructure = {
  attributes: EntityAttribute[];
};

export type EntityAttribute = {
  name: string;
  label: {
    en: string;
    al: string;
  };
  display: {
    admin: 'write' | 'read' | 'none';
    supervisor: 'write' | 'read' | 'none';
    enumerator: 'write' | 'read' | 'none';
  };
  selectable: boolean;
  internal: boolean;
  section: string;
  order: number;
};

@Injectable()
export class CommonEntityStructureService {
  private getStructureUrl = '/admin/metadata/entity/{entityType}';

  structureCache: Map<EntityType, any> = new Map();
  structureLoaded = new BehaviorSubject<{
    loading: boolean;
    structure: EntityAttribute[] | null;
    type: EntityType | null;
  }>({
    loading: true,
    structure: null,
    type: null,
  });

  constructor(private httpClient: HttpClient) {}

  public getEntityStructure(entityType: EntityType) {
    this.structureLoaded.next({
      loading: true,
      structure: null,
      type: entityType,
    });
    // Check if the structure is already cached
    if (this.structureCache.has(entityType)) {
      const cachedStructure = this.structureCache.get(entityType);
      this.structureLoaded.next({
        loading: false,
        structure: cachedStructure,
        type: entityType,
      });
      return;
    }

    const url =
      environment.base_url +
      this.getStructureUrl.replace('{entityType}', entityType);
    this.httpClient
      .get<EntityStructure>(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .pipe(
        catchError(error => {
          console.error(
            `Error fetching structure for entity type ${entityType}:`,
            error
          );
          this.structureLoaded.next({
            loading: false,
            structure: null,
            type: entityType,
          });
          return of(null);
        })
      )
      .subscribe((response: EntityStructure | null) => {
        if (response) {
          // sort the attributes by order in ascending order
          response.attributes.sort((a, b) => a.order - b.order);
          this.structureCache.set(entityType, response.attributes);
          this.structureLoaded.next({
            loading: false,
            structure: response.attributes,
            type: entityType,
          });
        }
      });
  }

  public getAllEntityStructures() {
    const requests = [
      this.getEntityStructure(BUILDING_ENTITY),
      this.getEntityStructure(ENTRANCE_ENTITY),
      this.getEntityStructure(DWELLING_ENTITY),
    ];
  }
}
