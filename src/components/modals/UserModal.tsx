/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, UserRole, UserCustomPermissions } from '../../types';
import { useApp } from '../../context/AppContext';
import { csrfHeaders } from '../../services/csrf';
import { UserAvatar } from '../common/UserAvatar';
import {
  X,
  UserPlus,
  UserCheck,
  Shield,
  ShieldCheck,
  Mail,
  Briefcase,
  Phone,
  Building,
  CheckCircle2,
  Trash2,
  Upload,
  Ban,
  ChevronDown,
  ChevronUp,
  Plus,
  MinusCircle,
  PlusCircle
} from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: User | null;
}

const ROLES: { value: UserRole; label: string; desc: string; color: string }[] = [
  { value: 'colaborador', label: 'Colaborador', desc: 'Acesso operacional para executar e atualizar demandas', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
  { value: 'gestor', label: 'Gestor de Equipe', desc: 'Gestão de tarefas, prazos, bloqueios e relatórios', color: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' },
  { value: 'diretoria', label: 'Diretoria / C-Level', desc: 'Visão executiva, aprovação de prorrogações e SLA', color: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' },
  { value: 'admin', label: 'Administrador', desc: 'Acesso total a governança, auditoria e configurações', color: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' }
];

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  userToEdit
}) => {
  const { teams, createUser, updateUser, deleteUser, showToast, demands, currentUser, allRbacPermissions, rolePermissions } = useApp();
  const needsAccessSetup = !userToEdit || (userToEdit.id !== 'system-admin' && !userToEdit.approvalStatus);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('colaborador');
  const [roleTitle, setRoleTitle] = useState('');
  const [department, setDepartment] = useState('Tecnologia');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [initialPassword, setInitialPassword] = useState('');
  const [confirmInitialPassword, setConfirmInitialPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Granular Permissions
  const [isCustomPermissionsOpen, setIsCustomPermissionsOpen] = useState(false);
  const [grantedOverrides, setGrantedOverrides] = useState<string[]>([]);
  const [revokedOverrides, setRevokedOverrides] = useState<string[]>([]);

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name);
      setEmail(userToEdit.email);
      setRole(userToEdit.role);
      setRoleTitle(userToEdit.roleTitle || '');
      setDepartment(userToEdit.department || 'Tecnologia');
      setPhone(userToEdit.phone || '');
      setAvatar(userToEdit.avatar || '');
      setTeamIds(userToEdit.teamIds || []);
      setActive(userToEdit.active);
      setGrantedOverrides(userToEdit.customPermissions?.granted || []);
      setRevokedOverrides(userToEdit.customPermissions?.revoked || []);
      setInitialPassword('');
      setConfirmInitialPassword('');
    } else {
      setName('');
      setEmail('');
      setRole('colaborador');
      setRoleTitle('');
      setDepartment('Tecnologia');
      setPhone('+55 11 9');
      setAvatar('');
      setTeamIds(teams[0]?.id ? [teams[0].id] : []);
      setActive(true);
      setGrantedOverrides([]);
      setRevokedOverrides([]);
      setInitialPassword('');
      setConfirmInitialPassword('');
    }
  }, [userToEdit, isOpen, teams]);

  if (!isOpen) return null;

  const handleToggleTeam = (teamId: string) => {
    setTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast({ type: 'warning', title: 'Arquivo inválido', message: 'Selecione uma imagem JPG, PNG ou WebP.' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast({ type: 'warning', title: 'Imagem muito grande', message: 'A foto deve ter no máximo 2 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleToggleCustomGrant = (permId: string) => {
    // If it was revoked, clear revoke and grant
    setRevokedOverrides((prev) => prev.filter((id) => id !== permId));
    setGrantedOverrides((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleToggleCustomRevoke = (permId: string) => {
    // If it was granted, clear grant and revoke
    setGrantedOverrides((prev) => prev.filter((id) => id !== permId));
    setRevokedOverrides((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleResetCustomOverrides = () => {
    setGrantedOverrides([]);
    setRevokedOverrides([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast({
        type: 'warning',
        title: 'Nome Obrigatório',
        message: 'Por favor, informe o nome completo do usuário.'
      });
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      showToast({
        type: 'warning',
        title: 'E-mail Inválido',
        message: 'Por favor, insira um e-mail corporativo válido.'
      });
      return;
    }

    if (needsAccessSetup && (initialPassword.length < 12 || !/[A-Za-z]/.test(initialPassword) || !/\d/.test(initialPassword))) {
      showToast({ type: 'warning', title: 'Senha inicial inválida', message: 'Use ao menos 12 caracteres, incluindo letras e números.' });
      return;
    }
    if (needsAccessSetup && initialPassword !== confirmInitialPassword) {
      showToast({ type: 'warning', title: 'Senhas diferentes', message: 'Confirme exatamente a senha inicial informada.' });
      return;
    }

    const customPermissions: UserCustomPermissions | undefined =
      grantedOverrides.length > 0 || revokedOverrides.length > 0
        ? { granted: grantedOverrides, revoked: revokedOverrides }
        : undefined;

    const payload = {
      name: name.trim(),
      email: email.trim(),
      role,
      roleTitle: roleTitle.trim() || (role === 'admin' ? 'Administrador do Sistema' : role === 'gestor' ? 'Gestor de Projetos' : 'Especialista'),
      department: department.trim() || 'Operações',
      phone: phone.trim() || undefined,
      avatar,
      teamIds,
      active: needsAccessSetup ? true : active,
      approvalStatus: needsAccessSetup ? 'approved' as const : userToEdit?.approvalStatus,
      customPermissions
    };

    if (userToEdit && !needsAccessSetup) {
      setIsSubmitting(true);
      try { await updateUser(userToEdit.id, payload); }
      catch (error) { showToast({ type: 'error', title: 'Usuário não atualizado', message: error instanceof Error ? error.message : 'Falha ao salvar o usuário.' }); setIsSubmitting(false); return; }
      setIsSubmitting(false);
    } else {
      setIsSubmitting(true);
      const userId = userToEdit?.id || `usr-${Date.now()}`;
      try {
        const response = await fetch('/api/admin/users', {
          method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
          body: JSON.stringify({ name: payload.name, email: payload.email, password: initialPassword, role: payload.role, roleTitle: payload.roleTitle, department: payload.department, phone: payload.phone, avatar: payload.avatar, teamIds: payload.teamIds })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Não foi possível criar a conta.');
        if (userToEdit) await updateUser(data.id, payload); else createUser(payload, data.id);
        showToast({ type: 'success', title: 'Usuário cadastrado', message: `${payload.name} deverá alterar a senha provisória no primeiro acesso.` });
      } catch (error) {
        showToast({ type: 'error', title: 'Cadastro não concluído', message: error instanceof Error ? error.message : 'Tente novamente.' });
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
    }

    onClose();
  };

  const handleDelete = () => {
    if (!userToEdit) return;

    if (userToEdit.id === currentUser.id) {
      showToast({
        type: 'error',
        title: 'Ação Bloqueada',
        message: 'Você não pode excluir o perfil com o qual está atualmente logado.'
      });
      return;
    }

    const userDemands = demands.filter((d) => d.assigneeId === userToEdit.id);
    if (userDemands.length > 0) {
      if (!window.confirm(`Existem ${userDemands.length} demandas ativas atribuídas a este usuário. Deseja desativar/excluir mesmo assim?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Deseja realmente remover o usuário "${userToEdit.name}"?`)) {
        return;
      }
    }

    deleteUser(userToEdit.id);
    onClose();
  };

  const handleToggleActive = async () => {
    if (!userToEdit) return;
    const nextActive = !active;
    try { await updateUser(userToEdit.id, { active: nextActive }); setActive(nextActive); }
    catch (error) { showToast({ type: 'error', title: 'Usuário não atualizado', message: error instanceof Error ? error.message : 'Falha ao salvar.' }); return; }
    showToast({
      type: 'info',
      title: nextActive ? 'Usuário Reativado' : 'Usuário Desativado',
      message: `O colaborador ${userToEdit.name} foi ${nextActive ? 'reativado' : 'desativado'}.`
    });
  };

  return createPortal(
    <div data-modal-overlay="true" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      <div className="min-h-full flex justify-center p-4 pt-5 sm:pt-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {userToEdit ? 'Editar Usuário / Colaborador' : 'Novo Usuário do Sistema'}
              </h3>
              <p className="text-xs text-slate-500">
                Cadastro de membro, atribuição de cargo e permissões de acesso
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Avatar Selector Preview */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
            <UserAvatar name={name} src={avatar} className="w-14 h-14 rounded-full ring-2 ring-blue-500 text-lg" />
            <div className="flex-1 min-w-0">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                Foto de Perfil (Avatar)
              </label>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  Importar imagem
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarUpload} className="sr-only" />
                </label>
                {avatar && (
                  <button type="button" onClick={() => setAvatar('')} className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl">
                    Remover
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">JPG, PNG ou WebP, até 2 MB.</p>
            </div>
          </div>

          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Amanda Nogueira"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                E-mail Corporativo <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="amanda.nogueira@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none"
              />
            </div>
          </div>

          {/* Role Title & Department */}
          {needsAccessSetup && (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/20 p-4">
              <div className="mb-3"><p className="text-xs font-bold text-amber-900 dark:text-amber-200">Senha provisória</p><p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">O usuário deverá criar uma nova senha obrigatoriamente no primeiro acesso.</p></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input required type="password" minLength={12} autoComplete="new-password" value={initialPassword} onChange={e => setInitialPassword(e.target.value)} placeholder="Senha inicial" className="w-full px-3 py-2 text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900" />
                <input required type="password" minLength={12} autoComplete="new-password" value={confirmInitialPassword} onChange={e => setConfirmInitialPassword(e.target.value)} placeholder="Confirmar senha inicial" className="w-full px-3 py-2 text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900" />
              </div>
              <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-2">Mínimo de 12 caracteres, com letras e números.</p>
            </div>
          )}

          {/* Role Title & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Cargo / Função
              </label>
              <input
                type="text"
                placeholder="Ex: Engenheiro de Software Sênior"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Departamento
              </label>
              <input
                type="text"
                placeholder="Ex: Tecnologia, Operações, RH..."
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Role / Access Level */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Perfil de Acesso & Permissões
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <div
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    role === r.value
                      ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {r.label}
                    </span>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded uppercase ${r.color}`}>
                      {r.value}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {r.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Teams Assignment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Equipes de Atuação
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {teams.map((t) => {
                const isSelected = teamIds.includes(t.id);
                return (
                  <label
                    key={t.id}
                    onClick={() => handleToggleTeam(t.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="truncate">{t.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Telefone / WhatsApp Corporativo
            </label>
            <input
              type="text"
              placeholder="+55 11 98765-4321"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Granular Custom RBAC Permissions Override */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
            <button
              type="button"
              onClick={() => setIsCustomPermissionsOpen((prev) => !prev)}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Sobrescrita de Permissões RBAC (Granular por Usuário)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Conceda ou revogue permissões específicas para este colaborador além do perfil padrão
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(grantedOverrides.length > 0 || revokedOverrides.length > 0) && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    +{grantedOverrides.length} / -{revokedOverrides.length}
                  </span>
                )}
                {isCustomPermissionsOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {isCustomPermissionsOpen && (
              <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    Perfil base: <strong>{role.toUpperCase()}</strong> ({rolePermissions[role]?.length || 0} permissões herdadas)
                  </span>
                  {(grantedOverrides.length > 0 || revokedOverrides.length > 0) && (
                    <button
                      type="button"
                      onClick={handleResetCustomOverrides}
                      className="text-purple-600 dark:text-purple-400 hover:underline font-bold"
                    >
                      Limpar Sobrescritas
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                  {allRbacPermissions.map((perm) => {
                    const isInherited = (rolePermissions[role] || []).includes(perm.id);
                    const isGranted = grantedOverrides.includes(perm.id);
                    const isRevoked = revokedOverrides.includes(perm.id);
                    const effectiveActive = (isInherited || isGranted) && !isRevoked;

                    return (
                      <div
                        key={perm.id}
                        className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {perm.name}
                            </span>
                            {perm.activityType && (
                              <span className="px-1 py-0.2 text-[9px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {perm.activityType}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{perm.id}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Grant Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleCustomGrant(perm.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                              isGranted
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-500'
                            }`}
                            title="Forçar concessão desta permissão"
                          >
                            + Conceder
                          </button>

                          {/* Revoke Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleCustomRevoke(perm.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                              isRevoked
                                ? 'bg-red-600 text-white border-red-600'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-red-500'
                            }`}
                            title="Revogar/bloquear esta permissão"
                          >
                            - Bloquear
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div>
              {userToEdit && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleActive}
                    className="px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>{active ? 'Desativar' : 'Reativar'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="p-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-xl transition-colors"
                    title="Excluir Usuário"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Cadastrando...' : userToEdit ? 'Salvar Alterações' : 'Cadastrar Usuário'}</span>
              </button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>,
    document.body,
  );
};
