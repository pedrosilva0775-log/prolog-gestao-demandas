import { describe, expect, it } from 'vitest';
import { ALL_RBAC_PERMISSIONS, INITIAL_ROLE_PERMISSIONS } from './initialData';

describe('permissões de comentários', () => {
  it('expõe todas as ações na matriz RBAC', () => {
    expect(ALL_RBAC_PERMISSIONS.filter(item => item.module === 'comments').map(item => item.id)).toEqual([
      'comments:read', 'comments:create', 'comments:edit', 'comments:admin'
    ]);
  });

  it('permite edição própria ao colaborador e gestão completa ao gestor', () => {
    expect(INITIAL_ROLE_PERMISSIONS.colaborador).toEqual(expect.arrayContaining(['comments:read', 'comments:create', 'comments:edit']));
    expect(INITIAL_ROLE_PERMISSIONS.colaborador).not.toContain('comments:admin');
    expect(INITIAL_ROLE_PERMISSIONS.gestor).toContain('comments:admin');
  });
});
