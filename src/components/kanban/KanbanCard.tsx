/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { transitions } from '../motion/presets';
import { Demand, User, Team, CategoryConfig, PriorityConfig, StatusConfig } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import { UserAvatar } from '../common/UserAvatar';
import { formatCalendarDate, parseLocalCalendarDate } from '../../utils/date';
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
  allowDrag?: boolean;
  isDragging?: boolean;
  isDropping?: boolean;
  onPointerDragStart?: (event: React.PointerEvent<HTMLDivElement>) => void;
}

const KanbanCardComponent: React.FC<KanbanCardProps> = ({
  demand,
  users,
  teams,
  categories,
  priorities,
  statuses,
  onClick,
  onStatusChange,
  allowDrag = true,
  isDragging = false,
  isDropping = false,
  onPointerDragStart,
}) => {
  const reduceMotion = useReducedMotion();
  const category = categories.find(c => c.id === demand.categoryId) || categories[0];
  const priority = priorities.find(p => p.id === demand.priorityId) || priorities[0];
  const currentStatus = statuses.find(s => s.id === demand.statusId) || statuses[0];
  const assignee = users.find(u => u.id === demand.assigneeId);
  const team = teams.find(t => t.id === demand.teamId);

  const now = new Date();
  const dueDateObj = parseLocalCalendarDate(demand.dueDate, true);
  const isCompleted = currentStatus.category === 'completed';
  const isCancelled = currentStatus.category === 'cancelled';
  const isOverdue = !isCompleted && !isCancelled && dueDateObj < now;
  const isDueToday = !isCompleted && !isCancelled && dueDateObj.toDateString() === now.toDateString();

  const totalChecklist = demand.checklist.length;
  const completedChecklist = demand.checklist.filter(c => c.completed).length;
  const hasRestriction = Boolean(demand.blocker?.isBlocked);
  const isImpediment = hasRestriction && demand.blocker?.kind === 'impediment';
  const isHardBlock = hasRestriction && !isImpediment;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.99 }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985, transition: { duration: 0.14 } }}
      animate={reduceMotion ? undefined : isDragging ? { scale: 1.02, y: -2, boxShadow: '0 20px 34px rgba(15, 23, 42, 0.28)' } : isDropping ? { scale: [1.02, 0.985, 1], y: [0, 2, 0] } : { scale: 1, y: 0 }}
      whileHover={reduceMotion || isDragging ? undefined : { y: -2, boxShadow: '0 12px 22px rgba(15, 23, 42, 0.16)' }}
      transition={isDropping ? transitions.settle : transitions.micro}
      onPointerDown={allowDrag && !isHardBlock ? onPointerDragStart : undefined}
      onClick={onClick}
      title={isHardBlock ? 'Resolva o bloqueio antes de alterar o status' : isImpediment ? 'Atividade com impedimento ativo; o status pode ser alterado' : undefined}
      className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-4 border cursor-pointer shadow-md select-none font-sans transition-[border-color,opacity] duration-150 ${isDragging ? 'opacity-40' : 'opacity-100'} ${
        isHardBlock
          ? 'border-red-400/80 dark:border-red-800/80 ring-1 ring-red-400/40 bg-red-50/20 dark:bg-red-950/10'
          : isImpediment
          ? 'border-amber-400/80 dark:border-amber-800/80 ring-1 ring-amber-400/40 bg-amber-50/20 dark:bg-amber-950/10'
          : isOverdue
          ? 'border-amber-400/80 dark:border-amber-800/80 ring-1 ring-amber-400/30'
          : isCompleted
          ? 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/10'
          : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600'
      }`}
      id={`card-${demand.code.toLowerCase()}`}
    >
      {/* Blocker Alert Banner if active */}
      {hasRestriction && (
        <div className={`mb-2.5 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-semibold border ${isImpediment ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300' : 'bg-red-100 dark:bg-red-950/80 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'}`}>
          <ShieldAlert className={`w-3.5 h-3.5 shrink-0 ${isImpediment ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`} />
          <span className="truncate">
            {isImpediment ? 'IMPEDIDA' : 'BLOQUEADA'}: {demand.blocker?.reason || 'Restrição registrada'}
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
          title={`Prazo: ${formatCalendarDate(demand.dueDate)}`}
        >
          <Calendar className="w-3 h-3" />
          <span>{formatCalendarDate(demand.dueDate, { day: '2-digit', month: '2-digit' })}</span>
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
          <UserAvatar name={assignee.name} src={assignee.avatar} title={`Responsável: ${assignee.name} (${assignee.roleTitle})`} className="w-6 h-6 rounded-full ring-1 ring-slate-200 dark:ring-slate-700 text-[9px]" />
        ) : (
          <div
            className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-bold"
            title="Sem responsável"
          >
            ?
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const KanbanCard = React.memo(KanbanCardComponent, (previous, next) =>
  previous.demand === next.demand &&
  previous.users === next.users &&
  previous.teams === next.teams &&
  previous.categories === next.categories &&
  previous.priorities === next.priorities &&
  previous.statuses === next.statuses &&
  previous.allowDrag === next.allowDrag &&
  previous.isDragging === next.isDragging &&
  previous.isDropping === next.isDropping
);
