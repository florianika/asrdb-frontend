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
