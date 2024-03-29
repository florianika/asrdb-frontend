export function getDate(date: string | null) {
  if (!date) {
    return '';
  }
  const d = new Date(date);
  return d.getDate().toString().padStart(2, '0')
    + '/'
    + (d.getMonth() + 1).toString().padStart(2, '0')
    + '/'
    + d.getFullYear();
}

export const MY_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY',
  },
};
