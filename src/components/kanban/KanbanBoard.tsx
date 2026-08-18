/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { KanbanCard } from './KanbanCard';
import { IconRenderer } from '../common/IconRenderer';
import { Demand, StatusConfig } from '../../types';
import { StatusModal } from '../modals/StatusModal';
import {
  Plus,
  SlidersHorizontal,
  Layers,
  Users,
  UserCheck,
  Tag,
  AlertOctagon,
  CheckCircle2,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Ban
} from 'lucide-react';

export const KanbanBoard: React.FC = () => {
  const {
    filteredDemands,
    statuses,
    categories,
    priorities,
    users,
    teams,
    moveDemandStatus,
    setSelectedDemand,
    setIsCreateModalOpen,
    filters,
    setFilters,
    showToast,
    updateStatus,
    deleteStatus
  } = useApp();

  const [dragOverStatusId, setDragOverStatusId] = useState<string | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusToEdit, setStatusToEdit] = useState<StatusConfig | null>(null);
  const [activeMenuStatusId, setActiveMenuStatusId] = useState<string | null>(null);

  const activeStatuses = statuses.filter(s => s.active).sort((a, b) => a.order - b.order);

  const handleDragOver = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStatusId !== statusId) {
      setDragOverStatusId(statusId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, statusId: string) => {
    if (dragOverStatusId === statusId) {
      setDragOverStatusId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatusId: string) => {
    e.preventDefault();
    setDragOverStatusId(null);
    const demandId = e.dataTransfer.getData('text/plain');
    if (!demandId) return;

    await moveDemandStatus(demandId, targetStatusId);
  };

  const handleEditStatus = (status: StatusConfig) => {
    setStatusToEdit(status);
    setIsStatusModalOpen(true);
    setActiveMenuStatusId(null);
  };

  const handleToggleStatusActive = (status: StatusConfig) => {
    const nextActive = !status.active;
    updateStatus(status.id, { active: nextActive });
    showToast({
      type: 'info',
      title: nextActive ? 'Status Reativado' : 'Status Cancelado / Ocultado',
      message: `A coluna "${status.name}" foi ${nextActive ? 'reativada' : 'desativada no quadro'}.`
    });
    setActiveMenuStatusId(null);
  };

  return (
    <div className="space-y-4">
      {/* Kanban Sub-Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs font-sans">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Agrupar quadro por:</span>
          </div>

          <select
            value={filters.groupBy}
            onChange={(e) => setFilters(prev => ({ ...prev, groupBy: e.target.value as any }))}
            className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="none">Status Padrão (Colunas Kanban)</option>
            <option value="team">Por Equipe Responsável</option>
            <option value="assignee">Por Responsável Principal</option>
            <option value="category">Por Categoria (Projeto/Melhoria/Tarefa)</option>
            <option value="priority">Por Prioridade</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold mr-1">
            {filteredDemands.length} {filteredDemands.length === 1 ? 'demanda' : 'demandas'}
          </span>

        </div>
      </div>

      {/* Printable / Capturable Board Area */}
      <div
        id="kanban-board-export-container"
        className="flex gap-3 overflow-x-auto pb-3 pt-1 items-start min-h-[calc(100dvh-210px)] scroll-smooth snap-x snap-proximity"
      >
        {activeStatuses.map((status) => {
          const columnDemands = filteredDemands.filter((d) => d.statusId === status.id);
          const isOverWip = status.wipLimit && columnDemands.length > status.wipLimit;
          const isDragTarget = dragOverStatusId === status.id;
          const isMenuOpen = activeMenuStatusId === status.id;

          return (
            <div
              key={status.id}
              onDragOver={(e) => handleDragOver(e, status.id)}
              onDragLeave={(e) => handleDragLeave(e, status.id)}
              onDrop={(e) => handleDrop(e, status.id)}
              className={`w-[clamp(280px,22vw,340px)] shrink-0 snap-start flex flex-col bg-slate-100/90 dark:bg-slate-900/90 rounded-2xl border transition-all duration-200 ${
                isDragTarget
                  ? 'border-blue-500 ring-2 ring-blue-400/40 bg-blue-50/40 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between relative">
                <div className="flex items-center space-x-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: status.color }}
                  />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider truncate">
                    {status.name}
                  </h3>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  {/* WIP Limit Badge */}
                  {status.wipLimit && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isOverWip
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-extrabold animate-bounce'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                      title={`Limite WIP: ${columnDemands.length}/${status.wipLimit}`}
                    >
                      {columnDemands.length}/{status.wipLimit}
                    </span>
                  )}

                  {/* Total Count Badge */}
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs">
                    {columnDemands.length}
                  </span>

                  {/* Add Card to Column */}
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    title={`Adicionar demanda em "${status.name}"`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  {/* Column Settings / Edit Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuStatusId(isMenuOpen ? null : status.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                      title="Configurações da Coluna"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs">
                        <button
                          onClick={() => handleEditStatus(status)}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>Editar Coluna</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatusActive(status)}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Desativar / Cancelar</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Column Cards List */}
              <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100dvh-270px)] min-h-[180px]">
                {columnDemands.map((demand) => (
                  <KanbanCard
                    key={demand.id}
                    demand={demand}
                    users={users}
                    teams={teams}
                    categories={categories}
                    priorities={priorities}
                    statuses={statuses}
                    onClick={() => setSelectedDemand(demand)}
                    onStatusChange={(newStatusId) => moveDemandStatus(demand.id, newStatusId)}
                  />
                ))}

                {columnDemands.length === 0 && (
                  <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-xs select-none">
                    <p className="font-medium">Nenhuma demanda</p>
                    <p className="text-[10px] mt-0.5">Arraste um cartão para cá</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

      </div>

      {/* Reusable Status Modal */}
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
