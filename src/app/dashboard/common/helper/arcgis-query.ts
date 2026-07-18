const ARCGIS_IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const GLOBAL_ID_PATTERN =
  /^\{?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\}?$/i;
const ESCAPED_APOSTROPHE = String.fromCharCode(39, 39);

export const EMPTY_ARCGIS_GLOBAL_ID = '{00000000-0000-0000-0000-000000000000}';

export function arcGisIdentifier(value: string): string {
  if (!ARCGIS_IDENTIFIER_PATTERN.test(value)) {
    throw new Error('Invalid ArcGIS field name');
  }
  return value;
}

export function normalizeArcGisGlobalId(value: string): string {
  const match = value.trim().match(GLOBAL_ID_PATTERN);
  if (!match) {
    throw new Error('Invalid ArcGIS GlobalID');
  }
  return `{${match[1]}}`;
}

export function arcGisStringLiteral(value: string): string {
  return `'${value.replace(/'/g, ESCAPED_APOSTROPHE)}'`;
}

export function arcGisGlobalIdLiteral(value: string): string {
  return arcGisStringLiteral(normalizeArcGisGlobalId(value));
}

export function arcGisGlobalIdEquals(fieldName: string, value: string): string {
  return `${arcGisIdentifier(fieldName)}=${arcGisGlobalIdLiteral(value)}`;
}

export function arcGisGlobalIdNotEquals(
  fieldName: string,
  value: string
): string {
  return `${arcGisIdentifier(fieldName)}<>${arcGisGlobalIdLiteral(value)}`;
}

export function arcGisGlobalIdIn(fieldName: string, values: string[]): string {
  const field = arcGisIdentifier(fieldName);
  if (!values.length) {
    return '1=0';
  }
  return `${field} in (${values.map(arcGisGlobalIdLiteral).join(',')})`;
}

export function arcGisIntegerLiteral(
  value: string | number,
  label = 'ArcGIS numeric identifier'
): string {
  const normalized =
    typeof value === 'number'
      ? value
      : /^-?\d+$/.test(value.trim())
        ? Number(value)
        : Number.NaN;

  if (!Number.isSafeInteger(normalized)) {
    throw new Error(`Invalid ${label}`);
  }
  return normalized.toString();
}

export function arcGisIntegerIn(
  fieldName: string,
  values: Array<string | number>
): string {
  const field = arcGisIdentifier(fieldName);
  if (!values.length) {
    return '1=0';
  }
  return `${field} in (${values.map(value => arcGisIntegerLiteral(value)).join(',')})`;
}

export function arcGisOrderBy(
  fieldName: string,
  direction: 'asc' | 'desc' = 'asc'
): string {
  return `${arcGisIdentifier(fieldName)} ${direction.toUpperCase()}`;
}

export function arcGisStringEquals(fieldName: string, value: string): string {
  return `${arcGisIdentifier(fieldName)}=${arcGisStringLiteral(value)}`;
}

export function arcGisStringContains(fieldName: string, value: string): string {
  return `${arcGisIdentifier(fieldName)} like ${arcGisStringLiteral(`%${value}%`)}`;
}
