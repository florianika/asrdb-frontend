import { getLocaleProperty, getLogMessage } from './locale-property-helper';
import { Log } from '../../register/register-log-view/model/log';
import { BUILDING_ENTITY } from '../../../common/constants/common-constants';

describe('locale-property-helper (smoke)', () => {
  it('should return localized field value', () => {
    const label = { en: 'Name', al: 'Emri' };

    expect(getLocaleProperty(label, 'en')).toBe('Name');
    expect(getLocaleProperty(label, 'sq')).toBe('Emri');
  });

  it('should return localized log message', () => {
    const log: Log = {
      id: '1',
      ruleId: 1,
      reference: 'ref',
      entityType: BUILDING_ENTITY,
      qualityAction: 'AUT',
      qualityStatus: 'PENDING',
      qualityMessageAl: 'Mesazh',
      qualityMessageEn: 'Message',
      errorLevel: 'LOW',
      createdUser: 'u',
      createdTimestamp: '2026-01-01T00:00:00Z',
    };

    expect(getLogMessage(log, 'en')).toBe('Message');
    expect(getLogMessage(log, 'sq')).toBe('Mesazh');
  });
});
