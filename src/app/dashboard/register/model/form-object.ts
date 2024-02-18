export type FormObject = {
  name: string,
  alias: string,
  type: FormObjectType,
  selectOptions: FormObjectSelectOption[] | null
}

export type FormObjectType = 'number' | 'text' | 'text-area' | 'select';
export type FormObjectSelectOption = {
  text: string,
  value: string | number
};
export type EsriDomain = {
  codedValues: EsriCodedValue[]
  name: string
  type: string
}
export type EsriCodedValue = { code: number, name: string };

export function getFormObjectType(esriType: string, length = 0): FormObjectType {
  if (esriType === 'esriFieldTypeString') {
    return length < 40 ? 'text' : 'text-area';
  }
  return 'number';
}

export function getFormObjectOptions(type: FormObjectType, domain: EsriDomain): FormObjectSelectOption[] | null {
  if (type !== 'select' || !domain || !Array.isArray(domain.codedValues)) {
    return null;
  }
  return domain.codedValues.map(codedValue => ({
    text: codedValue.name,
    value: codedValue.code
  }));
}
