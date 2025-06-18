// Utility to format a date string (YYYY-MM-DD or ISO) to dd/mm/yyyy
export function formatDateDMY(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const datePart = dateStr.split('T')[0];
  const [y, m, d] = datePart.split('-');
  if (y && m && d) return `${d}/${m}/${y}`;
  return datePart;
}
