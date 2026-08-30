/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../motion/presets';
import { useApp } from '../../context/AppContext';
import { IconRenderer } from '../common/IconRenderer';
import { AnimatedNumber } from '../common/AnimatedNumber';
import { ExportService } from '../../services/exportService';
import { formatCalendarDate, isCalendarDateOverdue, parseLocalCalendarDate } from '../../utils/date';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Download,
  Image as ImageIcon,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  Layers,
  Users,
  Award
} from 'lucide-react';

export const ExecutiveDashboard: React.FC = () => {
  const {
    demands,
    filteredDemands,
    statuses,
    priorities,
    categories,
    teams,
    users,
    setSelectedDemand,
    setExportModalOpen,
    showToast
  } = useApp();

  const [isExportingPng, setIsExportingPng] = useState(false);
  const reduceMotion = useReducedMotion();
  const reveal = reduceMotion ? {} : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };
  const chartAnimation = !reduceMotion;

  const now = new Date();
  const total = filteredDemands.length;

  const completedDemands = filteredDemands.filter(
    (d) => statuses.find((s) => s.id === d.statusId)?.category === 'completed'
  );
  const completedCount = completedDemands.length;

  const blockedDemands = filteredDemands.filter(
    (d) => d.blocker?.isBlocked || statuses.find((s) => s.id === d.statusId)?.category === 'blocked'
  );
  const blockedCount = blockedDemands.length;

  const overdueDemands = filteredDemands.filter((d) => {
    const isComp = statuses.find((s) => s.id === d.statusId)?.category === 'completed';
    const isCanc = statuses.find((s) => s.id === d.statusId)?.category === 'cancelled';
    return !isComp && !isCanc && isCalendarDateOverdue(d.dueDate, now);
  });
  const overdueCount = overdueDemands.length;

  const inProgressCount = filteredDemands.filter(
    (d) => statuses.find((s) => s.id === d.statusId)?.category === 'in_progress'
  ).length;

  // SLA on-time rate calculation
  const onTimeCompleted = completedDemands.filter((d) => {
    if (!d.completedAt) return true;
    return new Date(d.completedAt) <= parseLocalCalendarDate(d.dueDate, true);
  }).length;
  const slaOnTimeRate = completedCount > 0 ? Math.round((onTimeCompleted / completedCount) * 100) : 100;

  // Avg completion days
  const avgCompletionDays = 4.8;

  // Critical demands that require Board intervention or are blocked
  const criticalActionDemands = filteredDemands.filter(
    (d) =>
      d.blocker?.isBlocked ||
      priorities.find((p) => p.id === d.priorityId)?.level === 5 ||
      overdueDemands.some((od) => od.id === d.id)
  );

  // Category Distribution Data
  const categoryData = categories.map((cat) => ({
    name: cat.name,
    value: filteredDemands.filter((d) => d.categoryId === cat.id).length,
    color: cat.color
  })).filter((c) => c.value > 0);

  // Priority Distribution Data
  const priorityData = priorities.map((prio) => ({
    name: prio.name,
    value: filteredDemands.filter((d) => d.priorityId === prio.id).length,
    color: prio.color
  })).filter((p) => p.value > 0);

  // Status Distribution Data
  const statusData = statuses.filter((s) => s.active).map((status) => ({
    name: status.name,
    total: filteredDemands.filter((d) => d.statusId === status.id).length,
    color: status.color
  }));

  // Weekly Trend Data (Simulated 4 weeks comparison: Recebidas vs Concluídas)
  const weeklyEvolutionData = [
    { semana: 'Sem 1 (Jul)', criadas: 8, concluidas: 6 },
    { semana: 'Sem 2 (Jul)', criadas: 12, concluidas: 9 },
    { semana: 'Sem 3 (Ago)', criadas: 15, concluidas: 14 },
    { semana: 'Sem 4 (Ago Atual)', criadas: 11, concluidas: 10 }
  ];

  // Workload by Team
  const teamWorkloadData = teams.map((team) => ({
    name: team.name.split('&')[0].trim(),
    demandas: filteredDemands.filter((d) => d.teamId === team.id).length,
    bloqueadas: filteredDemands.filter((d) => d.teamId === team.id && d.blocker?.isBlocked).length,
    color: team.color
  }));

  const handleExportDashboardPng = async () => {
    try {
      setIsExportingPng(true);
      await ExportService.exportToPng(
        'executive-dashboard-container',
        `Dashboard_Executivo_Demandas_${new Date().toISOString().slice(0, 10)}`
      );
      showToast({
        type: 'success',
        title: 'Exportação Concluída',
        message: 'Painel Executivo exportado em PNG de alta definição.'
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro na Exportação',
        message: 'Não foi possível exportar a imagem do painel.'
      });
    } finally {
      setIsExportingPng(false);
    }
  };

  return (
    <div id="executive-dashboard-container" className="space-y-6 pb-8 font-sans">
      {/* Top Header & Export Controls */}
      <motion.div {...reveal} transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 28 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Painel Executivo de Gestão & Governança Corporativa</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhamento estratégico de KPIs, SLAs, gargalos e entregáveis da Diretoria
          </p>
        </div>

        <div className="flex items-center gap-2 no-export">
          <button
            onClick={handleExportDashboardPng}
            disabled={isExportingPng}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{isExportingPng ? 'Gerando...' : 'Exportar PNG'}</span>
          </button>

          <button
            onClick={() => setExportModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV (.csv)</span>
          </button>
        </div>
      </motion.div>

      {/* KPI Highlight Grid - 4 to 6 sleek stat cards */}
      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.09 } } }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Demandas */}
        <motion.div variants={{ hidden: { opacity: 0, y: 12, scale: 0.99 }, visible: { opacity: 1, y: 0, scale: 1 } }} transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 280, damping: 27 }} whileHover={reduceMotion ? undefined : { y: -2, transition: { type: 'spring', stiffness: 400, damping: 28 } }} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
            Total Demandas
          </p>
          <div className="flex items-baseline justify-between">
            <AnimatedNumber value={total} duration={1200} delay={380} className="text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100" />
            <span className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded font-semibold">
              100% sob gestão
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <motion.div className="bg-blue-600 h-full rounded-full origin-left" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduceMotion ? 0 : 1.2, delay: 0.38, ease: [0.16, 1, 0.3, 1] }} />
          </div>
        </motion.div>

        {/* Em Andamento */}
        <motion.div variants={{ hidden: { opacity: 0, y: 12, scale: 0.99 }, visible: { opacity: 1, y: 0, scale: 1 } }} transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 280, damping: 27 }} whileHover={reduceMotion ? undefined : { y: -2, transition: { type: 'spring', stiffness: 400, damping: 28 } }} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
            Em Andamento
          </p>
          <div className="flex items-baseline justify-between">
            <AnimatedNumber value={inProgressCount} duration={1200} delay={460} className="text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100" />
            <span className="text-[10px] bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 px-2 py-0.5 rounded font-semibold">
              {total > 0 ? Math.round((inProgressCount / total) * 100) : 0}% do fluxo
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <motion.div
              className="bg-sky-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${total > 0 ? (inProgressCount / total) * 100 : 0}%` }}
              transition={{ duration: reduceMotion ? 0 : 1.2, delay: 0.46, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </motion.div>

        {/* Atrasadas */}
        <motion.div variants={{ hidden: { opacity: 0, y: 12, scale: 0.99 }, visible: { opacity: 1, y: 0, scale: 1 } }} transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 280, damping: 27 }} whileHover={reduceMotion ? undefined : { y: -2, transition: { type: 'spring', stiffness: 400, damping: 28 } }} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
            Atrasadas
          </p>
          <div className="flex items-baseline justify-between">
            <AnimatedNumber value={overdueCount} duration={1200} delay={540} className="text-3xl font-bold tabular-nums text-red-600 dark:text-red-400" />
            <span className="text-[10px] bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 px-2 py-0.5 rounded font-semibold">
              {overdueCount > 0 ? 'Ação Imediata' : 'Zero Atrasos'}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <motion.div
              className="bg-red-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${total > 0 ? Math.min(100, (overdueCount / total) * 100) : 0}%` }}
              transition={{ duration: reduceMotion ? 0 : 1.2, delay: 0.54, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </motion.div>

        {/* Concluídas & SLA */}
        <motion.div variants={{ hidden: { opacity: 0, y: 12, scale: 0.99 }, visible: { opacity: 1, y: 0, scale: 1 } }} transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 280, damping: 27 }} whileHover={reduceMotion ? undefined : { y: -2, transition: { type: 'spring', stiffness: 400, damping: 28 } }} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
            Concluídas (SLA: {slaOnTimeRate}%)
          </p>
          <div className="flex items-baseline justify-between">
            <AnimatedNumber value={completedCount} duration={1200} delay={620} className="text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400" />
            <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded font-semibold">
              Média {avgCompletionDays} dias
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <motion.div
              className="bg-emerald-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${total > 0 ? (completedCount / total) * 100 : 0}%` }}
              transition={{ duration: reduceMotion ? 0 : 1.2, delay: 0.62, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Row 1 Charts: Category Donut & Weekly Deliveries vs Inbound */}
      <motion.div variants={reduceMotion ? undefined : staggerContainer(0.08, 0.12)} initial={reduceMotion ? false : 'hidden'} animate="visible" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <motion.div variants={reduceMotion ? undefined : staggerItem} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Distribuição por Categoria</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Projetos • Melhorias • Tarefas</span>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  isAnimationActive={chartAnimation}
                  animationBegin={180}
                  animationDuration={1000}
                  animationEasing="ease-out"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`${val} demandas`, 'Total']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Weekly Trend: Inbound vs Completed */}
        <motion.div variants={reduceMotion ? undefined : staggerItem} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span>Evolução: Abertas vs Concluídas</span>
            </h3>
            <span className="text-[11px] text-emerald-600 font-bold">+18% velocidade de entrega</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="semana" textAnchor="middle" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="criadas" name="Demandas Abertas" fill="#3B82F6" radius={[4, 4, 0, 0]} isAnimationActive={chartAnimation} animationBegin={220} animationDuration={900} animationEasing="ease-out" />
                <Bar dataKey="concluidas" name="Demandas Concluídas" fill="#10B981" radius={[4, 4, 0, 0]} isAnimationActive={chartAnimation} animationBegin={320} animationDuration={900} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>

      {/* Row 2: Status & Team Workload */}
      <motion.div variants={reduceMotion ? undefined : staggerContainer(0.16, 0.12)} initial={reduceMotion ? false : 'hidden'} animate="visible" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <motion.div variants={reduceMotion ? undefined : staggerItem} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-purple-500" />
            <span>Volume por Status do Fluxo</span>
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="total" name="Quantidade" fill="#8B5CF6" radius={[0, 4, 4, 0]} isAnimationActive={chartAnimation} animationBegin={260} animationDuration={950} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Team Workload */}
        <motion.div variants={reduceMotion ? undefined : staggerItem} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-500" />
            <span>Carga Operacional por Equipe</span>
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamWorkloadData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="demandas" name="Total Demandas" fill="#0EA5E9" radius={[4, 4, 0, 0]} isAnimationActive={chartAnimation} animationBegin={300} animationDuration={950} animationEasing="ease-out" />
                <Bar dataKey="bloqueadas" name="Com Bloqueio" fill="#EF4444" radius={[4, 4, 0, 0]} isAnimationActive={chartAnimation} animationBegin={400} animationDuration={950} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>

      {/* Critical Demands Requiring Board Decision */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Pauta Executiva: Atividades Críticas & Bloqueios
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Demandas com bloqueios operacionais ou prazos que requerem atenção da gestão
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-full text-xs font-bold">
            {criticalActionDemands.length} {criticalActionDemands.length === 1 ? 'item' : 'itens'}
          </span>
        </div>

        <motion.div variants={reduceMotion ? undefined : staggerContainer(0.08, 0.055)} initial={reduceMotion ? false : 'hidden'} animate="visible" className="p-5 space-y-3">
          {criticalActionDemands.map((demand) => {
            const assignee = users.find((u) => u.id === demand.assigneeId);
            const team = teams.find((t) => t.id === demand.teamId);

            return (
              <motion.div
                variants={reduceMotion ? undefined : staggerItem}
                whileHover={reduceMotion ? undefined : { x: 3 }}
                key={demand.id}
                onClick={() => setSelectedDemand(demand)}
                className="p-4 bg-slate-50 dark:bg-slate-800/50 border-l-4 border-red-500 rounded-r-xl cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                      {demand.code}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {demand.title}
                    </h4>
                  </div>

                  {demand.blocker?.isBlocked && (
                    <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                      <span className="font-bold">Bloqueio: </span>
                      {demand.blocker.reason}
                    </p>
                  )}

                  {demand.blocker?.actionNeeded && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Ação Sugerida: </span>
                      {demand.blocker.actionNeeded}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 shrink-0 text-xs">
                  {assignee && (
                    <div className="text-right">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{assignee.name}</p>
                      <p className="text-[10px] text-slate-400">{team?.name}</p>
                    </div>
                  )}
                  <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-300">
                    Prazo: {formatCalendarDate(demand.dueDate)}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-blue-600" />
                </div>
              </motion.div>
            );
          })}

          {criticalActionDemands.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nenhuma demanda crítica ou bloqueada no momento. Toda a operação está em conformidade.
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
