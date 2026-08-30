/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { AppSelect } from '../common/AppSelect';
import { useApp } from '../../context/AppContext';
import { UserRole, RbacModule, RbacAction, RbacPermissionRule } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Users,
  Eye,
  PlusCircle,
  Edit3,
  Trash2,
  CheckSquare,
  Download,
  Sliders,
  Filter,
  Lock,
  Unlock,
  Info,
  Crown,
  BookOpen,
  Cog,
  FileSpreadsheet,
  Activity,
  Layers,
  HelpCircle,
  Sparkles,
  UserCheck
} from 'lucide-react';

const ROLE_INFO: Record<UserRole, { label: string; desc: string; color: string; badgeBg: string }> = {
  admin: {
    label: 'Administrador',
    desc: 'Acesso irrestrito a governança, parametrizações globais, auditoria e todas as atividades.',
    color: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800'
  },
  gestor: {
    label: 'Gestor de Equipe',
    desc: 'Gestão executiva de projetos, melhorias, tarefas, prazos, orçamentos e relatórios departamentais.',
    color: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800'
  },
  colaborador: {
    label: 'Colaborador',
    desc: 'Acesso operacional para execução de tarefas e melhorias, atualização de status e checklists.',
    color: 'text-slate-600 dark:text-slate-400',
    badgeBg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  },
  diretoria: {
    label: 'Diretoria / C-Level',
    desc: 'Visão executiva abrangente, aprovação de marcos, prorrogações, auditoria e relatórios.',
    color: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800'
  }
};

const ACTION_CONFIG: Record<RbacAction, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  read: { label: 'Leitura', icon: Eye, color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' },
  create: { label: 'Criação', icon: PlusCircle, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800' },
  edit: { label: 'Edição', icon: Edit3, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800' },
  delete: { label: 'Exclusão', icon: Trash2, color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800' },
  approve: { label: 'Aprovação', icon: CheckSquare, color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800' },
  export: { label: 'Exportação', icon: Download, color: 'text-cyan-700 dark:text-cyan-300', bg: 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800' },
  admin: { label: 'Admin', icon: Sliders, color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800' }
};

const MODULE_GROUPS = [
  { id: 'all', label: 'Todos os Módulos & Atividades', icon: Layers },
  { id: 'activities', label: 'Segregação de Atividades (Projetos / Melhorias / Tarefas)', icon: Crown },
  { id: 'demands_general', label: 'Gestão de Demandas & Fluxos', icon: CheckSquare },
  { id: 'reports_dashboards', label: 'Dashboard & Relatórios Executivos', icon: FileSpreadsheet },
  { id: 'governance_risk', label: 'Riscos, SLAs & Modelos', icon: Activity },
  { id: 'system_admin', label: 'Administração & Integrações', icon: Sliders }
];

export const RbacMatrixView: React.FC = () => {
  const {
    allRbacPermissions,
    rolePermissions,
    updateRolePermissions,
    resetRolePermissions,
    users,
    currentUser,
    userHasPermission,
    showToast
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedActionFilter, setSelectedActionFilter] = useState<RbacAction | 'all'>('all');
  const [testUserId, setTestUserId] = useState<string>(currentUser.id);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const testUser = useMemo(() => {
    return users.find((u) => u.id === testUserId) || currentUser;
  }, [users, testUserId, currentUser]);

  // Filter permissions based on search, group, and action
  const filteredPermissions = useMemo(() => {
    return allRbacPermissions.filter((perm) => {
      // Search
      const searchMatch =
        perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perm.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perm.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perm.module.toLowerCase().includes(searchTerm.toLowerCase());

      if (!searchMatch) return false;

      // Action filter
      if (selectedActionFilter !== 'all' && perm.action !== selectedActionFilter) {
        return false;
      }

      // Group filter
      if (selectedGroup === 'activities') {
        return Boolean(perm.activityType);
      }
      if (selectedGroup === 'demands_general') {
        return perm.module === 'demands' || perm.module === 'categories';
      }
      if (selectedGroup === 'reports_dashboards') {
        return perm.module === 'dashboard' || perm.module === 'reports' || perm.module === 'scheduled_reports';
      }
      if (selectedGroup === 'governance_risk') {
        return perm.module === 'risks' || perm.module === 'sla' || perm.module === 'templates';
      }
      if (selectedGroup === 'system_admin') {
        return ['users_teams', 'api_webhooks', 'system_health', 'android', 'audit', 'google_workspace'].includes(perm.module);
      }

      return true;
    });
  }, [allRbacPermissions, searchTerm, selectedGroup, selectedActionFilter]);

  // Handle individual checkbox toggle
  const handleTogglePermission = (role: UserRole, permissionId: string) => {
    // Admin typically holds all permissions, but can be customized
    const currentList = rolePermissions[role] || [];
    const isGranted = currentList.includes(permissionId);

    const updatedList = isGranted
      ? currentList.filter((id) => id !== permissionId)
      : [...currentList, permissionId];

    updateRolePermissions(role, updatedList);
  };

  // Bulk Grant/Revoke in current filter
  const handleBulkAction = (role: UserRole, grant: boolean) => {
    const currentList = new Set(rolePermissions[role] || []);
    filteredPermissions.forEach((p) => {
      if (grant) {
        currentList.add(p.id);
      } else {
        currentList.delete(p.id);
      }
    });

    updateRolePermissions(role, Array.from(currentList));
    showToast({
      type: grant ? 'success' : 'info',
      title: grant ? 'Permissões Concedidas' : 'Permissões Revogadas',
      message: `${grant ? 'Concedidas' : 'Revogadas'} ${filteredPermissions.length} permissões para o perfil ${ROLE_INFO[role].label}.`
    });
  };

  return (
    <div className="space-y-6 pb-12 font-sans" id="rbac-matrix-container">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Matriz de Permissões RBAC (Role-Based Access Control)
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Segregação Total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
            Controle de acessos com segregação granular de funções: <strong>Leitura</strong>, <strong>Criação</strong>, <strong>Edição</strong>, <strong>Exclusão</strong>, <strong>Aprovação</strong>, <strong>Exportação</strong> e <strong>Administração</strong> para cada módulo e tipo de atividade (Projetos, Melhorias e Tarefas).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={() => setIsSimulatorOpen((prev) => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border shadow-xs ${
              isSimulatorOpen
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80'
            }`}
            title="Simular e testar permissões de um usuário específico"
            id="btn-toggle-rbac-simulator"
          >
            <UserCheck className="w-4 h-4" />
            <span>Simulador de Usuário</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Deseja restaurar a matriz RBAC para a configuração padrão de fábrica?')) {
                resetRolePermissions();
              }
            }}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
            title="Restaurar valores padrão originais"
            id="btn-reset-rbac"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrões</span>
          </button>
        </div>
      </div>

      {/* Simulator Card (Collapsible) */}
      {isSimulatorOpen && (
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 shadow-xs space-y-4 animate-in slide-in-from-top-3 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200">
                  Simulação de Acessos em Tempo Real
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Selecione um usuário para inspecionar permissões efetivas (herança de perfil + sobrescritas personalizadas)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-300 shrink-0">
                Colaborador Testado:
              </span>
              <AppSelect
                value={testUserId}
                onChange={(e) => setTestUserId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                id="select-rbac-simulator-user"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.roleTitle || u.role} ({ROLE_INFO[u.role].label})
                  </option>
                ))}
              </AppSelect>
            </div>
          </div>

          {/* User Status Bar */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-900 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <UserAvatar name={testUser.name} src={testUser.avatar} className="w-8 h-8 rounded-full ring-2 ring-blue-500 text-[10px]" />
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">{testUser.name}</span>
                <span className="text-slate-500 dark:text-slate-400 ml-1.5 font-medium">({testUser.email})</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${ROLE_INFO[testUser.role].badgeBg}`}>
                {ROLE_INFO[testUser.role].label}
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-semibold">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {allRbacPermissions.filter((p) => userHasPermission(testUser, p.module, p.action, p.activityType)).length} Acessos Autorizados
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                <XCircle className="w-3.5 h-3.5" />
                <span>
                  {allRbacPermissions.filter((p) => !userHasPermission(testUser, p.module, p.action, p.activityType)).length} Acessos Bloqueados
                </span>
              </div>
              {testUser.customPermissions && (
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded font-bold">
                  Possui {testUser.customPermissions.granted.length + testUser.customPermissions.revoked.length} regras personalizadas
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Role Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {(Object.keys(ROLE_INFO) as UserRole[]).map((roleKey) => {
          const info = ROLE_INFO[roleKey];
          const grantedCount = (rolePermissions[roleKey] || []).length;
          const totalCount = allRbacPermissions.length;
          const percentage = Math.round((grantedCount / totalCount) * 100);
          const usersInRole = users.filter((u) => u.role === roleKey).length;

          return (
            <div
              key={roleKey}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${info.badgeBg}`}>
                    {info.label}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {usersInRole} {usersInRole === 1 ? 'membro' : 'membros'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {info.desc}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Cobertura RBAC:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {grantedCount} / {totalCount} ({percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      roleKey === 'admin'
                        ? 'bg-purple-600'
                        : roleKey === 'gestor'
                        ? 'bg-blue-600'
                        : roleKey === 'diretoria'
                        ? 'bg-amber-500'
                        : 'bg-slate-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar permissão, módulo ou atividade (ex: projeto, editar, relatórios)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
              id="input-search-rbac-permissions"
            />
          </div>

          {/* Action Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedActionFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                selectedActionFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Todas as Ações ({allRbacPermissions.length})
            </button>
            {(Object.keys(ACTION_CONFIG) as RbacAction[]).map((actionKey) => {
              const act = ACTION_CONFIG[actionKey];
              const count = allRbacPermissions.filter((p) => p.action === actionKey).length;
              return (
                <button
                  key={actionKey}
                  onClick={() => setSelectedActionFilter(actionKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1 border ${
                    selectedActionFilter === actionKey
                      ? `${act.bg} ${act.color} ring-1 ring-blue-500 font-extrabold`
                      : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <act.icon className="w-3 h-3" />
                  <span>{act.label} ({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Module Group Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800">
          {MODULE_GROUPS.map((group) => {
            const Icon = group.icon;
            const isSelected = selectedGroup === group.id;
            return (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{group.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Permission Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span>Tabela de Permissões Granulares</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                {filteredPermissions.length} regras listadas
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Marque ou desmarque as caixas para autorizar ou revogar o acesso em tempo real
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Ações em lote (no filtro atual):</span>
            <button
              onClick={() => handleBulkAction('gestor', true)}
              className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
            >
              + Gestor
            </button>
            <button
              onClick={() => handleBulkAction('colaborador', true)}
              className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            >
              + Colaborador
            </button>
            <button
              onClick={() => handleBulkAction('diretoria', true)}
              className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-100 rounded-lg border border-amber-200 dark:border-amber-800 transition-colors"
            >
              + Diretoria
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5 min-w-[280px]">Módulo & Tipo de Atividade</th>
                <th className="p-3.5 min-w-[120px]">Tipo de Ação</th>
                <th className="p-3.5 text-center min-w-[100px]">
                  <div className="flex flex-col items-center">
                    <span className="text-purple-700 dark:text-purple-300 font-extrabold uppercase">Admin</span>
                    <span className="text-[10px] text-slate-400 font-normal">Acesso Total</span>
                  </div>
                </th>
                <th className="p-3.5 text-center min-w-[100px]">
                  <div className="flex flex-col items-center">
                    <span className="text-blue-700 dark:text-blue-300 font-extrabold uppercase">Gestor</span>
                    <span className="text-[10px] text-slate-400 font-normal">Gestão & Time</span>
                  </div>
                </th>
                <th className="p-3.5 text-center min-w-[100px]">
                  <div className="flex flex-col items-center">
                    <span className="text-slate-700 dark:text-slate-300 font-extrabold uppercase">Colaborador</span>
                    <span className="text-[10px] text-slate-400 font-normal">Operacional</span>
                  </div>
                </th>
                <th className="p-3.5 text-center min-w-[100px]">
                  <div className="flex flex-col items-center">
                    <span className="text-amber-700 dark:text-amber-300 font-extrabold uppercase">Diretoria</span>
                    <span className="text-[10px] text-slate-400 font-normal">C-Level / Visão</span>
                  </div>
                </th>
                {isSimulatorOpen && (
                  <th className="p-3.5 text-center min-w-[120px] bg-blue-50/50 dark:bg-blue-950/40 border-l border-blue-200 dark:border-blue-900">
                    <div className="flex flex-col items-center">
                      <span className="text-blue-700 dark:text-blue-300 font-extrabold">Efetivo no Teste</span>
                      <span className="text-[10px] text-blue-500 font-semibold truncate max-w-[100px]">{testUser.name.split(' ')[0]}</span>
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredPermissions.map((perm) => {
                const actConfig = ACTION_CONFIG[perm.action];
                const isTestUserAuthorized = userHasPermission(testUser, perm.module, perm.action, perm.activityType);

                return (
                  <tr
                    key={perm.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Module & Activity Info */}
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {perm.name}
                          </span>
                          {perm.activityType && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                                perm.activityType === 'PROJETO'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                  : perm.activityType === 'MELHORIA'
                                  ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                              }`}
                            >
                              {perm.activityType}
                            </span>
                          )}
                          <code className="text-[10px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                            {perm.id}
                          </code>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {perm.description}
                        </p>
                      </div>
                    </td>

                    {/* Action Badge */}
                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${actConfig.bg} ${actConfig.color}`}>
                        <actConfig.icon className="w-3 h-3" />
                        <span>{actConfig.label}</span>
                      </span>
                    </td>

                    {/* Admin Checkbox */}
                    <td className="p-3.5 text-center">
                      <label className="inline-flex items-center justify-center cursor-pointer p-1">
                        <input
                          type="checkbox"
                          checked={(rolePermissions.admin || []).includes(perm.id)}
                          onChange={() => handleTogglePermission('admin', perm.id)}
                          className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer accent-purple-600"
                        />
                      </label>
                    </td>

                    {/* Gestor Checkbox */}
                    <td className="p-3.5 text-center">
                      <label className="inline-flex items-center justify-center cursor-pointer p-1">
                        <input
                          type="checkbox"
                          checked={(rolePermissions.gestor || []).includes(perm.id)}
                          onChange={() => handleTogglePermission('gestor', perm.id)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        />
                      </label>
                    </td>

                    {/* Colaborador Checkbox */}
                    <td className="p-3.5 text-center">
                      <label className="inline-flex items-center justify-center cursor-pointer p-1">
                        <input
                          type="checkbox"
                          checked={(rolePermissions.colaborador || []).includes(perm.id)}
                          onChange={() => handleTogglePermission('colaborador', perm.id)}
                          className="w-4 h-4 text-slate-600 rounded border-slate-300 focus:ring-slate-500 cursor-pointer accent-slate-600"
                        />
                      </label>
                    </td>

                    {/* Diretoria Checkbox */}
                    <td className="p-3.5 text-center">
                      <label className="inline-flex items-center justify-center cursor-pointer p-1">
                        <input
                          type="checkbox"
                          checked={(rolePermissions.diretoria || []).includes(perm.id)}
                          onChange={() => handleTogglePermission('diretoria', perm.id)}
                          className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer accent-amber-600"
                        />
                      </label>
                    </td>

                    {/* Test User Simulation Status */}
                    {isSimulatorOpen && (
                      <td className="p-3.5 text-center bg-blue-50/30 dark:bg-blue-950/20 border-l border-blue-100 dark:border-blue-900/60">
                        {isTestUserAuthorized ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Permitido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">
                            <XCircle className="w-3 h-3" />
                            Negado
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}

              {filteredPermissions.length === 0 && (
                <tr>
                  <td colSpan={isSimulatorOpen ? 7 : 6} className="p-8 text-center text-slate-500">
                    <p className="font-semibold text-xs">Nenhuma permissão corresponde aos filtros aplicados.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Experimente limpar a busca ou selecionar outro grupo de módulos.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
