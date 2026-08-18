/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Demand, StatusConfig } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import {
  Calendar,
  AlertTriangle,
  CheckSquare,
  ArrowUpDown,
  MoreHorizontal,
  ShieldAlert,
  Download,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const ListView: React.FC = () => {
  const {
    filteredDemands,
    users,
    teams,
    categories,
    statuses,
    priorities,
    setSelectedDemand,
    moveDemandStatus,
    setExportModalOpen
  } = useApp();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const now = new Date();

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredDemands.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDemands.map(d => d.id));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      {/* List Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {filteredDemands.length} {filteredDemands.length === 1 ? 'atividade listada' : 'atividades listadas'}
          </span>
          {selectedIds.length > 0 && (
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md">
              {selectedIds.length} selecionada(s)
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setExportModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Linhas (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Table Header */}
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredDemands.length}
                    onChange={toggleSelectAll}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="p-3.5 w-28">Código</th>
                <th className="p-3.5 min-w-[260px]">Título & Contexto 5W2H</th>
                <th className="p-3.5 w-32">Categoria</th>
                <th className="p-3.5 w-36">Status</th>
                <th className="p-3.5 w-28">Prioridade</th>
                <th className="p-3.5 w-40">Responsável</th>
                <th className="p-3.5 w-32">Prazo</th>
                <th className="p-3.5 w-28 text-center">Progresso</th>
                <th className="p-3.5 w-24 text-center">Checklist</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredDemands.map((demand) => {
                const category = categories.find(c => c.id === demand.categoryId) || categories[0];
                const priority = priorities.find(p => p.id === demand.priorityId) || priorities[0];
                const status = statuses.find(s => s.id === demand.statusId) || statuses[0];
                const assignee = users.find(u => u.id === demand.assigneeId);
                const team = teams.find(t => t.id === demand.teamId);

                const isCompleted = status.category === 'completed';
                const isCancelled = status.category === 'cancelled';
                const dueDateObj = new Date(demand.dueDate);
                const isOverdue = !isCompleted && !isCancelled && dueDateObj < now;

                const completedChk = demand.checklist.filter(c => c.completed).length;
                const totalChk = demand.checklist.length;

                return (
                  <tr
                    key={demand.id}
                    onClick={() => setSelectedDemand(demand)}
                    className={`hover:bg-blue-50/50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${
                      demand.blocker?.isBlocked ? 'bg-red-50/20 dark:bg-red-950/10' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3.5 text-center" onClick={(e) => toggleSelectOne(demand.id, e)}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(demand.id)}
                        onChange={() => {}}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                    </td>

                    {/* Code */}
                    <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                      {demand.code}
                    </td>

                    {/* Title & 5W2H hints */}
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600">
                            {demand.title}
                          </span>
                          {demand.blocker?.isBlocked && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 text-[10px] font-bold">
                              <ShieldAlert className="w-3 h-3 mr-0.5" />
                              Bloqueada
                            </span>
                          )}
                        </div>
                        {demand.whyReason && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">Por quê: </span>
                            {demand.whyReason}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${category.bgColor} ${category.textColor} ${category.borderColor}`}
                      >
                        <IconRenderer name={category.iconName} className="w-3.5 h-3.5" />
                        <span>{category.name}</span>
                      </span>
                    </td>

                    {/* Status Dropdown */}
                    <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={demand.statusId}
                        onChange={(e) => moveDemandStatus(demand.id, e.target.value)}
                        className="text-xs font-semibold rounded-lg px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        style={{ borderLeftColor: status.color, borderLeftWidth: '3px' }}
                      >
                        {statuses.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Priority */}
                    <td className="p-3.5">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${priority.bgColor}`}>
                        <IconRenderer name={priority.iconName} className="w-3 h-3" />
                        <span>{priority.name}</span>
                      </span>
                    </td>

                    {/* Assignee */}
                    <td className="p-3.5">
                      {assignee ? (
                        <div className="flex items-center space-x-2">
                          <img
                            src={assignee.avatar}
                            alt={assignee.name}
                            className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <span className="truncate max-w-[110px] font-medium text-slate-800 dark:text-slate-200">
                            {assignee.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Não atribuído</span>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="p-3.5">
                      <span
                        className={`font-semibold flex items-center space-x-1 ${
                          isCompleted
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isOverdue
                            ? 'text-red-600 dark:text-red-400 font-bold'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        <span>{dueDateObj.toLocaleDateString('pt-BR')}</span>
                      </span>
                    </td>

                    {/* Progress */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <div className="w-12 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isCompleted
                                ? 'bg-emerald-500'
                                : demand.progressPercent > 50
                                ? 'bg-blue-600'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${demand.progressPercent}%` }}
                          />
                        </div>
                        <span className="font-bold text-[10px] text-slate-600 dark:text-slate-400 w-7 text-right">
                          {demand.progressPercent}%
                        </span>
                      </div>
                    </td>

                    {/* Checklist */}
                    <td className="p-3.5 text-center">
                      {totalChk > 0 ? (
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {completedChk}/{totalChk}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredDemands.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 text-xs">
                    Nenhuma atividade encontrada com os filtros aplicados.
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
