import type { ChecklistItem } from '../types';

export const DEFAULT_CHECKLIST_TITLES = [
  'Etapa 1: Alinhamento inicial de escopo',
  'Etapa 2: Desenvolvimento',
  'Etapa 3: Homologação',
  'Etapa 4: Validação',
  'Etapa 5: Apresentação para a operação',
  'Etapa 6: Implementação'
] as const;

export const DEFAULT_CHECKLIST_TEXT = DEFAULT_CHECKLIST_TITLES.join('\n');

export const createDefaultChecklist = (): ChecklistItem[] =>
  DEFAULT_CHECKLIST_TITLES.map(title => ({
    id: `chk-${globalThis.crypto.randomUUID()}`,
    title,
    completed: false
  }));
