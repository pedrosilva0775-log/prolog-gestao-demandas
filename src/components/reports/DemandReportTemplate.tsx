/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Demand, User, Team, CategoryConfig, PriorityConfig, StatusConfig } from '../../types';
import { Crown, BookOpen, Cog, Calendar, Check, Hourglass, ClipboardList } from 'lucide-react';

interface DemandReportTemplateProps {
  id?: string;
  demands: Demand[];
  users: User[];
  teams: Team[];
  categories: CategoryConfig[];
  priorities: PriorityConfig[];
  statuses: StatusConfig[];
  issuerName?: string;
  issuerRole?: string;
  periodText?: string;
  generatedDateText?: string;
  isPrintMode?: boolean;
}

export const DemandReportTemplate: React.FC<DemandReportTemplateProps> = ({
  id = 'demand-report-printable-card',
  demands,
  users,
  teams,
  categories,
  priorities,
  statuses,
  issuerName = 'Carlos Almeida',
  issuerRole = 'Diretor',
  periodText = '01 a 31 de agosto de 2026',
  generatedDateText = new Date().toLocaleDateString('pt-BR'),
  isPrintMode = false
}) => {
  const userMap = new Map<string, User>(users.map((u) => [u.id, u]));
  const teamMap = new Map<string, Team>(teams.map((t) => [t.id, t]));
  const catMap = new Map<string, CategoryConfig>(categories.map((c) => [c.id, c]));
  const prioMap = new Map<string, PriorityConfig>(priorities.map((p) => [p.id, p]));
  const statusMap = new Map<string, StatusConfig>(statuses.map((s) => [s.id, s]));

  const now = new Date();

  // Separate into pending vs completed
  const pendingDemands = demands.filter((d) => {
    const s = statusMap.get(d.statusId);
    return s?.category !== 'completed' && s?.category !== 'cancelled';
  });

  const completedDemands = demands.filter((d) => {
    const s = statusMap.get(d.statusId);
    return s?.category === 'completed';
  });

  const totalCount = demands.length;
  const pendingCount = pendingDemands.length;
  const completedCount = completedDemands.length;

  const completedPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const pendingPercentage = totalCount > 0 ? 100 - completedPercentage : 0;

  const getDeadlineInfo = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const dateFormatted = due.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    if (diffDays < 0) {
      return {
        formatted: dateFormatted,
        statusLabel: 'Atrasado',
        statusType: 'overdue',
        badgeClass: 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800',
        textClass: 'text-red-600 dark:text-red-400'
      };
    } else if (diffDays <= 3) {
      return {
        formatted: dateFormatted,
        statusLabel: 'Próximo',
        statusType: 'warning',
        badgeClass: 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800',
        textClass: 'text-amber-600 dark:text-amber-400'
      };
    } else {
      return {
        formatted: dateFormatted,
        statusLabel: 'No prazo',
        statusType: 'ontime',
        badgeClass: 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        textClass: 'text-slate-700 dark:text-slate-300'
      };
    }
  };

  const getPriorityDisplay = (priorityId: string) => {
    const p = prioMap.get(priorityId);
    const name = p?.name || 'Média';
    const level = p?.level || 3;

    let dotColor = 'bg-amber-500';
    if (level >= 4) dotColor = 'bg-red-500';
    else if (level <= 2) dotColor = 'bg-emerald-500';

    return { name, dotColor };
  };

  const getCategoryIcon = (categoryId: string) => {
    if (categoryId.includes('projeto')) {
      return {
        icon: <Crown className="w-3 h-3 text-white" />,
        bg: 'bg-amber-600',
        label: 'Projeto'
      };
    } else if (categoryId.includes('melhoria')) {
      return {
        icon: <BookOpen className="w-3 h-3 text-white" />,
        bg: 'bg-teal-600',
        label: 'Melhoria'
      };
    } else {
      return {
        icon: <Cog className="w-3 h-3 text-white" />,
        bg: 'bg-indigo-600',
        label: 'Tarefa'
      };
    }
  };

  const getPendingReason = (demand: Demand) => {
    if (demand.blocker?.isBlocked && demand.blocker.reason) {
      return demand.blocker.reason;
    }
    const status = statusMap.get(demand.statusId);
    if (status?.category === 'waiting') {
      return status.description || 'Aguardando aprovação';
    }
    if (demand.whyReason) {
      return demand.whyReason.length > 28 ? demand.whyReason.slice(0, 28) + '...' : demand.whyReason;
    }
    if (status?.name) {
      return status.name;
    }
    return 'Em andamento';
  };

  const getDeliveredResult = (demand: Demand) => {
    if (demand.completionSummary) {
      return demand.completionSummary.length > 28 ? demand.completionSummary.slice(0, 28) + '...' : demand.completionSummary;
    }
    if (demand.completedAt) {
      const dateStr = new Date(demand.completedAt).toLocaleDateString('pt-BR');
      return `Concluída em ${dateStr}`;
    }
    const dueDateStr = new Date(demand.dueDate).toLocaleDateString('pt-BR');
    return `Concluída em ${dueDateStr}`;
  };

  // Donut chart stroke calculation
  const circumference = 2 * Math.PI * 15; // radius 15 => ~94.24
  const strokeDashoffset = circumference - (completedPercentage / 100) * circumference;

  return (
    <div
      id={id}
      className={`w-full max-w-[1280px] mx-auto bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-lg font-sans text-slate-800 dark:text-slate-100 ${
        isPrintMode ? 'p-2 shadow-none border-none bg-white text-slate-900' : ''
      }`}
      style={{ boxSizing: 'border-box' }}
    >
      {/* 1. Header Section */}
      <div className="flex flex-row items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1E3F] dark:text-blue-200 uppercase leading-none">
            RELATÓRIO DE DEMANDAS
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
            Demandas repassadas por:{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {issuerName}
            </span>{' '}
            — <span className="text-slate-500 dark:text-slate-400">{issuerRole}</span>
          </p>
        </div>

        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Período: {periodText}</span>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards Row (5 Cards - Compact Single Row) */}
      <div className="grid grid-cols-5 gap-2.5 py-3">
        {/* Card 1: Total Demandas */}
        <div className="bg-slate-50/90 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-700/60 flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-full bg-[#0B1E3F] text-white flex items-center justify-center shrink-0 shadow-xs">
            <ClipboardList className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-black text-slate-900 dark:text-white leading-none">
              {totalCount}
            </p>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              demandas
            </p>
          </div>
        </div>

        {/* Card 2: Pendentes */}
        <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded-xl p-2.5 border border-amber-200/80 dark:border-amber-800/40 flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Hourglass className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-black text-amber-700 dark:text-amber-400 leading-none">
              {pendingCount}
            </p>
            <p className="text-[10px] font-semibold text-amber-700/80 dark:text-amber-300 mt-0.5 truncate">
              pendentes
            </p>
          </div>
        </div>

        {/* Card 3: Concluídas */}
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl p-2.5 border border-emerald-200/80 dark:border-emerald-800/40 flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Check className="w-4.5 h-4.5 stroke-[3]" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 leading-none">
              {completedCount}
            </p>
            <p className="text-[10px] font-semibold text-emerald-700/80 dark:text-emerald-300 mt-0.5 truncate">
              concluídas
            </p>
          </div>
        </div>

        {/* Card 4: Donut Split */}
        <div className="bg-slate-50/90 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-700/60 flex items-center space-x-2">
          <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
            <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="4.5"
                className="text-amber-400 dark:text-amber-500/80"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="4.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="text-emerald-600 dark:text-emerald-400 transition-all duration-700"
              />
            </svg>
            <span className="absolute text-[9px] font-black text-slate-800 dark:text-slate-100">
              {completedPercentage}%
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-amber-600 dark:text-amber-400 leading-tight">
              {pendingPercentage}%
            </p>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              em aberto
            </p>
          </div>
        </div>

        {/* Card 5: Progresso Geral Bar */}
        <div className="bg-slate-50/90 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              PROGRESSO GERAL
            </span>
            <span className="text-base font-black text-[#0B1E3F] dark:text-blue-300 leading-none">
              {completedPercentage}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="my-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden p-0.5">
            <div
              className="bg-[#0B1E3F] dark:bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completedPercentage}%` }}
            />
          </div>

          {/* Scale Labels */}
          <div className="flex justify-between text-[8px] font-bold text-slate-500 dark:text-slate-400 px-0.5">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* 3. Main Tables: Side-by-Side PENDENTES & CONCLUÍDAS */}
      <div className="grid grid-cols-2 gap-3.5 my-2">
        {/* ========================================================================= */}
        {/* PANEL LEFT: PENDENTES */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col">
          {/* Section Header */}
          <div className="px-3 py-2 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <div className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center shadow-2xs">
                <Hourglass className="w-3 h-3" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                PENDENTES
              </h2>
            </div>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
              {pendingDemands.length} itens
            </span>
          </div>

          {/* Fixed-layout Table */}
          <div className="w-full">
            <table className="w-full table-fixed text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  <th className="py-1.5 px-2 w-[31%]">Demanda</th>
                  <th className="py-1.5 px-2 w-[22%]">Responsável</th>
                  <th className="py-1.5 px-2 w-[17%]">Prazo</th>
                  <th className="py-1.5 px-1.5 w-[14%]">Prioridade</th>
                  <th className="py-1.5 px-2 w-[16%]">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {pendingDemands.map((demand) => {
                  const assignee = userMap.get(demand.assigneeId);
                  const deadline = getDeadlineInfo(demand.dueDate);
                  const priority = getPriorityDisplay(demand.priorityId);
                  const cat = getCategoryIcon(demand.categoryId);
                  const pendingReason = getPendingReason(demand);

                  return (
                    <tr
                      key={demand.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Demanda + Icon Badge */}
                      <td className="py-2 px-2 align-top">
                        <div className="flex items-start space-x-1.5">
                          <div
                            className={`w-5.5 h-5.5 rounded-md ${cat.bg} flex items-center justify-center shrink-0 shadow-2xs mt-0.5`}
                            title={cat.label}
                          >
                            {cat.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 dark:text-slate-100 leading-tight line-clamp-2 text-[10.5px]">
                              {demand.title}
                            </p>
                            <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                              {cat.label}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Responsável */}
                      <td className="py-2 px-2 align-top">
                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate text-[10.5px]">
                          {assignee?.name || 'Não atribuído'}
                        </p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                          {assignee?.roleTitle || 'Colaborador'}
                        </p>
                      </td>

                      {/* Prazo + Badge */}
                      <td className="py-2 px-2 align-top">
                        <p className={`font-bold text-[10px] leading-tight ${deadline.textClass}`}>
                          {deadline.formatted}
                        </p>
                        <span
                          className={`inline-block text-[8.5px] font-bold px-1.5 py-0.2 rounded mt-0.5 leading-none ${deadline.badgeClass}`}
                        >
                          {deadline.statusLabel}
                        </span>
                      </td>

                      {/* Prioridade */}
                      <td className="py-2 px-1.5 align-top">
                        <div className="flex items-center space-x-1 mt-0.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${priority.dotColor} shrink-0`}
                          />
                          <span className="font-semibold text-slate-700 dark:text-slate-300 text-[10px] truncate">
                            {priority.name}
                          </span>
                        </div>
                      </td>

                      {/* Motivo da pendência */}
                      <td className="py-2 px-2 align-top text-slate-600 dark:text-slate-400">
                        <span className="text-[9.5px] leading-tight line-clamp-2 block">
                          {pendingReason}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {pendingDemands.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                      Nenhuma demanda pendente encontrada para este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PANEL RIGHT: CONCLUÍDAS */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col">
          {/* Section Header */}
          <div className="px-3 py-2 bg-emerald-50/60 dark:bg-emerald-950/20 border-b border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                CONCLUÍDAS
              </h2>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
              {completedDemands.length} entregues
            </span>
          </div>

          {/* Fixed-layout Table */}
          <div className="w-full">
            <table className="w-full table-fixed text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  <th className="py-1.5 px-2 w-[31%]">Demanda</th>
                  <th className="py-1.5 px-2 w-[22%]">Responsável</th>
                  <th className="py-1.5 px-2 w-[17%]">Prazo</th>
                  <th className="py-1.5 px-1.5 w-[14%]">Prioridade</th>
                  <th className="py-1.5 px-2 w-[16%]">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {completedDemands.map((demand) => {
                  const assignee = userMap.get(demand.assigneeId);
                  const priority = getPriorityDisplay(demand.priorityId);
                  const cat = getCategoryIcon(demand.categoryId);
                  const deliveredResult = getDeliveredResult(demand);
                  const dueDateFormatted = new Date(demand.dueDate).toLocaleDateString('pt-BR');

                  return (
                    <tr
                      key={demand.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Demanda + Icon Badge */}
                      <td className="py-2 px-2 align-top">
                        <div className="flex items-start space-x-1.5">
                          <div
                            className={`w-5.5 h-5.5 rounded-md ${cat.bg} flex items-center justify-center shrink-0 shadow-2xs mt-0.5`}
                            title={cat.label}
                          >
                            {cat.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 dark:text-slate-100 leading-tight line-clamp-2 text-[10.5px]">
                              {demand.title}
                            </p>
                            <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                              {cat.label}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Responsável */}
                      <td className="py-2 px-2 align-top">
                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate text-[10.5px]">
                          {assignee?.name || 'Não atribuído'}
                        </p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                          {assignee?.roleTitle || 'Colaborador'}
                        </p>
                      </td>

                      {/* Prazo */}
                      <td className="py-2 px-2 align-top">
                        <p className="font-bold text-emerald-600 dark:text-emerald-400 text-[10px] leading-tight">
                          {dueDateFormatted}
                        </p>
                      </td>

                      {/* Prioridade */}
                      <td className="py-2 px-1.5 align-top">
                        <div className="flex items-center space-x-1 mt-0.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${priority.dotColor} shrink-0`}
                          />
                          <span className="font-semibold text-slate-700 dark:text-slate-300 text-[10px] truncate">
                            {priority.name}
                          </span>
                        </div>
                      </td>

                      {/* Resultado entregue */}
                      <td className="py-2 px-2 align-top text-emerald-700 dark:text-emerald-300">
                        <span className="text-[9.5px] font-medium leading-tight line-clamp-2 block">
                          {deliveredResult}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {completedDemands.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                      Nenhuma demanda concluída encontrada para este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Footer Section: Legends and Generation Timestamp */}
      <div className="pt-3 mt-1 border-t border-slate-200/80 dark:border-slate-800 flex flex-row items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
        {/* Left: Prazo Legend */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Atrasado</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Próximo do prazo (até 3 dias)
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
            <span className="font-medium text-slate-700 dark:text-slate-300">No prazo</span>
          </div>
        </div>

        {/* Center: Category Legend */}
        <div className="flex items-center space-x-3 border-x border-slate-200 dark:border-slate-700 px-4">
          <div className="flex items-center space-x-1">
            <Crown className="w-3 h-3 text-amber-600" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Projeto</span>
          </div>
          <div className="flex items-center space-x-1">
            <BookOpen className="w-3 h-3 text-teal-600" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Melhoria</span>
          </div>
          <div className="flex items-center space-x-1">
            <Cog className="w-3 h-3 text-indigo-600" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Tarefa</span>
          </div>
        </div>

        {/* Right: Timestamp */}
        <div className="flex items-center space-x-1 font-semibold text-slate-600 dark:text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Gerado em {generatedDateText}</span>
        </div>
      </div>
    </div>
  );
};
