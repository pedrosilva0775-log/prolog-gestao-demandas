import { describe, expect, it } from 'vitest';
import { formatCalendarDate, isCalendarDateOverdue, parseLocalCalendarDate, toLocalDateInput } from './date';

describe('datas de calendário', () => {
  it('não retrocede o prazo UTC no fuso local', () => {
    expect(formatCalendarDate('2026-08-24T00:00:00.000Z')).toBe('24/08/2026');
  });

  it('considera o prazo válido até o fim do dia', () => {
    const date = parseLocalCalendarDate('2026-08-24', true);
    expect(date.getHours()).toBe(23);
    expect(date.getDate()).toBe(24);
  });

  it('mantém o dia civil ao gerar valor para input', () => {
    expect(toLocalDateInput(new Date(2026, 7, 24, 0, 30))).toBe('2026-08-24');
  });

  it('só considera vencido depois do fim do dia local', () => {
    expect(isCalendarDateOverdue('2026-08-24T00:00:00.000Z', new Date(2026, 7, 24, 12))).toBe(false);
    expect(isCalendarDateOverdue('2026-08-24T00:00:00.000Z', new Date(2026, 7, 25, 0))).toBe(true);
  });
});
