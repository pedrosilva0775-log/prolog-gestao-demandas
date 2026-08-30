import type { RbacAction, RbacModule, RolePermissionsMap, User } from '../types';

export type ActivityType = 'PROJETO' | 'MELHORIA' | 'TAREFA' | 'GERAL';

export function userCan(
  user: User | undefined,
  rolePermissions: RolePermissionsMap,
  module: RbacModule,
  action: RbacAction,
  activityType?: ActivityType
): boolean {
  if (!user) return false;

  const targetModule = activityType && ['PROJETO', 'MELHORIA', 'TAREFA'].includes(activityType)
    ? (activityType === 'PROJETO' ? 'projects' : activityType === 'MELHORIA' ? 'improvements' : 'tasks')
    : module;
  const permissionKey = `${targetModule}:${action}`;

  if (user.customPermissions?.revoked?.includes(permissionKey)) return false;
  if (user.role === 'admin') return true;
  if (user.customPermissions?.granted?.includes(permissionKey)) return true;

  const permissionsForRole = rolePermissions[user.role] || [];
  if (permissionsForRole.includes(permissionKey)) return true;
  return ['projects', 'improvements', 'tasks'].includes(targetModule)
    && permissionsForRole.includes(`demands:${action}`);
}
