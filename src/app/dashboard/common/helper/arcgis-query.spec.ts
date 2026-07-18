import {
  arcGisGlobalIdEquals,
  arcGisGlobalIdIn,
  arcGisIntegerLiteral,
  arcGisOrderBy,
  arcGisStringContains,
  arcGisStringLiteral,
  normalizeArcGisGlobalId,
} from './arcgis-query';

describe('ArcGIS query helpers', () => {
  const firstId = 'b4f5a9a0-3198-4a61-b16d-9b8ecf2fd785';
  const secondId = '{65A51F9C-58DF-4C06-BB31-9D7267B899F2}';

  it('normalizes and quotes valid GlobalIDs', () => {
    expect(normalizeArcGisGlobalId(firstId)).toBe(`{${firstId}}`);
    expect(arcGisGlobalIdEquals('GlobalID', firstId)).toBe(
      `GlobalID='{${firstId}}'`
    );
    expect(arcGisGlobalIdIn('GlobalID', [firstId, secondId])).toBe(
      `GlobalID in ('{${firstId}}','${secondId}')`
    );
  });

  it('rejects malformed GlobalIDs and field names', () => {
    expect(() => arcGisGlobalIdEquals('GlobalID', `x' OR 1=1 --`)).toThrow();
    expect(() => arcGisGlobalIdEquals('GlobalID OR 1=1', firstId)).toThrow();
  });

  it('uses a false expression for an empty GlobalID list', () => {
    expect(arcGisGlobalIdIn('GlobalID', [])).toBe('1=0');
  });

  it('accepts only safe integer literals', () => {
    expect(arcGisIntegerLiteral('123')).toBe('123');
    expect(() => arcGisIntegerLiteral('123 OR 1=1')).toThrow();
    expect(() => arcGisIntegerLiteral(Number.MAX_SAFE_INTEGER + 1)).toThrow();
  });

  it('validates order-by fields', () => {
    expect(arcGisOrderBy('StrNameCore', 'desc')).toBe('StrNameCore DESC');
    expect(() => arcGisOrderBy('StrNameCore; DELETE')).toThrow();
  });

  it('escapes apostrophes in text and LIKE values', () => {
    expect(arcGisStringLiteral(`Rruga e Dibrës' Re`)).toBe(
      `'Rruga e Dibrës'' Re'`
    );
    expect(arcGisStringContains('StrNameCore', `Dibrës' Re`)).toBe(
      `StrNameCore like '%Dibrës'' Re%'`
    );
  });
});
