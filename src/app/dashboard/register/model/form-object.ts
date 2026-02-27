import { TYPE_PROP } from '../constant/common-constants';
import { EsriDomain } from './esri-response';

export type FormObject = {
  name: string;
  alias: string;
  type: FormObjectType;
  selectOptions: FormObjectSelectOption[] | null;
  originalOptions: FormObjectSelectOption[] | null;
  maxLength?: number;
  hidden?: boolean;
};

export type FormObjectType =
  | 'number'
  | 'text'
  | 'text-area'
  | 'select'
  | 'date';

export type FormFieldValue = string | number | Date | null | undefined;
export type FormObjectSelectOption = {
  text: string;
  value: string | number | null;
};

export function getFormObjectType(
  esriType: string,
  length = 0
): FormObjectType {
  if (esriType === 'esriFieldTypeDate') {
    return 'date';
  }
  if (esriType === 'esriFieldTypeString') {
    return length < 40 ? 'text' : 'text-area';
  }
  return 'number';
}

export function getFormObjectOptions(
  type: FormObjectType,
  domain?: EsriDomain | null
): FormObjectSelectOption[] | null {
  if (type !== 'select' || !domain || !Array.isArray(domain.codedValues)) {
    return null;
  }
  return domain.codedValues
    .map(codedValue => ({
      text: codedValue.name,
      value: codedValue.code,
    }))
    .sort(
      (a, b) => a.value.toString().localeCompare(b.value.toString())
    );
}

export function getValue(
  field: Record<string, unknown>,
  fieldName: string,
  existingBuildingDetails?: Record<string, unknown> | null
): FormFieldValue {
  const value = existingBuildingDetails?.[fieldName] as FormFieldValue;
  if (field[TYPE_PROP] !== 'esriFieldTypeDate' || value == null) {
    return value;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }
  return value;
}
