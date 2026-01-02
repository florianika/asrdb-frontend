export function getLocaleProperty(object: any, locale: 'en' | 'sq'): string {
  if (!object || !locale) {
    console.warn('getLocaleProperty: Invalid object or locale');
    return '';
  }
  return locale === 'sq' ? object['al'] : object['en'];
}
