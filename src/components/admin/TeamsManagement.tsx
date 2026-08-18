/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Team, User } from '../../types';
import { TeamModal } from '../modals/TeamModal';
import { UserModal } from '../modals/UserModal';
import { ClientModal } from '../modals/ClientModal';
import { RbacMatrixView } from './RbacMatrixView';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Mail,
  CheckCircle2,
  UserCheck,
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Ban,
  UserX,
  Phone,
  Building,
  Key,
  Search,
  Building2
} from 'lucide-react';

export const TeamsManagement: React.FC = () => {
  const { teams, users, demands, createUser, updateTeam, deleteTeam, updateUser, deleteUser, showToast, currentUser, hasPermission } = useApp();

  const [activeTab, setActiveTab] = useState<'teams_users' | 'rbac_matrix'>('teams_users');

  // Modals state
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [accessRequests, setAccessRequests] = useState<Array<{ id: string; name: string; email: string; roleTitle?: string; department?: string; branch?: string; teamName?: string }>>([]);
  const [requestRoles, setRequestRoles] = useState<Record<string, User['role']>>({});
  const [userSearch, setUserSearch] = useState('');
  const loadAccessRequests = () => fetch('/api/admin/access-requests', { credentials: 'include' }).then(response => response.ok ? response.json() : []).then(setAccessRequests).catch(() => undefined);
  useEffect(() => { loadAccessRequests(); }, []);

  const decideAccessRequest = async (request: typeof accessRequests[number], status: 'approved' | 'rejected') => {
    const role = requestRoles[request.id] || 'colaborador';
    try {
      const response = await fetch(`/api/admin/users/${request.id}/approval`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, role }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message);
      if (status === 'approved' && !users.some(user => user.id === request.id)) {
        const matchedTeam = teams.find(team => team.name.toLowerCase() === request.teamName?.toLowerCase());
        createUser({ name: request.name, email: request.email, role, roleTitle: request.roleTitle || '', department: request.department || '', branch: request.branch, avatar: '', teamIds: matchedTeam ? [matchedTeam.id] : [], active: true, approvalStatus: 'approved', approvedAt: data.approvedAt, approvedByUserId: currentUser.id }, request.id);
      }
      setAccessRequests(previous => previous.filter(item => item.id !== request.id));
      showToast({ type: status === 'approved' ? 'success' : 'warning', title: status === 'approved' ? 'Acesso aprovado' : 'Solicitação rejeitada', message: `${request.name}: ${status === 'approved' ? `perfil ${role} liberado` : 'acesso não liberado'}.` });
    } catch (error) { showToast({ type: 'error', title: 'Decisão não registrada', message: error instanceof Error ? error.message : 'Tente novamente.' }); }
  };

  const handleCreateTeam = () => {
    setTeamToEdit(null);
    setIsTeamModalOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setTeamToEdit(team);
    setIsTeamModalOpen(true);
  };

  const handleToggleTeamActive = (team: Team) => {
    const nextActive = !team.active;
    updateTeam(team.id, { active: nextActive });
    showToast({
      type: 'info',
      title: nextActive ? 'Equipe Reativada' : 'Equipe Desativada',
      message: `A equipe "${team.name}" foi ${nextActive ? 'reativada' : 'desativada/cancelada'}.`
    });
  };

  const handleDeleteTeam = (team: Team) => {
    const teamDemands = demands.filter((d) => d.teamId === team.id);
    if (teamDemands.length > 0) {
      if (!window.confirm(`Existem ${teamDemands.length} demandas ativas vinculadas a esta equipe. Deseja realmente remover "${team.name}"?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Deseja remover a equipe "${team.name}"?`)) {
        return;
      }
    }
    deleteTeam(team.id);
  };

  const handleCreateUser = () => {
    setUserToEdit(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setIsUserModalOpen(true);
  };

  const handleToggleUserActive = (user: User) => {
    const nextActive = !user.active;
    updateUser(user.id, { active: nextActive });
    showToast({
      type: 'info',
      title: nextActive ? 'Usuário Reativado' : 'Usuário Desativado',
      message: `O colaborador ${user.name} foi ${nextActive ? 'reativado' : 'desativado'}.`
    });
  };

  const handleApproval = async (user: User, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}/approval`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Não foi possível registrar a decisão.');
      updateUser(user.id, { approvalStatus: status, active: status === 'approved', approvedAt: data.approvedAt, approvedByUserId: currentUser.id });
      showToast({ type: status === 'approved' ? 'success' : 'warning', title: status === 'approved' ? 'Acesso aprovado' : 'Acesso rejeitado', message: `${user.name} ${status === 'approved' ? 'já pode acessar o PROLOG' : 'permanece sem acesso ao sistema'}.` });
    } catch (error) {
      showToast({ type: 'error', title: 'Decisão não registrada', message: error instanceof Error ? error.message : 'Tente novamente.' });
    }
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser.id) {
      showToast({
        type: 'error',
        title: 'Ação Bloqueada',
        message: 'Você não pode excluir o perfil de usuário atualmente conectado.'
      });
      return;
    }

    const userDemands = demands.filter((d) => d.assigneeId === user.id);
    if (userDemands.length > 0) {
      if (!window.confirm(`Existem ${userDemands.length} demandas atribuídas a ${user.name}. Deseja excluir mesmo assim?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Deseja excluir o usuário "${user.name}"?`)) {
        return;
      }
    }

    fetch(`/api/admin/users/${user.id}`, { method: 'DELETE', credentials: 'include' }).catch(() => undefined);
    deleteUser(user.id);
  };

  const normalizedSearch = userSearch.trim().toLocaleLowerCase('pt-BR');
  const filteredUsers = users.filter(user => !normalizedSearch || [user.name, user.email, user.roleTitle, user.department, user.role].some(value => String(value || '').toLocaleLowerCase('pt-BR').includes(normalizedSearch)));

  return (
    <div className="space-y-6 pb-8 font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Gestão de Equipes, Usuários & Permissões RBAC</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Estrutura organizacional, liderança de squads e matriz granular de controle de acessos segregados
          </p>
        </div>

        {activeTab === 'teams_users' && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCreateTeam}
              className="flex-1 sm:flex-none justify-center px-3.5 py-2 bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Equipe</span>
            </button>

            <button
              onClick={handleCreateUser}
              className="flex-1 sm:flex-none justify-center px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Usuário</span>
            </button>
            <button onClick={() => setIsClientModalOpen(true)} className="w-full sm:w-auto justify-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm">
              <Building2 className="w-4 h-4" />
              <span>Novo Cliente</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('teams_users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'teams_users'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700'
          }`}
          id="tab-teams-users"
        >
          <Users className="w-4 h-4" />
          <span>Equipes & Colaboradores</span>
        </button>

        <button
          onClick={() => setActiveTab('rbac_matrix')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'rbac_matrix'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700'
          }`}
          id="tab-rbac-matrix"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Matriz de Permissões RBAC</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200">
            Segregado
          </span>
        </button>
      </div>

      {activeTab === 'rbac_matrix' ? (
        <RbacMatrixView />
      ) : (
        <>
          {/* Teams Section */}
          <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span>Equipes Cadastradas</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
              {teams.length}
            </span>
          </h3>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => {
            const teamLeader = users.find((u) => u.id === team.leaderId);
            const teamMembers = users.filter((u) => team.memberIds.includes(u.id));
            const teamDemandsCount = demands.filter((d) => d.teamId === team.id).length;

            return (
              <div
                key={team.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border shadow-xs flex flex-col justify-between space-y-4 transition-all relative ${
                  team.active
                    ? 'border-slate-200 dark:border-slate-800'
                    : 'border-dashed border-slate-300 dark:border-slate-700 opacity-75'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {team.department || 'Geral'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                        {teamDemandsCount} demandas
                      </span>
                      {!team.active && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                          Inativa
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {team.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {team.description || 'Sem descrição cadastrada.'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-3">
                  {teamLeader && (
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-400 font-semibold w-12 shrink-0">Líder:</span>
                      <div className="flex items-center space-x-1.5 font-bold text-slate-800 dark:text-slate-200 min-w-0">
                        <img
                          src={teamLeader.avatar}
                          alt={teamLeader.name}
                          className="w-5 h-5 rounded-full object-cover shrink-0"
                        />
                        <span className="truncate">{teamLeader.name}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-semibold">
                        Membros ({teamMembers.length}):
                      </span>
                      <div className="flex -space-x-2">
                        {teamMembers.slice(0, 5).map((m) => (
                          <img
                            key={m.id}
                            src={m.avatar}
                            alt={m.name}
                            title={`${m.name} - ${m.roleTitle}`}
                            className="w-6 h-6 rounded-full object-cover ring-2 ring-white dark:ring-slate-900"
                          />
                        ))}
                        {teamMembers.length > 5 && (
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold flex items-center justify-center text-slate-700 dark:text-slate-300 ring-2 ring-white dark:ring-slate-900">
                            +{teamMembers.length - 5}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Team Card Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditTeam(team)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors"
                        title="Editar Equipe"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleTeamActive(team)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-colors"
                        title={team.active ? 'Desativar / Cancelar Equipe' : 'Reativar Equipe'}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteTeam(team)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors"
                        title="Excluir Equipe"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {accessRequests.length > 0 && <section className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden"><header className="p-4 border-b border-amber-200 dark:border-amber-900"><h3 className="text-sm font-black text-amber-900 dark:text-amber-200">Solicitações aguardando aprovação</h3><p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Confira os dados e escolha o perfil de acesso antes de liberar.</p></header><div className="divide-y divide-amber-200 dark:divide-amber-900">{accessRequests.map(request => <article key={request.id} className="p-4 bg-white/70 dark:bg-slate-900/50 grid lg:grid-cols-[1fr_1fr_auto] gap-4 items-center"><div><p className="text-sm font-bold text-slate-900 dark:text-white">{request.name}</p><p className="text-xs text-slate-500">{request.email}</p></div><div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs"><p><span className="text-slate-400">Cargo:</span> {request.roleTitle}</p><p><span className="text-slate-400">Setor:</span> {request.department}</p><p><span className="text-slate-400">Filial:</span> {request.branch}</p><p><span className="text-slate-400">Equipe:</span> {request.teamName}</p></div><div className="flex flex-wrap items-center gap-2"><select value={requestRoles[request.id] || 'colaborador'} onChange={event => setRequestRoles(previous => ({ ...previous, [request.id]: event.target.value as User['role'] }))} className="h-9 px-2 rounded-lg border border-slate-300 bg-white text-xs font-bold"><option value="colaborador">Colaborador</option><option value="gestor">Gestor</option><option value="diretoria">Diretoria</option><option value="admin">Administrador</option></select><button onClick={() => decideAccessRequest(request, 'approved')} className="h-9 px-3 rounded-lg bg-emerald-600 text-white text-xs font-bold">Aprovar</button><button onClick={() => decideAccessRequest(request, 'rejected')} className="h-9 px-3 rounded-lg bg-red-50 text-red-700 text-xs font-bold">Rejeitar</button></div></article>)}</div></section>}

      {/* Users Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span>Usuários & Colaboradores</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                {users.length}
              </span>
              {users.some(user => user.approvalStatus === 'pending') && <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">{users.filter(user => user.approvalStatus === 'pending').length} pendente(s)</span>}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Gerencie cargos, atribuições de equipes e permissões operacionais
            </p>
          </div>

          <label className="relative w-full sm:w-72 self-start sm:self-auto">
            <span className="sr-only">Pesquisar usuários</span>
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input value={userSearch} onChange={event => setUserSearch(event.target.value)} type="search" placeholder="Pesquisar usuários..." className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Colaborador</th>
                <th className="p-3.5">Cargo / Função</th>
                <th className="p-3.5">Departamento</th>
                <th className="p-3.5">Perfil de Acesso</th>
                <th className="p-3.5">E-mail Corporativo</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Demandas</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredUsers.map((u) => {
                const userDemandsCount = demands.filter((d) => d.assigneeId === u.id).length;
                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {u.name}
                          </p>
                          {u.phone && (
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />
                              <span>{u.phone}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-medium">{u.roleTitle || 'Colaborador'}</td>
                    <td className="p-3.5 font-medium">{u.department || 'Geral'}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : u.role === 'gestor'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : u.role === 'diretoria'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">{u.email}</td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.id !== 'system-admin' && !u.approvalStatus
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            : u.approvalStatus === 'pending'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : u.approvalStatus === 'rejected'
                            ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                            : u.active
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {u.id !== 'system-admin' && !u.approvalStatus ? 'Sem credencial' : u.approvalStatus === 'pending' ? 'Aguardando aprovação' : u.approvalStatus === 'rejected' ? 'Rejeitado' : u.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-bold text-blue-600 dark:text-blue-400">
                      {userDemandsCount}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {u.id !== 'system-admin' && !u.approvalStatus && <button onClick={() => handleEditUser(u)} className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300">Configurar acesso</button>}
                        {u.approvalStatus === 'pending' && (
                          <>
                            <button onClick={() => handleApproval(u, 'approved')} className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300" title="Aprovar acesso">Aprovar</button>
                            <button onClick={() => handleApproval(u, 'rejected')} className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-300" title="Rejeitar acesso">Rejeitar</button>
                          </>
                        )}
                        <button
                          onClick={() => handleEditUser(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors"
                          title="Editar Usuário"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleUserActive(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-colors"
                          title={u.active ? 'Desativar Usuário' : 'Reativar Usuário'}
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors"
                          title="Excluir Usuário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-sm text-slate-500">Nenhum usuário encontrado para “{userSearch}”.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Reusable Modals */}
      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => {
          setIsTeamModalOpen(false);
          setTeamToEdit(null);
        }}
        teamToEdit={teamToEdit}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setUserToEdit(null);
        }}
        userToEdit={userToEdit}
      />
      <ClientModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} onCreated={client => showToast({ type: 'success', title: 'Cliente cadastrado', message: `${client.company} já pode ser selecionado nas demandas.` })} />
    </div>
  );
};
