export type AuthorizationScope = 'global' | 'module';
export type ModuleRole = 'module_admin' | 'manager' | 'member' | 'viewer';

export const globalRolePermissions: Readonly<Record<string, readonly string[]>> = {
  admin: ['*'],
  gestor: ['demands:read', 'demands:create', 'demands:update', 'demands:delete', 'clients:read', 'clients:create', 'clients:update', 'teams:read', 'teams:create', 'teams:update', 'comments:read', 'comments:create', 'comments:edit', 'comments:admin'],
  diretoria: ['demands:read', 'clients:read', 'teams:read', 'audit:read', 'comments:read', 'comments:create', 'comments:edit', 'comments:admin'],
  colaborador: ['demands:read', 'demands:create', 'demands:update', 'clients:read', 'teams:read', 'comments:read', 'comments:create', 'comments:edit'],
};

export const moduleRolePermissions: Readonly<Record<ModuleRole, readonly string[]>> = {
  module_admin: ['*'],
  manager: ['demands:read', 'demands:create', 'demands:update', 'demands:delete', 'comments:read', 'comments:create', 'comments:edit', 'comments:admin', 'external_requests:read', 'external_requests:manage'],
  member: ['demands:read', 'demands:create', 'demands:update', 'comments:read', 'comments:create', 'comments:edit'],
  viewer: ['demands:read', 'comments:read'],
};

export const knownPermissions = new Set([
  'demands:read', 'demands:create', 'demands:update', 'demands:delete',
  'comments:read', 'comments:create', 'comments:edit', 'comments:admin',
  'clients:read', 'clients:create', 'clients:update',
  'teams:read', 'teams:create', 'teams:update',
  'users:read', 'users:create', 'users:update',
  'configurations:read', 'configurations:update', 'audit:read',
  'modules:read', 'modules:create', 'modules:update', 'modules:members',
  'reports:read', 'reports:create',
  'privacy:manage',
  'external_requests:read', 'external_requests:manage',
]);

const aliases: Readonly<Record<string, readonly string[]>> = {
  'demands:update': ['demands:update', 'demands:edit'],
  'teams:update': ['teams:update', 'users_teams:edit'],
  'teams:read': ['teams:read', 'users_teams:read'],
  'teams:create': ['teams:create', 'users_teams:create'],
  'users:update': ['users:update', 'users', 'users_teams', 'users_teams:edit'],
  'users:read': ['users:read', 'users', 'users_teams', 'users_teams:read'],
  'users:create': ['users:create', 'users', 'users_teams', 'users_teams:create'],
  'configurations:read': ['configurations:read', 'categories:read'],
  'configurations:update': ['configurations:update', 'categories:admin'],
};

const matches = (permissions: readonly string[], permission: string) =>
  (aliases[permission] ?? [permission]).some(candidate => permissions.includes(candidate));

export type AuthorizationInput = {
  permission: string;
  scope: AuthorizationScope;
  globalRole: string;
  moduleRole?: ModuleRole;
  moduleActive?: boolean;
  membershipActive?: boolean;
  grants: readonly string[];
  revocations: readonly string[];
};

export const isAuthorized = (input: AuthorizationInput): boolean => {
  if (!knownPermissions.has(input.permission)) return false;
  if (matches(input.revocations, input.permission)) return false;
  if (input.globalRole === 'admin') return true;

  if (input.scope === 'module') {
    if (!input.moduleActive || !input.membershipActive || !input.moduleRole) return false;
    const rolePermissions = moduleRolePermissions[input.moduleRole] ?? [];
    return rolePermissions.includes('*') || rolePermissions.includes(input.permission) || matches(input.grants, input.permission);
  }

  const rolePermissions = globalRolePermissions[input.globalRole] ?? [];
  return rolePermissions.includes('*') || rolePermissions.includes(input.permission) || matches(input.grants, input.permission);
};

export const effectivePermissions = (input: Omit<AuthorizationInput, 'permission'>) =>
  [...knownPermissions].filter(permission => isAuthorized({ ...input, permission })).sort();
