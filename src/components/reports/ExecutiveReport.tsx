/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AppSelect } from '../common/AppSelect';
import { MultiSelectDropdown } from '../common/MultiSelectDropdown';
import { useApp } from '../../context/AppContext';
import { ExportService } from '../../services/exportService';
import { DemandReportTemplate } from './DemandReportTemplate';
import { IconRenderer } from '../common/IconRenderer';
import { formatCalendarDate, isCalendarDateOverdue } from '../../utils/date';
import { apiClient } from '../../services/apiClient';
import { ReportBuilderDrawer } from './ReportBuilderDrawer';
import { ExecutiveOverviewReportV2 as ExecutiveOverviewReport } from './ExecutiveOverviewReportV2';
import { MotionButton } from '../motion/MotionButton';
import { AnimatedNumber } from '../common/AnimatedNumber';
import { staggerContainer, staggerItem } from '../motion/presets';
import { createDefaultReportConfiguration, createNativePreset, ReportConfiguration, ReportPreset } from './reportBuilder';
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
  ,Loader2
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
  const [busyAction, setBusyAction] = useState<'copy' | 'print' | null>(null);
  const reduceMotion = useReducedMotion();

  // Filters for the Demand Report
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string; company: string; active: boolean }>>([]);
  const [periodSelection, setPeriodSelection] = useState<string>('current_quarter');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [reportConfig, setReportConfig] = useState<ReportConfiguration>(() => createDefaultReportConfiguration(statuses, categories));
  const [reportPresets, setReportPresets] = useState<ReportPreset[]>([]);
  const configurationBeforeOpen = useRef<ReportConfiguration | null>(null);

  const now = new Date();

  // Compute selected issuer name & role
  useEffect(() => {
    let active = true;
    apiClient.clients()
      .then((items) => {
        if (active) setClients(items.filter((client: { active: boolean }) => client.active));
      })
      .catch(() => {
        if (active) setClients([]);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!reportConfig.statusIds.length && statuses.length) setReportConfig(createDefaultReportConfiguration(statuses, categories));
  }, [statuses, categories]);

  useEffect(() => {
    apiClient.reportPresets().then(setReportPresets).catch(() => setReportPresets([]));
  }, []);

  const selectedClientLabel = useMemo(() => {
    if (!selectedClientIds.length) return 'Todos os clientes';
    return selectedClientIds.map(clientId => {
      if (clientId === '__internal__') return 'Solicitação interna / sem cliente';
      const client = clients.find(item => item.id === clientId);
      return client ? `${client.company} — ${client.name}` : 'Cliente não encontrado';
    }).join(' e ');
  }, [clients, selectedClientIds]);

  const selectedUserLabel = useMemo(() => {
    if (!selectedUserIds.length) return 'Todos os usuários';
    return users.filter(user => selectedUserIds.includes(user.id)).map(user => user.name).join(' e ');
  }, [selectedUserIds, users]);

  const selectedTeamLabel = useMemo(() => {
    if (!selectedTeamIds.length) return 'Todas as equipes';
    return teams
      .filter(team => selectedTeamIds.includes(team.id))
      .map(team => team.name.toLocaleUpperCase('pt-BR'))
      .join(' E ');
  }, [selectedTeamIds, teams]);

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
    } else if (periodSelection === 'previous_quarter') {
      const quarterStart = Math.floor(month / 3) * 3;
      start = new Date(year, quarterStart - 3, 1); end = new Date(year, quarterStart, 1);
    } else if (periodSelection === 'current_year') {
      start = new Date(year, 0, 1); end = new Date(year + 1, 0, 1);
    }
    const format = (date: Date) => date.toLocaleDateString('pt-BR');
    return { start, end, label: start && end ? `${format(start)} a ${format(new Date(end.getTime() - 86400000))}` : 'Todo o histórico' };
  }, [periodSelection]);
  const periodText = periodRange.label;

  // Filter demands based on user/team selection
  const reportDemands = useMemo(() => {
    return demands.filter((d) => {
      // User filter (assignee or requester)
      if (selectedUserIds.length && !selectedUserIds.includes(d.assigneeId) && !selectedUserIds.includes(d.requesterId)) return false;

      // Team filter
      if (selectedTeamIds.length && !selectedTeamIds.includes(d.teamId)) return false;

      if (selectedClientIds.length) {
        const matchesClient = d.clientId ? selectedClientIds.includes(d.clientId) : selectedClientIds.includes('__internal__');
        if (!matchesClient) return false;
      }

      if (periodRange.start && periodRange.end) {
        const inRange=(value?:string)=>{if(!value)return false;const date=new Date(value);return date>=periodRange.start!&&date<periodRange.end!;};
        if (!inRange(d.createdAt) && !inRange(`${d.dueDate}T12:00:00`) && !inRange(d.completedAt)) return false;
      }

      if (!reportConfig.statusIds.includes(d.statusId) || !reportConfig.categoryIds.includes(d.categoryId)) return false;
      if (reportConfig.priorityIds.length && !reportConfig.priorityIds.includes(d.priorityId)) return false;

      return true;
    });
  }, [demands, selectedUserIds, selectedTeamIds, selectedClientIds, periodRange, reportConfig]);

  // Separate metrics for 5W2H view
  const pendingDemands = reportDemands.filter((d) => {
    const s = statuses.find((st) => st.id === d.statusId);
    return s?.category !== 'completed' && s?.category !== 'cancelled';
  });

  const blockedDemands = pendingDemands.filter((d) => d.blocker?.isBlocked || reportConfig.impedimentStatusIds.includes(d.statusId));
  const overdueDemands = pendingDemands.filter((d) => isCalendarDateOverdue(d.dueDate, now));
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

  const openBuilder=()=>{configurationBeforeOpen.current=structuredClone(reportConfig);setIsBuilderOpen(true);};
  const cancelBuilder=()=>{if(configurationBeforeOpen.current)setReportConfig(configurationBeforeOpen.current);setIsBuilderOpen(false);};
  const savePreset=async(name:string)=>{const saved=await apiClient.saveReportPreset(name,reportConfig) as ReportPreset;setReportPresets(previous=>[saved,...previous.filter(item=>item.id!==saved.id&&item.name!==saved.name)]);showToast({type:'success',title:'Configuração salva',message:`O preset "${saved.name}" foi salvo no banco de dados.`});};

  const handleExportPng = async () => {
    try {
      setIsExportingPng(true);
      const containerId =
        activeTab === 'visual_template'
          ? 'demand-report-printable-card'
          : 'executive-board-report-container';

      const fileName = `Relatorio_Demandas_${
        selectedUserIds.length
          ? selectedUserLabel.replace(/\s+/g, '_')
          : selectedTeamIds.length
          ? selectedTeamLabel.replace(/\s+/g, '_')
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
    setBusyAction('print');
    window.setTimeout(() => { window.print(); setBusyAction(null); }, 180);
  };

  const handleCopySummaryText = async () => {
    setBusyAction('copy');
    const completedCount = reportDemands.filter((d) => {
      const s = statuses.find((st) => st.id === d.statusId);
      return s?.category === 'completed';
    }).length;
    const pendingCount = reportDemands.length - completedCount;
    const progress = reportDemands.length > 0 ? Math.round((completedCount / reportDemands.length) * 100) : 0;

    let text = `📊 RELATÓRIO DE DEMANDAS - ${periodText.toUpperCase()}\n`;
    text += `Cliente solicitante: ${selectedClientLabel}\n`;
    text += `Alvo: ${
      selectedUserIds.length
        ? `Usuários ${selectedUserLabel}`
        : selectedTeamIds.length
        ? `Equipes ${selectedTeamLabel}`
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
      const due = formatCalendarDate(d.dueDate);
      text += `${idx + 1}. [${d.code}] ${d.title} | Resp: ${assignee} | Prazo: ${due}\n`;
    });

    await navigator.clipboard.writeText(text);
    showToast({
      type: 'success',
      title: 'Resumo Copiado',
      message: 'Texto estruturado do relatório copiado para a área de transferência.'
    });
    setBusyAction(null);
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
              <MotionButton
                onClick={() => void handleCopySummaryText()}
                disabled={busyAction === 'copy'}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 flex items-center space-x-1.5 transition-colors"
              title="Copiar texto resumido para WhatsApp ou E-mail"
            >
                {busyAction === 'copy' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{busyAction === 'copy' ? 'Copiando…' : 'Copiar Texto'}</span>
              </MotionButton>

            {/* Print / PDF */}
            <MotionButton
              onClick={handlePrint}
              disabled={busyAction === 'print'}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 flex items-center space-x-1.5 transition-colors"
              title="Imprimir ou Salvar em PDF"
            >
              {busyAction === 'print' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{busyAction === 'print' ? 'Preparando…' : 'Imprimir / PDF'}</span>
            </MotionButton>

            {/* Export PNG */}
            <MotionButton
              onClick={handleExportPng}
              disabled={isExportingPng}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 flex items-center space-x-1.5 transition-colors shadow-xs"
              title="Baixar imagem PNG de alta resolução"
            >
              {isExportingPng ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
              <span>{isExportingPng ? 'Gerando...' : 'Exportar Imagem'}</span>
            </MotionButton>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* 1. Filter by User */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Filtrar por Usuário:</span>
            </label>
            <MultiSelectDropdown
              values={selectedUserIds}
              onChange={setSelectedUserIds}
              allLabel={`Todos os Usuários (${demands.length} demandas)`}
              ariaLabel="Filtrar por usuários"
              options={users.map(user => ({
                value: user.id,
                label: user.name,
                description: `${user.roleTitle} · ${demands.filter(demand => demand.assigneeId === user.id || demand.requesterId === user.id).length} demandas`,
              }))}
            />
          </div>

          {/* 2. Filter by Team */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Filtrar por Equipe (Squad):</span>
            </label>
            <MultiSelectDropdown
              values={selectedTeamIds}
              onChange={setSelectedTeamIds}
              allLabel="Todas as Equipes"
              ariaLabel="Filtrar por equipes"
              options={teams.map(team => ({
                value: team.id,
                label: team.name,
                description: `${demands.filter(demand => demand.teamId === team.id).length} demandas`,
              }))}
            />
          </div>

          {/* 3. Cliente solicitante */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>Cliente solicitante:</span>
            </label>
            <MultiSelectDropdown
              values={selectedClientIds}
              onChange={setSelectedClientIds}
              allLabel="Todos os clientes"
              ariaLabel="Filtrar por clientes solicitantes"
              options={[
                {
                  value: '__internal__',
                  label: 'Solicitação interna / sem cliente',
                  description: `${demands.filter(demand => !demand.clientId).length} demandas`,
                },
                ...clients.map(client => ({
                  value: client.id,
                  label: client.company,
                  description: `${client.name} · ${demands.filter(demand => demand.clientId === client.id).length} demandas`,
                })),
              ]}
            />
          </div>

          {/* 4. Period Filter */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Período do Relatório:</span>
            </label>
            <AppSelect
              value={periodSelection}
              onChange={(e) => setPeriodSelection(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="current_quarter">Trimestre atual</option>
              <option value="previous_quarter">Trimestre anterior</option>
              <option value="current_year">Ano atual</option>
              <option value="current_month">Mês atual</option>
              <option value="last_month">Mês anterior</option>
              <option value="last_30_days">Últimos 30 Dias</option>
              <option value="all_time">Todo o Histórico</option>
            </AppSelect>
          </div>
          <div className="flex items-end">
            <button onClick={openBuilder} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 font-bold text-white shadow-sm hover:bg-blue-700">
              <SlidersHorizontal className="h-4 w-4"/><span>Personalizar Relatório</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Content Display */}
      {activeTab === 'visual_template' ? (
        /* Visual Format from User's Image - Compact Fit */
        <div className="w-full flex justify-center py-2">
          <ExecutiveOverviewReport
            id="demand-report-printable-card"
            demands={reportDemands}
            categories={categories}
            statuses={statuses}
            clientFilterText={selectedClientLabel}
            teamFilterText={selectedTeamLabel}
            periodText={periodText}
            configuration={reportConfig}
            periodStart={periodRange.start}
            onConfigure={openBuilder}
          />
        </div>
      ) : (
        /* 5W2H Deep Dive Strategic Diagnostic */
        <div id="executive-board-report-container" className="space-y-6">
          {/* Quick Stats Grid */}
          {reportConfig.blocks.includes('indicators') && <motion.div variants={reduceMotion ? undefined : staggerContainer(0.04, 0.08)} initial={reduceMotion ? false : 'hidden'} animate="visible" className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <motion.div variants={reduceMotion ? undefined : staggerItem} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Taxa de Conclusão</p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                <AnimatedNumber value={completionRate} suffix="%" />
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{completedDemands.length} de {reportDemands.length} concluídas</p>
            </motion.div>

            <motion.div variants={reduceMotion ? undefined : staggerItem} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-red-200 dark:border-red-900/60 shadow-xs bg-red-50/20">
              <p className="text-[11px] font-bold text-red-500 uppercase">Exceções Operacionais</p>
              <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
                <AnimatedNumber value={blockedDemands.length + overdueDemands.length} />
              </p>
              <p className="text-[10px] text-red-600 dark:text-red-400 font-semibold mt-0.5">
                {blockedDemands.length} bloqueadas · {overdueDemands.length} atrasadas
              </p>
            </motion.div>

            <motion.div variants={reduceMotion ? undefined : staggerItem} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 shadow-xs bg-amber-50/20">
              <p className="text-[11px] font-bold text-amber-500 uppercase">Lead Time Médio</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                <AnimatedNumber value={averageLeadTime} suffix=" dias" />
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                Da criação à conclusão
              </p>
            </motion.div>

            <motion.div variants={reduceMotion ? undefined : staggerItem} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Conformidade SLA</p>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                <AnimatedNumber value={slaCompliance} suffix="%" />
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Demandas sem violação registrada</p>
            </motion.div>
          </motion.div>}

          {/* 5W2H Cards */}
          {(reportConfig.blocks.includes('ongoing') || reportConfig.blocks.includes('blocked') || reportConfig.blocks.includes('validation')) && <div className="space-y-4">
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
                const isOverdue = isCalendarDateOverdue(demand.dueDate, now);

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
                          {formatCalendarDate(demand.dueDate)}
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
          </div>}
        </div>
      )}
      <ReportBuilderDrawer open={isBuilderOpen} config={reportConfig} demands={reportDemands} statuses={statuses} categories={categories} priorities={priorities} users={users} teams={teams} clients={clients} presets={reportPresets} onChange={setReportConfig} onCancel={cancelBuilder} onClose={()=>setIsBuilderOpen(false)} onRestore={()=>setReportConfig(createDefaultReportConfiguration(statuses,categories))} onSave={savePreset} onLoad={preset=>setReportConfig({...preset.configuration,showRisksAndDecisions:Boolean(preset.configuration.showRisksAndDecisions),riskItems:preset.configuration.riskItems||[],showImpactDeliveries:preset.configuration.showImpactDeliveries!==false,impactItems:preset.configuration.impactItems||[],showMilestones:preset.configuration.showMilestones!==false,milestoneItems:preset.configuration.milestoneItems||[]})} onNativePreset={name=>setReportConfig(createNativePreset(name,statuses,categories))}/>
    </div>
  );
};
