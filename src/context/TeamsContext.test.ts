import { describe, expect, it } from 'vitest';
import type { Team } from '../types';
import { upsertTeam } from './TeamsContext';

const team = (id: string, name: string): Team => ({ id, name, description: '', department: '', leaderId: '', color: '#2563eb', active: true, memberIds: [] });

describe('TeamsContext', () => {
  it('reconcilia a resposta persistida sem duplicar', () => {
    const result = upsertTeam([team('1', 'Antiga')], team('1', 'Nova'));
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Nova');
  });

  it('mantém ordenação por nome', () => {
    expect(upsertTeam([team('2', 'Zulu')], team('1', 'Alfa')).map(item => item.id)).toEqual(['1', '2']);
  });
});
