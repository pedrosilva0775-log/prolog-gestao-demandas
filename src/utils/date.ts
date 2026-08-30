export const parseLocalCalendarDate = (value: string, endOfDay = false): Date => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return new Date(value);
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
};

export const formatCalendarDate = (value: string, options?: Intl.DateTimeFormatOptions): string =>
  parseLocalCalendarDate(value).toLocaleDateString('pt-BR', options);

export const toLocalDateInput = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isCalendarDateOverdue = (value: string, now = new Date()): boolean =>
  parseLocalCalendarDate(value, true).getTime() < now.getTime();
