/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StatusConfig, StatusCategory } from '../../types';
import { useApp } from '../../context/AppContext';
import { IconRenderer } from '../common/IconRenderer';
import {
  X,
  Layers,
  Sparkles,
  PlayCircle,
  Clock,
  AlertOctagon,
  CheckSquare,
  CheckCircle2,
  XCircle,
  Search,
  Shield,
  FileCheck,
  Calendar,
  Tag,
  Hash,
  Trash2,
  Ban
} from 'lucide-react';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusToEdit?: StatusConfig | null;
}

const CATEGORY_OPTIONS: { value: StatusCategory; label: string; desc: string; defaultColor: string }[] = [
  { value: 'open', label: 'Aberto / Triagem', desc: 'Demandas novas, em análise ou planejadas', defaultColor: '#64748B' },
  { value: 'in_progress', label: 'Em Andamento', desc: 'Em execução ativa pela equipe', defaultColor: '#3B82F6' },
  { value: 'waiting', label: 'Aguardando / Pausada', desc: 'Dependência de terceiros ou aprovações', defaultColor: '#F97316' },
  { value: 'blocked', label: 'Bloqueada / Impedimento', desc: 'Travada por impedimento crítico', defaultColor: '#EF4444' },
  { value: 'in_review', label: 'Em Validação / QA', desc: 'Em teste, homologação ou revisão', defaultColor: '#EAB308' },
  { value: 'completed', label: 'Concluída / Entregue', desc: 'Finalizada e validada com sucesso', defaultColor: '#10B981' },
  { value: 'cancelled', label: 'Cancelada / Descontinuada', desc: 'Demanda cancelada ou descontinuada', defaultColor: '#94A3B8' }
];

const COLOR_PRESETS = [
  { name: 'Slate', hex: '#64748B', bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-700' },
  { name: 'Azul', hex: '#3B82F6', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-800' },
  { name: 'Ciano', hex: '#06B6D4', bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-300 dark:border-cyan-800' },
  { name: 'Índigo', hex: '#6366F1', bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-300 dark:border-indigo-800' },
  { name: 'Roxo', hex: '#8B5CF6', bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-800' },
  { name: 'Rosa', hex: '#EC4899', bg: 'bg-pink-50 dark:bg-pink-950/40', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-300 dark:border-pink-800' },
  { name: 'Âmbar', hex: '#F59E0B', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-800' },
  { name: 'Laranja', hex: '#F97316', bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-800' },
  { name: 'Vermelho', hex: '#EF4444', bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-800' },
  { name: 'Esmeralda', hex: '#10B981', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-800' },
];

const AVAILABLE_ICONS = [
  'Sparkles',
  'PlayCircle',
  'Clock',
  'AlertOctagon',
  'CheckSquare',
  'CheckCircle2',
  'XCircle',
  'Search',
  'Layers',
  'Shield',
  'FileCheck',
  'Calendar'
];

export const StatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  onClose,
  statusToEdit
}) => {
  const { statuses, createStatus, updateStatus, deleteStatus, demands, showToast } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<StatusCategory>('open');
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [iconName, setIconName] = useState('Sparkles');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (statusToEdit) {
      setName(statusToEdit.name);
      setDescription(statusToEdit.description || '');
      setCategory(statusToEdit.category);
      const matchedColor = COLOR_PRESETS.find(c => c.hex.toLowerCase() === statusToEdit.color.toLowerCase()) || COLOR_PRESETS[0];
      setSelectedColor(matchedColor);
      setIconName(statusToEdit.iconName || 'Sparkles');
      setActive(statusToEdit.active);
    } else {
      setName('');
      setDescription('');
      setCategory('open');
      setSelectedColor(COLOR_PRESETS[1]); // Blue by default
      setIconName('Sparkles');
      setActive(true);
    }
  }, [statusToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast({
        type: 'warning',
        title: 'Nome Obrigatório',
        message: 'Por favor, informe o nome da etapa de status.'
      });
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      category,
      color: selectedColor.hex,
      textColor: selectedColor.text,
      bgColor: selectedColor.bg,
      borderColor: selectedColor.border,
      iconName,
      order: statusToEdit ? statusToEdit.order : statuses.length + 1,
      wipLimit: undefined,
      active
    };

    if (statusToEdit) {
      updateStatus(statusToEdit.id, payload);
    } else {
      createStatus(payload);
    }

    onClose();
  };

  const handleDelete = () => {
    if (!statusToEdit) return;

    const demandsInStatus = demands.filter(d => d.statusId === statusToEdit.id);
    if (demandsInStatus.length > 0) {
      if (!window.confirm(`Existem ${demandsInStatus.length} demandas nesta coluna. Ao remover este status, certifique-se de reatribuir essas demandas. Deseja continuar?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Deseja realmente remover o status "${statusToEdit.name}"?`)) {
        return;
      }
    }

    deleteStatus(statusToEdit.id);
    showToast({
      type: 'warning',
      title: 'Status Removido',
      message: `A coluna "${statusToEdit.name}" foi removida do fluxo Kanban.`
    });
    onClose();
  };

  const handleToggleCancel = () => {
    if (!statusToEdit) return;
    const nextActive = !active;
    setActive(nextActive);
    updateStatus(statusToEdit.id, { active: nextActive });
    showToast({
      type: 'info',
      title: nextActive ? 'Status Ativado' : 'Status Cancelado/Desativado',
      message: `O status "${statusToEdit.name}" foi ${nextActive ? 'reativado' : 'desativado'} no quadro.`
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {statusToEdit ? 'Editar Status de Tarefa' : 'Novo Status de Tarefa (Coluna Kanban)'}
              </h3>
              <p className="text-xs text-slate-500">
                Configure a etapa do fluxo operacional e sua categorização
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
          {/* Status Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Nome do Status / Coluna <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Em Homologação, Aguardando Fornecedor, Deploy..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Descrição do Propósito
            </label>
            <textarea
              rows={2}
              placeholder="Descreva quando uma demanda deve entrar nesta etapa do fluxo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
            />
          </div>

          {/* Category Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Tipo de Categoria do Status
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <div
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    category === cat.value
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {cat.label}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {cat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Cor Visual de Identificação
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((color) => (
                <button
                  type="button"
                  key={color.name}
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    selectedColor.hex === color.hex ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Ícone Representativo
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVAILABLE_ICONS.map((icon) => (
                <button
                  type="button"
                  key={icon}
                  onClick={() => setIconName(icon)}
                  className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                    iconName === icon
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title={icon}
                >
                  <IconRenderer name={icon} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Active Status */}
          <div className="pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Status no Quadro Kanban
              </label>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                  <span>{active ? 'Ativo no Kanban' : 'Cancelado / Inativo'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div>
              {statusToEdit && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleCancel}
                    className="px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>{active ? 'Desativar / Cancelar' : 'Reativar Status'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="p-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-xl transition-colors"
                    title="Excluir Definitivamente"
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
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{statusToEdit ? 'Salvar Alterações' : 'Criar Status'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
