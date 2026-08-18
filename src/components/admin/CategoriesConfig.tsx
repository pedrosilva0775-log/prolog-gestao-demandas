/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusConfig } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import { StatusModal } from '../modals/StatusModal';
import {
  Sliders,
  Crown,
  BookOpen,
  Cog,
  Layers,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  Ban,
  Tag
} from 'lucide-react';

export const CategoriesConfig: React.FC = () => {
  const { categories, statuses, updateStatus, deleteStatus, showToast, demands } = useApp();

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusToEdit, setStatusToEdit] = useState<StatusConfig | null>(null);
  const [activeSection, setActiveSection] = useState<'workflow' | 'categories'>('workflow');

  const handleCreateStatus = () => {
    setStatusToEdit(null);
    setIsStatusModalOpen(true);
  };

  const handleEditStatus = (status: StatusConfig) => {
    setStatusToEdit(status);
    setIsStatusModalOpen(true);
  };

  const handleToggleStatusActive = (status: StatusConfig) => {
    const nextActive = !status.active;
    updateStatus(status.id, { active: nextActive });
    showToast({
      type: 'info',
      title: nextActive ? 'Status Reativado' : 'Status Cancelado/Desativado',
      message: `A coluna "${status.name}" foi ${nextActive ? 'reativada' : 'desativada no fluxo'}.`
    });
  };

  const handleDeleteStatus = (status: StatusConfig) => {
    const demandsInStatus = demands.filter((d) => d.statusId === status.id);
    if (demandsInStatus.length > 0) {
      if (!window.confirm(`Existem ${demandsInStatus.length} demandas nesta coluna. Deseja realmente excluir "${status.name}"?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Deseja realmente excluir a coluna "${status.name}"?`)) {
        return;
      }
    }

    deleteStatus(status.id);
  };

  return (
    <div className="space-y-6 pb-8 font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center text-center gap-4">
        <div className="max-w-3xl">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Configurações do Sistema & Governança de Workflow</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Padronização de categorias visuais (5W2H), esteira Kanban, criação e cancelamento de status
          </p>
        </div>

        <button
          onClick={handleCreateStatus}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Status / Coluna</span>
        </button>
      </div>

      <nav className="flex justify-center" aria-label="Seções de configuração">
        <div className="inline-flex rounded-2xl bg-slate-200/70 dark:bg-slate-800 p-1.5 border border-slate-200 dark:border-slate-700">
          <button onClick={() => setActiveSection('workflow')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSection === 'workflow' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'}`}>
            Fluxo Kanban <span className="ml-1 text-[10px] opacity-70">{statuses.length}</span>
          </button>
          <button onClick={() => setActiveSection('categories')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSection === 'categories' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'}`}>
            Categorias <span className="ml-1 text-[10px] opacity-70">{categories.length}</span>
          </button>
        </div>
      </nav>

      {/* 1. Categories */}
      {activeSection === 'categories' && <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Categorias Visuais de Demandas</span>
        </h3>
        <p className="text-xs text-slate-500">
          Tipificação visual das demandas com identificação de complexidade e iconografia padrão:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`p-4 rounded-xl border ${cat.bgColor} ${cat.borderColor} space-y-2`}
            >
              <div className="flex items-center space-x-2">
                <span className={`p-1.5 rounded-lg bg-white dark:bg-slate-900 shadow-xs ${cat.textColor}`}>
                  <IconRenderer name={cat.iconName} className="w-4 h-4" />
                </span>
                <h4 className={`text-sm font-bold ${cat.textColor}`}>{cat.name}</h4>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                {cat.description}
              </p>
            </div>
          ))}
        </div>
      </div>}

      {/* 2. Kanban Statuses */}
      {activeSection === 'workflow' && <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Etapas do Fluxo Kanban</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Crie, edite ou desative/cancele colunas do fluxo de tarefas
            </p>
          </div>

        </div>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Ordem</th>
                <th className="p-3">Nome da Coluna</th>
                <th className="p-3">Tipo / Categoria</th>
                <th className="p-3 text-center">Demandas</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {statuses.map((s) => {
                const count = demands.filter((d) => d.statusId === s.id).length;
                return (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-400">#{s.order}</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="font-bold text-slate-800 dark:text-slate-200">{s.name}</span>
                      </div>
                      {s.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{s.description}</p>
                      )}
                    </td>
                    <td className="p-3 font-mono text-[11px] uppercase text-slate-500">{s.category}</td>
                    <td className="p-3 text-center font-bold text-blue-600 dark:text-blue-400">
                      {count}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.active
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {s.active ? 'Ativo' : 'Cancelado / Inativo'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditStatus(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors"
                          title="Editar Coluna"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatusActive(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-colors"
                          title={s.active ? 'Desativar / Cancelar Status' : 'Reativar Status'}
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStatus(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors"
                          title="Excluir Coluna"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>}

      {/* Modal */}
      <StatusModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setStatusToEdit(null);
        }}
        statusToEdit={statusToEdit}
      />
    </div>
  );
};
