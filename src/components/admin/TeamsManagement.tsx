/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Team, User } from '../../types';
import { TeamModal } from '../modals/TeamModal';
import { UserModal } from '../modals/UserModal';
import { ClientModal, ClientRecord } from '../modals/ClientModal';
import { apiClient } from '../../services/apiClient';
import { UserAvatar } from '../common/UserAvatar';
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
  const { teams, users, demands, updateTeam, deleteTeam, updateUser, deleteUser, showToast, currentUser, hasPermission } = useApp();

  // Modals state
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<ClientRecord | null>(null);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [clientsLoading, setClientsLoading] = useState(true);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [statusFeedbackId, setStatusFeedbackId] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  const showStatusFeedback = (id: string) => {
    setStatusFeedbackId(id);
    window.setTimeout(() => setStatusFeedbackId(current => current === id ? null : current), 450);
  };

  const loadClients = async () => {
    setClientsLoading(true);
    try { setClients(await apiClient.clients() as ClientRecord[]); }
    catch (error) { showToast({ type: 'error', title: 'Clientes não carregados', message: error instanceof Error ? error.message : 'Falha ao consultar a base de clientes.' }); }
    finally { setClientsLoading(false); }
  };

  useEffect(() => { void loadClients(); }, []);

  const handleToggleClientActive = async (client: ClientRecord) => {
    try {
      const updated = await apiClient.updateClient(client.id, { active: !client.active }) as ClientRecord;
      setClients(previous => previous.map(item => item.id === client.id ? updated : item));
      window.dispatchEvent(new CustomEvent('prolog:clients-updated'));
      showToast({ type: 'info', title: updated.active ? 'Cliente reativado' : 'Cliente desativado', message: `${updated.company} foi atualizado.` });
    } catch (error) { showToast({ type: 'error', title: 'Cliente não atualizado', message: error instanceof Error ? error.message : 'Falha ao salvar.' }); }
  };

  const handleCreateTeam = () => {
    setTeamToEdit(null);
    setIsTeamModalOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setTeamToEdit(team);
    setIsTeamModalOpen(true);
  };

  const handleToggleTeamActive = async (team: Team) => {
    const nextActive = !team.active;
    try { await updateTeam(team.id, { active: nextActive }); }
    catch (error) { showToast({ type: 'error', title: 'Equipe não atualizada', message: error instanceof Error ? error.message : 'Falha ao salvar.' }); return; }
    showToast({
      type: 'info',
      title: nextActive ? 'Equipe Reativada' : 'Equipe Desativada',
      message: `A equipe "${team.name}" foi ${nextActive ? 'reativada' : 'desativada/cancelada'}.`
    });
    showStatusFeedback(team.id);
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

  const handleToggleUserActive = async (user: User) => {
    const nextActive = !user.active;
    try { await updateUser(user.id, { active: nextActive }); }
    catch (error) { showToast({ type: 'error', title: 'Usuário não atualizado', message: error instanceof Error ? error.message : 'Falha ao salvar.' }); return; }
    showToast({
      type: 'info',
      title: nextActive ? 'Usuário Reativado' : 'Usuário Desativado',
      message: `O colaborador ${user.name} foi ${nextActive ? 'reativado' : 'desativado'}.`
    });
    showStatusFeedback(user.id);
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

    deleteUser(user.id);
  };

  const normalizedSearch = userSearch.trim().toLocaleLowerCase('pt-BR');
  const filteredUsers = users.filter(user => !normalizedSearch || [user.name, user.email, user.roleTitle, user.department, user.role].some(value => String(value || '').toLocaleLowerCase('pt-BR').includes(normalizedSearch)));
  const normalizedTeamSearch = teamSearch.trim().toLocaleLowerCase('pt-BR');
  const filteredTeams = teams.filter(team => !normalizedTeamSearch || [team.name, team.description, team.department].some(value => String(value || '').toLocaleLowerCase('pt-BR').includes(normalizedTeamSearch)));
  const normalizedClientSearch = clientSearch.trim().toLocaleLowerCase('pt-BR');
  const filteredClients = clients.filter(client => !normalizedClientSearch || [client.company, client.name, client.email, client.phone].some(value => String(value || '').toLocaleLowerCase('pt-BR').includes(normalizedClientSearch)));

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
            <button onClick={() => { setClientToEdit(null); setIsClientModalOpen(true); }} className="w-full sm:w-auto justify-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm">
              <Building2 className="w-4 h-4" />
              <span>Novo Cliente</span>
            </button>
        </div>
      </div>

          {/* Teams Section */}
          <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span>Equipes Cadastradas</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
              {teams.length}
            </span>
          </h3>
          <div className="relative w-full max-w-xs"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input value={teamSearch} onChange={event => setTeamSearch(event.target.value)} type="search" placeholder="Pesquisar equipes..." className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500"/></div>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.055 } } }}
        >
          {filteredTeams.map((team) => {
            const teamLeader = users.find((u) => u.id === team.leaderId);
            const teamMembers = users.filter((u) => team.memberIds.includes(u.id));
            const teamDemandsCount = demands.filter((d) => d.teamId === team.id).length;

            return (
              <motion.article
                key={team.id}
                variants={{ hidden: { opacity: 0, y: reduceMotion ? 0 : 10 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
                whileHover={reduceMotion ? undefined : { y: -2, boxShadow: '0 12px 24px rgba(15, 23, 42, 0.10)' }}
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
                        <motion.span initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.85 }} animate={{ opacity: 1, scale: 1 }} className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 transition-colors duration-200">
                          Inativa
                        </motion.span>
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
                        <UserAvatar name={teamLeader.name} src={teamLeader.avatar} className="w-5 h-5 rounded-full text-[8px]" />
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
                        {teamMembers.slice(0, 5).map((m) => <UserAvatar key={m.id} name={m.name} src={m.avatar} title={`${m.name} - ${m.roleTitle}`} className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-slate-900 text-[9px]" />)}
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
                        <motion.span animate={statusFeedbackId === team.id && !reduceMotion ? { rotate: [0, -12, 12, 0], scale: [1, 1.2, 1] } : {}}><Ban className="w-3.5 h-3.5" /></motion.span>
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
              </motion.article>
            );
          })}
          {filteredTeams.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Nenhuma equipe encontrada.</div>}
        </motion.div>
      </div>

      {/* Users Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span>Usuários & Colaboradores</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                {users.length}
              </span>
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
                        <UserAvatar name={u.name} src={u.avatar} className="w-8 h-8 rounded-full ring-1 ring-slate-200 text-[10px]" />
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
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors duration-200 ${
                          u.active
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {u.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-bold text-blue-600 dark:text-blue-400">
                      {userDemandsCount}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
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
                          <motion.span animate={statusFeedbackId === u.id && !reduceMotion ? { rotate: [0, -12, 12, 0], scale: [1, 1.2, 1] } : {}}><UserX className="w-3.5 h-3.5" /></motion.span>
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

      {/* Clients Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div><h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2"><Building2 className="w-4 h-4 text-emerald-600" /><span>Clientes Cadastrados</span><span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">{clients.length}</span></h3><p className="text-xs text-slate-500 mt-0.5">Gerencie empresas e contatos solicitantes vinculados às demandas</p></div>
          <label className="relative w-full sm:w-72"><span className="sr-only">Pesquisar clientes</span><Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" /><input value={clientSearch} onChange={event => setClientSearch(event.target.value)} type="search" placeholder="Pesquisar clientes..." className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500" /></label>
        </div>
        <div className="overflow-x-auto"><table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800"><tr><th className="p-3.5">Empresa / Cliente</th><th className="p-3.5">Contato</th><th className="p-3.5">E-mail</th><th className="p-3.5">Telefone</th><th className="p-3.5 text-center">Demandas</th><th className="p-3.5 text-center">Status</th><th className="p-3.5 text-right">Ações</th></tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {filteredClients.map(client => { const demandCount = demands.filter(demand => demand.clientId === client.id).length; return <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"><td className="p-3.5"><div className="flex items-center gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><Building2 className="w-4 h-4" /></span><span className="font-bold text-slate-900 dark:text-slate-100">{client.company}</span></div></td><td className="p-3.5 font-medium">{client.name}</td><td className="p-3.5 font-mono text-slate-500">{client.email}</td><td className="p-3.5">{client.phone || '—'}</td><td className="p-3.5 text-center font-bold text-blue-600 dark:text-blue-400">{demandCount}</td><td className="p-3.5 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${client.active ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{client.active ? 'Ativo' : 'Inativo'}</span></td><td className="p-3.5"><div className="flex justify-end gap-1">{hasPermission('clients:update') && <><button type="button" onClick={() => { setClientToEdit(client); setIsClientModalOpen(true); }} title="Editar cliente" className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60"><Edit2 className="w-3.5 h-3.5" /></button><button type="button" onClick={() => void handleToggleClientActive(client)} title={client.active ? 'Desativar cliente' : 'Reativar cliente'} className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60"><Ban className="w-3.5 h-3.5" /></button></>}</div></td></tr>; })}
            {!clientsLoading && filteredClients.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-sm text-slate-500">Nenhum cliente encontrado{clientSearch ? ` para “${clientSearch}”` : ''}.</td></tr>}
            {clientsLoading && <tr><td colSpan={7} className="p-8 text-center text-sm text-slate-500">Carregando clientes...</td></tr>}
          </tbody>
        </table></div>
      </div>

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
      <ClientModal
        isOpen={isClientModalOpen}
        clientToEdit={clientToEdit}
        onClose={() => { setIsClientModalOpen(false); setClientToEdit(null); }}
        onCreated={client => { setClients(previous => [...previous, client]); showToast({ type: 'success', title: 'Cliente cadastrado', message: `${client.company} já pode ser selecionado nas demandas.` }); }}
        onSaved={client => { setClients(previous => previous.map(item => item.id === client.id ? client : item)); showToast({ type: 'success', title: 'Cliente atualizado', message: `${client.company} foi salvo.` }); }}
      />
    </div>
  );
};
