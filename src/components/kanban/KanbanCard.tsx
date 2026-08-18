/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Demand, User, Team, CategoryConfig, PriorityConfig, StatusConfig } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import {
  Calendar,
  AlertTriangle,
  CheckSquare,
  Paperclip,
  MessageSquare,
  Clock,
  MoreVertical,
  ChevronRight,
  ShieldAlert,
  ExternalLink,
  Crown,
  BookOpen,
  Cog,
  FileSpreadsheet
} from 'lucide-react';

interface KanbanCardProps {
  demand: Demand;
  users: User[];
  teams: Team[];
  categories: CategoryConfig[];
  priorities: PriorityConfig[];
  statuses: StatusConfig[];
  onClick: () => void;
  onStatusChange: (newStatusId: string) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  demand,
  users,
  teams,
  categories,
  priorities,
  statuses,
  onClick,
  onStatusChange
}) => {
  const category = categories.find(c => c.id === demand.categoryId) || categories[0];
  const priority = priorities.find(p => p.id === demand.priorityId) || priorities[0];
  const currentStatus = statuses.find(s => s.id === demand.statusId) || statuses[0];
  const assignee = users.find(u => u.id === demand.assigneeId);
  const team = teams.find(t => t.id === demand.teamId);

  const now = new Date();
  const dueDateObj = new Date(demand.dueDate);
  const isCompleted = currentStatus.category === 'completed';
  const isCancelled = currentStatus.category === 'cancelled';
  const isOverdue = !isCompleted && !isCancelled && dueDateObj < now;
  const isDueToday = !isCompleted && !isCancelled && dueDateObj.toDateString() === now.toDateString();

  const totalChecklist = demand.checklist.length;
  const completedChecklist = demand.checklist.filter(c => c.completed).length;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', demand.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md active:scale-[0.99] select-none font-sans ${
        demand.blocker?.isBlocked
          ? 'border-red-400/80 dark:border-red-800/80 ring-1 ring-red-400/40 bg-red-50/20 dark:bg-red-950/10'
          : isOverdue
          ? 'border-amber-400/80 dark:border-amber-800/80 ring-1 ring-amber-400/30'
          : isCompleted
          ? 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/10'
          : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600'
      }`}
      id={`card-${demand.code.toLowerCase()}`}
    >
      {/* Blocker Alert Banner if active */}
      {demand.blocker?.isBlocked && (
        <div className="mb-2.5 px-2.5 py-1 bg-red-100 dark:bg-red-950/80 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-1.5 text-red-800 dark:text-red-300 text-[11px] font-semibold">
          <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
          <span className="truncate">
            BLOQUEADA: {demand.blocker.reason || 'Impedimento registrado'}
          </span>
        </div>
      )}

      {/* Top Meta Row: Category Badge & Priority Pill */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        {/* Category Badge with Icon */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${category.bgColor} ${category.textColor} ${category.borderColor}`}
          title={category.description}
        >
          <IconRenderer name={category.iconName} className="w-3 h-3" />
          <span>{category.name}</span>
        </span>

        {/* Priority Badge */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase border ${priority.bgColor}`}
        >
          <IconRenderer name={priority.iconName} className="w-2.5 h-2.5" />
          <span>{priority.name}</span>
        </span>
      </div>

      {/* Demand Code & Title */}
      <div className="mb-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 dark:text-slate-500">
          <span>{demand.code}</span>
          {team && (
            <>
              <span>•</span>
              <span className="truncate max-w-[120px]" style={{ color: team.color }}>
                {team.name}
              </span>
            </>
          )}
        </div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug mt-0.5 line-clamp-2">
          {demand.title}
        </h4>
      </div>

      {/* 5W2H Context Preview: Why / Where */}
      {demand.whyReason && (
        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1 mb-2.5 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Motivo: </span>
          {demand.whyReason}
        </p>
      )}

      {/* Progress Bar */}
      <div className="space-y-1 mb-3">
        <div className="flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          <span>Progresso</span>
          <span>{demand.progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isCompleted
                ? 'bg-emerald-500'
                : demand.progressPercent > 70
                ? 'bg-blue-600'
                : demand.progressPercent > 30
                ? 'bg-amber-500'
                : 'bg-slate-400'
            }`}
            style={{ width: `${demand.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Footer Details: Due Date, Checklist, Assignee Avatar */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
        {/* Due Date Indicator */}
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-medium ${
            isCompleted
              ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
              : isOverdue
              ? 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/60 font-bold'
              : isDueToday
              ? 'text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/60 font-bold'
              : 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50'
          }`}
          title={`Prazo: ${dueDateObj.toLocaleDateString('pt-BR')}`}
        >
          <Calendar className="w-3 h-3" />
          <span>{dueDateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
          {isOverdue && <span className="text-[9px] uppercase font-black ml-0.5">Atraso</span>}
        </div>

        {/* Center Icons (Checklist / Comments / Attachments) */}
        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[10px]">
          {totalChecklist > 0 && (
            <span
              className={`flex items-center gap-0.5 ${
                completedChecklist === totalChecklist ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''
              }`}
              title={`Checklist: ${completedChecklist} de ${totalChecklist} concluídas`}
            >
              <CheckSquare className="w-3 h-3" />
              <span>{completedChecklist}/{totalChecklist}</span>
            </span>
          )}

          {demand.comments.length > 0 && (
            <span className="flex items-center gap-0.5" title={`${demand.comments.length} comentários`}>
              <MessageSquare className="w-3 h-3" />
              <span>{demand.comments.length}</span>
            </span>
          )}

          {demand.attachments.length > 0 && (
            <span className="flex items-center gap-0.5" title={`${demand.attachments.length} anexos`}>
              <Paperclip className="w-3 h-3" />
              <span>{demand.attachments.length}</span>
            </span>
          )}
        </div>

        {/* Assignee Avatar */}
        {assignee ? (
          <img
            src={assignee.avatar}
            alt={assignee.name}
            title={`Responsável: ${assignee.name} (${assignee.roleTitle})`}
            className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
          />
        ) : (
          <div
            className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-bold"
            title="Sem responsável"
          >
            ?
          </div>
        )}
      </div>
    </div>
  );
};
