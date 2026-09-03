/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AppSelect } from '../common/AppSelect';
import { Team, User } from '../../types';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import {
  X,
  Users,
  Briefcase,
  Shield,
  Palette,
  CheckCircle2,
  Trash2,
  Ban,
  UserCheck,
  Building
  ,Search
} from 'lucide-react';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamToEdit?: Team | null;
}

const TEAM_COLORS = [
  { name: 'Azul Corporativo', hex: '#3B82F6' },
  { name: 'Esmeralda / Verde', hex: '#10B981' },
  { name: 'Roxo / Inovação', hex: '#8B5CF6' },
  { name: 'Rosa / Gente', hex: '#EC4899' },
  { name: 'Âmbar / Projetos', hex: '#F59E0B' },
  { name: 'Ciano / Tech', hex: '#06B6D4' },
  { name: 'Laranja / Logística', hex: '#F97316' },
  { name: 'Índigo / Finanças', hex: '#6366F1' },
  { name: 'Vermelho / Qualidade', hex: '#EF4444' },
  { name: 'Slate / Geral', hex: '#64748B' }
];

const DEPARTMENTS_LIST = [
  'Tecnologia',
  'Operações',
  'Recursos Humanos',
  'Controladoria & Finanças',
  'Marketing & Vendas',
  'Jurídico & Compliance',
  'Diretoria Executiva',
  'Outro'
];

export const TeamModal: React.FC<TeamModalProps> = ({
  isOpen,
  onClose,
  teamToEdit
}) => {
  const { users, createTeam, updateTeam, deleteTeam, showToast, demands } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS_LIST[0]);
  const [leaderId, setLeaderId] = useState('');
  const [selectedColor, setSelectedColor] = useState(TEAM_COLORS[0].hex);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [memberSearch, setMemberSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (teamToEdit) {
      setName(teamToEdit.name);
      setDescription(teamToEdit.description || '');
      setDepartment(teamToEdit.department || DEPARTMENTS_LIST[0]);
      setLeaderId(teamToEdit.leaderId || (users[0]?.id || ''));
      setSelectedColor(teamToEdit.color || TEAM_COLORS[0].hex);
      setMemberIds(teamToEdit.memberIds || []);
      setActive(teamToEdit.active);
    } else {
      setName('');
      setDescription('');
      setDepartment(DEPARTMENTS_LIST[0]);
      setLeaderId(users[0]?.id || '');
      setSelectedColor(TEAM_COLORS[0].hex);
      setMemberIds([]);
      setActive(true);
    }
    setMemberSearch('');
  }, [teamToEdit, isOpen, users]);

  if (!isOpen) return null;

  const handleToggleMember = (userId: string) => {
    setMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast({
        type: 'warning',
        title: 'Nome Obrigatório',
        message: 'Por favor, digite o nome da equipe.'
      });
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      department,
      leaderId: leaderId || (users[0]?.id || ''),
      color: selectedColor,
      memberIds: memberIds.length > 0 ? memberIds : (leaderId ? [leaderId] : []),
      active
    };

    setSaving(true);
    try {
      if (teamToEdit) await updateTeam(teamToEdit.id, payload);
      else await createTeam(payload);
      onClose();
    } catch (error) {
      showToast({ type: 'error', title: 'Equipe não criada', message: error instanceof Error ? error.message : 'Falha ao salvar a equipe.' });
    } finally { setSaving(false); }
  };

  const normalizedMemberSearch = memberSearch.trim().toLocaleLowerCase('pt-BR');
  const selectableUsers = users.filter(user => user.active && (!normalizedMemberSearch || [user.name, user.email, user.roleTitle, user.department].some(value => String(value || '').toLocaleLowerCase('pt-BR').includes(normalizedMemberSearch))));

  const handleDelete = async () => {
    if (!teamToEdit) return;

    const teamDemands = demands.filter(d => d.teamId === teamToEdit.id);
    if (teamDemands.length > 0) {
      if (!window.confirm(`Existem ${teamDemands.length} demandas ativas vinculadas a esta equipe. Deseja realmente remover a equipe?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Deseja remover a equipe "${teamToEdit.name}"?`)) {
        return;
      }
    }

    setSaving(true);
    try {
      await deleteTeam(teamToEdit.id);
      onClose();
    } catch (error) {
      showToast({ type: 'error', title: 'Equipe não removida', message: error instanceof Error ? error.message : 'Falha ao remover a equipe.' });
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div data-modal-overlay="true" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      <div className="min-h-full flex items-start justify-center p-4 pt-5 sm:pt-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {teamToEdit ? 'Editar Equipe' : 'Criar Nova Equipe'}
              </h3>
              <p className="text-xs text-slate-500">
                Estrutura organizacional, liderança e distribuição de membros
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
          {/* Team Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Nome da Equipe <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Engenharia & TI, Operações & Logística..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
            />
          </div>

          {/* Department & Leader */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Departamento / Área
              </label>
              <AppSelect
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {DEPARTMENTS_LIST.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </AppSelect>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Líder da Equipe
              </label>
              <AppSelect
                value={leaderId}
                onChange={(e) => setLeaderId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.roleTitle || u.role})
                  </option>
                ))}
              </AppSelect>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Descrição do Escopo / Atuação
            </label>
            <textarea
              rows={2}
              placeholder="Descreva as responsabilidades e entregas desta equipe..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Team Color */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Cor de Identificação Visual
            </label>
            <div className="flex flex-wrap gap-2">
              {TEAM_COLORS.map((color) => (
                <button
                  type="button"
                  key={color.hex}
                  onClick={() => setSelectedColor(color.hex)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    selectedColor === color.hex ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Team Members Multi-Select */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Membros da Equipe ({memberIds.length})
              </label>
              <button
                type="button"
                onClick={() => setMemberIds(previous => [...new Set([...previous, ...selectableUsers.map(user => user.id)])])}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Selecionar Todos
              </button>
            </div>

            <div className="relative mb-2"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input type="search" value={memberSearch} onChange={event => setMemberSearch(event.target.value)} placeholder="Pesquisar por nome, e-mail, cargo ou departamento" className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"/></div>

            <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800/60 p-1 bg-slate-50/50 dark:bg-slate-800/30">
              {selectableUsers.map((user) => {
                const isSelected = memberIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => handleToggleMember(user.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar name={user.name} src={user.avatar} className="w-6 h-6 rounded-full text-[9px]" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {user.roleTitle || user.role} • {user.department}
                        </p>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded text-blue-600 focus:ring-blue-500 shrink-0"
                    />
                  </div>
                );
                })}
              {selectableUsers.length === 0 && <p className="p-4 text-center text-xs text-slate-500">Nenhum usuário encontrado.</p>}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div>
              {teamToEdit && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Equipe</span>
                </button>
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
                disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 flex items-center gap-1.5 disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{saving ? 'Salvando...' : teamToEdit ? 'Salvar Alterações' : 'Criar Equipe'}</span>
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
