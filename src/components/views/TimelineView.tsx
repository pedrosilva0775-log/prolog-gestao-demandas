/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { IconRenderer } from '../common/IconRenderer';
import { Clock, ShieldAlert, Calendar, ArrowRight } from 'lucide-react';

export const TimelineView: React.FC = () => {
  const { filteredDemands, categories, statuses, priorities, users, setSelectedDemand } = useApp();

  // Reference date window: August 1 to August 31, 2026 (31 days)
  const totalDays = 31;
  const monthStart = new Date(2026, 7, 1).getTime();
  const dayMs = 86400000;

  const calculateBarPosition = (startDateStr: string, dueDateStr: string) => {
    const start = new Date(startDateStr).getTime();
    const end = new Date(dueDateStr).getTime();

    const startOffsetDays = Math.max(0, Math.min(totalDays, Math.floor((start - monthStart) / dayMs)));
    const durationDays = Math.max(1, Math.min(totalDays - startOffsetDays, Math.ceil((end - start) / dayMs)));

    const leftPercent = (startOffsetDays / totalDays) * 100;
    const widthPercent = Math.max(3, (durationDays / totalDays) * 100);

    return { leftPercent, widthPercent };
  };

  const daysHeader = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      {/* Timeline Header */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Linha do Tempo Estratégica (Gantt) — Agosto 2026
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-semibold">
          {filteredDemands.length} demandas mapeadas no cronograma
        </span>
      </div>

      {/* Gantt Chart Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Days Header */}
          <div className="grid grid-cols-[280px_1fr] border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-600 dark:text-slate-300">
            <div className="p-3 border-r border-slate-200 dark:border-slate-800">
              Demanda / Responsável
            </div>
            <div className="grid grid-cols-31 text-center text-[10px] divide-x divide-slate-200 dark:divide-slate-800">
              {daysHeader.map((d) => (
                <div
                  key={`day-head-${d}`}
                  className={`py-2 ${d === 16 ? 'bg-blue-600 text-white font-extrabold' : ''}`}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>

          {/* Demands Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredDemands.map((demand) => {
              const category = categories.find((c) => c.id === demand.categoryId);
              const status = statuses.find((s) => s.id === demand.statusId);
              const assignee = users.find((u) => u.id === demand.assigneeId);
              const isCompleted = status?.category === 'completed';
              const { leftPercent, widthPercent } = calculateBarPosition(
                demand.plannedStartDate || demand.createdAt,
                demand.dueDate
              );

              return (
                <div
                  key={demand.id}
                  onClick={() => setSelectedDemand(demand)}
                  className="grid grid-cols-[280px_1fr] hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  {/* Left Column: Info */}
                  <div className="p-3 border-r border-slate-200 dark:border-slate-800 flex items-center space-x-2 min-w-0">
                    {category && (
                      <span className={`p-1 rounded ${category.bgColor} ${category.textColor}`}>
                        <IconRenderer name={category.iconName} className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1">
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          {demand.code}
                        </span>
                        {demand.blocker?.isBlocked && (
                          <ShieldAlert className="w-3 h-3 text-red-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {demand.title}
                      </p>
                      {assignee && (
                        <p className="text-[10px] text-slate-400 truncate">
                          {assignee.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Timeline Bar Track */}
                  <div className="relative flex items-center px-2 py-3">
                    {/* Background Grid Lines for days */}
                    <div className="absolute inset-0 grid grid-cols-31 pointer-events-none divide-x divide-slate-100 dark:divide-slate-800/40" />

                    {/* Today indicator line (Day 16) */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-blue-500/60 z-10 pointer-events-none"
                      style={{ left: `${(15 / 31) * 100}%` }}
                    />

                    {/* Progress Duration Bar */}
                    <div
                      className={`relative h-7 rounded-lg shadow-xs flex items-center px-2 z-20 text-[10px] font-bold transition-all ${
                        demand.blocker?.isBlocked
                          ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                          : isCompleted
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                      }`}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        minWidth: '50px'
                      }}
                    >
                      <span className="truncate mr-1">{demand.progressPercent}%</span>
                      {demand.checklist.length > 0 && (
                        <span className="opacity-80 text-[9px] shrink-0">
                          ({demand.checklist.filter((c) => c.completed).length}/
                          {demand.checklist.length})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
