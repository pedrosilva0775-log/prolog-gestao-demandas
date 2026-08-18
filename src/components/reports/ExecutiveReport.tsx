/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ExportService } from '../../services/exportService';
import { DemandReportTemplate } from './DemandReportTemplate';
import { IconRenderer } from '../common/IconRenderer';
import {
  FileSpreadsheet,
  Download,
  Image as ImageIcon,
  AlertOctagon,
  Clock,
  CheckCircle2,
  Calendar,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Info,
  Filter,
  UserCheck,
  Users,
  Printer,
  Copy,
  LayoutTemplate,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

export const ExecutiveReport: React.FC = () => {
  const {
    demands,
    filteredDemands,
    users,
    teams,
    categories,
    statuses,
    priorities,
    currentUser,
    setSelectedDemand,
    setExportModalOpen,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'visual_template' | 'detailed_5w2h'>('visual_template');
  const [isExportingPng, setIsExportingPng] = useState(false);

  // Filters for the Demand Report
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [selectedIssuerId, setSelectedIssuerId] = useState<string>(currentUser.id);
  const [periodSelection, setPeriodSelection] = useState<string>('current_month');

  const now = new Date();

  // Compute selected issuer name & role
  const issuer = users.find((u) => u.id === selectedIssuerId) || currentUser;
  const issuerName = issuer.name;
  const issuerRole = issuer.roleTitle || 'Diretoria / Gestão';

  const periodRange = useMemo(() => {
    const year = now.getFullYear();
    const month = now.getMonth();
    let start: Date | null = null;
    let end: Date | null = null;
    if (periodSelection === 'current_month') {
      start = new Date(year, month, 1); end = new Date(year, month + 1, 1);
    } else if (periodSelection === 'last_month') {
      start = new Date(year, month - 1, 1); end = new Date(year, month, 1);
    } else if (periodSelection === 'last_30_days') {
      start = new Date(now); start.setDate(start.getDate() - 30); end = new Date(now.getTime() + 86400000);
    } else if (periodSelection === 'current_quarter') {
      const quarterStart = Math.floor(month / 3) * 3;
      start = new Date(year, quarterStart, 1); end = new Date(year, quarterStart + 3, 1);
    }
    const format = (date: Date) => date.toLocaleDateString('pt-BR');
    return { start, end, label: start && end ? `${format(start)} a ${format(new Date(end.getTime() - 86400000))}` : 'Todo o histórico' };
  }, [periodSelection]);
  const periodText = periodRange.label;

  // Filter demands based on user/team selection
  const reportDemands = useMemo(() => {
    return demands.filter((d) => {
      // User filter (assignee or requester)
      if (selectedUserId !== 'all') {
        if (d.assigneeId !== selectedUserId && d.requesterId !== selectedUserId) {
          return false;
        }
      }

      // Team filter
      if (selectedTeamId !== 'all') {
        if (d.teamId !== selectedTeamId) {
          return false;
        }
      }

      if (periodRange.start && periodRange.end) {
        const createdAt = new Date(d.createdAt);
        if (createdAt < periodRange.start || createdAt >= periodRange.end) return false;
      }

      return true;
    });
  }, [demands, selectedUserId, selectedTeamId, periodRange]);

  // Separate metrics for 5W2H view
  const pendingDemands = reportDemands.filter((d) => {
    const s = statuses.find((st) => st.id === d.statusId);
    return s?.category !== 'completed' && s?.category !== 'cancelled';
  });

  const blockedDemands = pendingDemands.filter((d) => d.blocker?.isBlocked);
  const overdueDemands = pendingDemands.filter((d) => new Date(d.dueDate) < now);
  const completedDemands = reportDemands.filter((d) => statuses.find((st) => st.id === d.statusId)?.category === 'completed');
  const completionRate = reportDemands.length ? Math.round((completedDemands.length / reportDemands.length) * 100) : 0;
  const slaCompliance = reportDemands.length ? Math.round((reportDemands.filter((d) => !d.sla?.isBreached).length / reportDemands.length) * 100) : 0;
  const averageLeadTime = completedDemands.length
    ? Math.round(completedDemands.reduce((sum, d) => sum + Math.max(0, (new Date(d.completedAt || d.dueDate).getTime() - new Date(d.createdAt).getTime()) / 86400000), 0) / completedDemands.length)
    : 0;

  const calculateDaysPending = (createdAtStr: string) => {
    const diffMs = now.getTime() - new Date(createdAtStr).getTime();
    return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  };

  const handleExportPng = async () => {
    try {
      setIsExportingPng(true);
      const containerId =
        activeTab === 'visual_template'
          ? 'demand-report-printable-card'
          : 'executive-board-report-container';

      const fileName = `Relatorio_Demandas_${
        selectedUserId !== 'all'
          ? users.find((u) => u.id === selectedUserId)?.name.replace(/\s+/g, '_')
          : selectedTeamId !== 'all'
          ? teams.find((t) => t.id === selectedTeamId)?.name.replace(/\s+/g, '_')
          : 'Geral'
      }_${new Date().toISOString().slice(0, 10)}`;

      await ExportService.exportToPng(containerId, fileName);
      showToast({
        type: 'success',
        title: 'Exportação Concluída',
        message: 'Imagem PNG em alta resolução gerada e baixada com sucesso.'
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro na Exportação',
        message: 'Não foi possível exportar a imagem do relatório.'
      });
    } finally {
      setIsExportingPng(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummaryText = () => {
    const completedCount = reportDemands.filter((d) => {
      const s = statuses.find((st) => st.id === d.statusId);
      return s?.category === 'completed';
    }).length;
    const pendingCount = reportDemands.length - completedCount;
    const progress = reportDemands.length > 0 ? Math.round((completedCount / reportDemands.length) * 100) : 0;

    let text = `📊 RELATÓRIO DE DEMANDAS - ${periodText.toUpperCase()}\n`;
    text += `Demandas repassadas por: ${issuerName} — ${issuerRole}\n`;
    text += `Alvo: ${
      selectedUserId !== 'all'
        ? `Usuário ${users.find((u) => u.id === selectedUserId)?.name}`
        : selectedTeamId !== 'all'
        ? `Equipe ${teams.find((t) => t.id === selectedTeamId)?.name}`
        : 'Visão Geral Consolidada'
    }\n\n`;
    text += `📈 INDICADORES GERAIS:\n`;
    text += `• Total de demandas: ${reportDemands.length}\n`;
    text += `• Pendentes: ${pendingCount}\n`;
    text += `• Concluídas: ${completedCount}\n`;
    text += `• Progresso Geral: ${progress}%\n\n`;

    text += `⏳ DEMANDAS PENDENTES (${pendingCount}):\n`;
    pendingDemands.slice(0, 10).forEach((d, idx) => {
      const assignee = users.find((u) => u.id === d.assigneeId)?.name || 'Não atribuído';
      const due = new Date(d.dueDate).toLocaleDateString('pt-BR');
      text += `${idx + 1}. [${d.code}] ${d.title} | Resp: ${assignee} | Prazo: ${due}\n`;
    });

    navigator.clipboard.writeText(text);
    showToast({
      type: 'success',
      title: 'Resumo Copiado',
      message: 'Texto estruturado do relatório copiado para a área de transferência.'
    });
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Control & Filter Ribbon (Non-printable) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 no-export print:hidden">
        {/* Top bar: Title + View Tabs + Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold uppercase tracking-wider">
                Exportação & Governança
              </span>
              <span className="text-xs text-slate-400">
                Modelo Oficial de Relatório de Demandas
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
              Central de Relatórios Executivos
            </h2>
          </div>

          {/* Tab Switcher & Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                onClick={() => setActiveTab('visual_template')}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                  activeTab === 'visual_template'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                <span>Modelo Visual (Imagem)</span>
              </button>
              <button
                onClick={() => setActiveTab('detailed_5w2h')}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                  activeTab === 'detailed_5w2h'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>Detalhamento 5W2H</span>
              </button>
            </div>

            {/* Copy text */}
            <button
              onClick={handleCopySummaryText}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 flex items-center space-x-1.5 transition-colors"
              title="Copiar texto resumido para WhatsApp ou E-mail"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copiar Texto</span>
            </button>

            {/* Print / PDF */}
            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 flex items-center space-x-1.5 transition-colors"
              title="Imprimir ou Salvar em PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>

            {/* Export PNG */}
            <button
              onClick={handleExportPng}
              disabled={isExportingPng}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 flex items-center space-x-1.5 transition-colors shadow-xs"
              title="Baixar imagem PNG de alta resolução"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{isExportingPng ? 'Gerando...' : 'Exportar Imagem'}</span>
            </button>

            {/* Export Excel */}
            <button
              onClick={() => setExportModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 shadow-sm transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>

        {/* Dynamic Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 1. Filter by User */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Filtrar por Usuário:</span>
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                if (e.target.value !== 'all') setSelectedTeamId('all');
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Todos os Usuários ({demands.length} demandas)</option>
              {users.map((u) => {
                const count = demands.filter(
                  (d) => d.assigneeId === u.id || d.requesterId === u.id
                ).length;
                return (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.roleTitle} ({count} demandas)
                  </option>
                );
              })}
            </select>
          </div>

          {/* 2. Filter by Team */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Filtrar por Equipe (Squad):</span>
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => {
                setSelectedTeamId(e.target.value);
                if (e.target.value !== 'all') setSelectedUserId('all');
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Todas as Equipes</option>
              {teams.map((t) => {
                const count = demands.filter((d) => d.teamId === t.id).length;
                return (
                  <option key={t.id} value={t.id}>
                    {t.name} ({count} demandas)
                  </option>
                );
              })}
            </select>
          </div>

          {/* 3. Demandas repassadas por */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>Demandas repassadas por:</span>
            </label>
            <select
              value={selectedIssuerId}
              onChange={(e) => setSelectedIssuerId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.roleTitle}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Period Filter */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Período do Relatório:</span>
            </label>
            <select
              value={periodSelection}
              onChange={(e) => setPeriodSelection(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="current_month">Mês atual</option>
              <option value="last_month">Mês anterior</option>
              <option value="last_30_days">Últimos 30 Dias</option>
              <option value="current_quarter">Trimestre atual</option>
              <option value="all_time">Todo o Histórico</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Main Content Display */}
      {activeTab === 'visual_template' ? (
        /* Visual Format from User's Image - Compact Fit */
        <div className="w-full flex justify-center py-2">
          <DemandReportTemplate
            id="demand-report-printable-card"
            demands={reportDemands}
            users={users}
            teams={teams}
            categories={categories}
            priorities={priorities}
            statuses={statuses}
            issuerName={issuerName}
            issuerRole={issuerRole}
            periodText={periodText}
            generatedDateText={now.toLocaleDateString('pt-BR')}
          />
        </div>
      ) : (
        /* 5W2H Deep Dive Strategic Diagnostic */
        <div id="executive-board-report-container" className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Taxa de Conclusão</p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {completionRate}%
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{completedDemands.length} de {reportDemands.length} concluídas</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-red-200 dark:border-red-900/60 shadow-xs bg-red-50/20">
              <p className="text-[11px] font-bold text-red-500 uppercase">Exceções Operacionais</p>
              <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
                {blockedDemands.length + overdueDemands.length}
              </p>
              <p className="text-[10px] text-red-600 dark:text-red-400 font-semibold mt-0.5">
                {blockedDemands.length} bloqueadas · {overdueDemands.length} atrasadas
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 shadow-xs bg-amber-50/20">
              <p className="text-[11px] font-bold text-amber-500 uppercase">Lead Time Médio</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {averageLeadTime} dias
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                Da criação à conclusão
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Conformidade SLA</p>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                {slaCompliance}%
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Demandas sem violação registrada</p>
            </div>
          </div>

          {/* 5W2H Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Detalhamento Executivo 5W2H das Demandas Pendentes</span>
              </h3>
              <span className="text-xs text-slate-400">
                Respostas estruturadas para alinhamento com a alta liderança
              </span>
            </div>

            <div className="space-y-4">
              {pendingDemands.map((demand) => {
                const category = categories.find((c) => c.id === demand.categoryId);
                const status = statuses.find((s) => s.id === demand.statusId);
                const priority = priorities.find((p) => p.id === demand.priorityId);
                const assignee = users.find((u) => u.id === demand.assigneeId);
                const team = teams.find((t) => t.id === demand.teamId);
                const isOverdue = new Date(demand.dueDate) < now;

                return (
                  <div
                    key={demand.id}
                    onClick={() => setSelectedDemand(demand)}
                    className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border shadow-xs hover:shadow-md cursor-pointer transition-all ${
                      demand.blocker?.isBlocked
                        ? 'border-red-300 dark:border-red-900/80 ring-1 ring-red-300/40 bg-red-50/10'
                        : isOverdue
                        ? 'border-amber-300 dark:border-amber-900/80 bg-amber-50/10'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {demand.code}
                        </span>
                        {category && (
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${category.bgColor} ${category.textColor} ${category.borderColor}`}
                          >
                            <IconRenderer name={category.iconName} className="w-3.5 h-3.5" />
                            <span>{category.name}</span>
                          </span>
                        )}
                        {priority && (
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${priority.bgColor}`}
                          >
                            <span>{priority.name}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          Status: {status?.name}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          {demand.progressPercent}% Concluído
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-3">
                      {demand.title}
                    </h4>

                    {/* 5W2H Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-xs">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                        <p className="font-bold text-slate-500 uppercase text-[10px]">
                          1. Por que está sendo feita? (Why)
                        </p>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">
                          {demand.whyReason || 'Motivo operacional padrão'}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                        <p className="font-bold text-slate-500 uppercase text-[10px]">
                          2. Quem é o Responsável? (Who)
                        </p>
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {assignee?.name || 'Não atribuído'}
                        </p>
                        <p className="text-[10px] text-slate-400">{team?.name}</p>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                        <p className="font-bold text-slate-500 uppercase text-[10px]">
                          3. Onde impacta? (Where)
                        </p>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">
                          {demand.whereLocation || 'Operação corporativa geral'}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                        <p className="font-bold text-slate-500 uppercase text-[10px]">
                          4. Prazo & SLA (When)
                        </p>
                        <p
                          className={`font-bold ${
                            isOverdue
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {new Date(demand.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {isOverdue ? '⚠️ Prazo vencido' : 'No prazo'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {pendingDemands.length === 0 && (
                <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                  Nenhuma demanda pendente para os filtros selecionados.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
