import { describe, expect, it } from 'vitest';
import { hasRolePermission } from './api.js';

describe('RBAC server-side', () => {
  it('permite qualquer operação ao administrador', () => expect(hasRolePermission('admin','demands:delete')).toBe(true));
  it('impede colaborador de excluir demandas', () => expect(hasRolePermission('colaborador','demands:delete')).toBe(false));
  it('permite leitura de demandas à diretoria', () => expect(hasRolePermission('diretoria','demands:read')).toBe(true));
  it('impede perfil desconhecido', () => expect(hasRolePermission('invalido','demands:read')).toBe(false));

  it.each([
    ['gestor', 'demands:delete', true],
    ['gestor', 'audit:read', false],
    ['diretoria', 'audit:read', true],
    ['diretoria', 'demands:update', false],
    ['colaborador', 'clients:create', false],
    ['colaborador', 'teams:read', true],
  ])('avalia %s / %s como %s', (role, permission, expected) => {
    expect(hasRolePermission(role, permission)).toBe(expected);
  });
});
