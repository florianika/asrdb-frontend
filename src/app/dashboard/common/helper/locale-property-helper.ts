import { Log } from '../model/log';

export function getLocaleProperty(object: any, locale: 'en' | 'sq'): string {
  if (!object || !locale) {
    console.warn('getLocaleProperty: Invalid object or locale');
    return '';
  }
  return locale === 'sq' ? object['al'] : object['en'];
}

export function getLogMessage(log?: Log, locale?: 'en' | 'sq'): string {
  if (!log) return '';
  const message = locale === 'sq'
    ? log.qualityMessageAl
    : log.qualityMessageEn;
  return message || '';
}
