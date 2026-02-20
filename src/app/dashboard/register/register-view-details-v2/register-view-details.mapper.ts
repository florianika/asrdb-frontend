import { Injectable } from '@angular/core';
import { Building } from '../model/building';
import { EntityAttribute } from '../../common/service/common-entity-structure.service';
import { SectionField } from '../constant/common-constants';
import { Section, ViewSection } from './types';
import { getLocaleProperty, getLogMessage } from '../../common/helper/locale-property-helper';
import { Log } from '../register-log-view/model/log';

type BuildingDataResponse = {
  data?: {
    fields?: EntityAttribute[];
    features?: Array<{ attributes: Building }>;
  };
};

@Injectable()
export class RegisterViewDetailsMapper {
  prepareWhereCase(id: string): string {
    return `GlobalID='${id}'`;
  }

  mapBuildingDataResponse(
    response: BuildingDataResponse | null
  ): { building: Building | null; fields: EntityAttribute[] } {
    if (!response) {
      return { building: null, fields: [] };
    }
    const fields = response.data?.fields ?? [];
    const building = response.data?.features?.[0]?.attributes ?? null;
    return { building, fields };
  }

  buildBuildingStructure(
    structure: EntityAttribute[],
    locale: 'en' | 'sq'
  ): ViewSection {
    const visibleFields = structure.reduce(
      (acc, attr: EntityAttribute) => {
        if (attr.section !== 'none' && !attr.internal) {
          const field = {
            title: getLocaleProperty(attr.label, locale),
            propName: attr.name,
            value: '',
            log: '',
            logType: '',
          } as SectionField;

          if (attr.section === 'identification') acc.identifying.push(field);
          else if (attr.section === 'description') acc.describing.push(field);
          else if (attr.section === 'title') acc.title.push(field);
        }
        return acc;
      },
      {
        identifying: [] as SectionField[],
        describing: [] as SectionField[],
        title: [] as SectionField[],
      }
    );

    const sections: Section[] = [
      {
        title: $localize`Identifying Information`,
        entries: visibleFields.identifying,
      },
      {
        title: $localize`Describing Information`,
        entries: visibleFields.describing,
      },
    ];

    return { sections, titleSection: visibleFields.title };
  }

  fillSections(
    structure: ViewSection | null,
    buildingId: string,
    locale: 'en' | 'sq',
    getValue: (propName: keyof Building) => string,
    getLog: (variable: string, id?: string) => Log | undefined
  ) {
    if (!structure) {
      return;
    }
    structure.sections.forEach(section => {
      section.entries.forEach(entry => {
        const log = getLog(entry.propName, buildingId);
        entry.value = getValue(entry.propName as keyof Building);
        entry.log = getLogMessage(log, locale);
        entry.logType = log?.qualityAction ?? '';
      });
    });
  }
}
