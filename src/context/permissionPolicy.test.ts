import { describe, expect, it } from 'vitest';
import type { RolePermissionsMap, User } from '../types';
import { userCan } from './permissionPolicy';

const roles: RolePermissionsMap = {
  admin: [],
  gestor: ['demands:read', 'reports:export'],
  colaborador: ['demands:read'],
  diretoria: ['reports:read']
};
const user = (overrides: Partial<User> = {}): User => ({
  id: 'u1', name: 'Teste', email: 'teste@local', role: 'colaborador', roleTitle: '',
  department: '', avatar: '', teamIds: [], active: true, ...overrides
});

describe('userCan', () => {
  it('combina permissões do papel com o fallback de demandas por tipo de atividade', () => {
    expect(userCan(user(), roles, 'demands', 'read')).toBe(true);
    expect(userCan(user(), roles, 'projects', 'read', 'PROJETO')).toBe(true);
    expect(userCan(user(), roles, 'reports', 'export')).toBe(false);
  });

  it('prioriza revogações e concessões personalizadas', () => {
    expect(userCan(user({ customPermissions: { granted: ['reports:export'], revoked: ['demands:read'] } }), roles, 'reports', 'export')).toBe(true);
    expect(userCan(user({ customPermissions: { granted: ['reports:export'], revoked: ['demands:read'] } }), roles, 'demands', 'read')).toBe(false);
  });

  it('permite tudo ao admin, exceto revogações explícitas', () => {
    expect(userCan(user({ role: 'admin' }), roles, 'categories', 'admin')).toBe(true);
    expect(userCan(user({ role: 'admin', customPermissions: { granted: [], revoked: ['categories:admin'] } }), roles, 'categories', 'admin')).toBe(false);
  });

  it('nega acesso sem usuário', () => {
    expect(userCan(undefined, roles, 'demands', 'read')).toBe(false);
  });
});
