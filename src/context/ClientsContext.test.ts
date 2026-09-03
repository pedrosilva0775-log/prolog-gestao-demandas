import { describe, expect, it } from 'vitest';
import type { ClientDto } from '../contracts';
import { upsertClient } from './ClientsContext';

const client = (id: string, company: string): ClientDto => ({ id, name: 'Contato', company, email: `${id}@example.com`, phone: '', active: true });

describe('ClientsContext', () => {
  it('insere e ordena clientes pela empresa', () => {
    expect(upsertClient([client('2', 'Zulu')], client('1', 'Alfa')).map(item => item.id)).toEqual(['1', '2']);
  });

  it('substitui a versão persistida sem duplicar o cliente', () => {
    const result = upsertClient([client('1', 'Antiga')], client('1', 'Nova'));
    expect(result).toHaveLength(1);
    expect(result[0].company).toBe('Nova');
  });
});
