/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SlaPolicy } from '../../types';
import {
  Clock,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Calendar,
  Layers,
  Edit2,
  Save,
  ArrowUpRight,
  TrendingUp,
  Award
} from 'lucide-react';

export const SlaManagementView: React.FC = () => {
  const {
    slaPolicies,
    updateSlaPolicy,
    priorities,
    demands,
    statuses,
    teams,
    showToast
  } = useApp();

  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [firstResponseHours, setFirstResponseHours] = useState<number>(2);
  const [resolutionHours, setResolutionHours] = useState<number>(16);

  const handleEdit = (policy: SlaPolicy) => {
    setEditingPolicyId(policy.id);
    setFirstResponseHours(policy.firstResponseHours);
    setResolutionHours(policy.resolutionHours);
  };

  const handleSave = (id: string) => {
    updateSlaPolicy(id, {
      firstResponseHours,
      resolutionHours
    });
    setEditingPolicyId(null);
    showToast({
      type: 'success',
      title: 'Política de SLA Atualizada',
      message: 'Limites de resposta e resolução gravados com sucesso.'
    });
  };

  // SLA Compliance Calculations
  const totalDemands = demands.length;
  const breachedDemands = demands.filter(
    (d) => d.sla?.isBreached || (new Date(d.dueDate).getTime() < Date.now() && d.progressPercent < 100)
  ).length;
  const complianceRate = totalDemands > 0 ? Math.round(((totalDemands - breachedDemands) / totalDemands) * 100) : 100;

  return (
    <div id="sla-management-view" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Gestão de SLA & Prazos Úteis
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Horário Útil 08h-18h (Seg-Sex)
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Matriz de tempos de resposta e resolução por criticidade, pausas automáticas em validação externa e escalonamento para diretoria.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-500 block">Índice Global de SLA</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              {complianceRate}%
              <span className={`text-xs font-semibold ${complianceRate >= 90 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {complianceRate >= 90 ? 'Excelente' : 'Atenção'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Demandas Dentro do SLA</span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
              {totalDemands - breachedDemands}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Demandas Estouradas / Risco</span>
            <span className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1 block">
              {breachedDemands}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Status que Pausam SLA</span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 block">
              {statuses.filter((s) => s.pausesSla).length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* SLA Policy Matrix Table */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Matriz de Políticas de SLA por Nível de Criticidade
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Política / Prioridade</th>
                <th className="py-3 px-3">1ª Resposta (Horas Úteis)</th>
                <th className="py-3 px-3">Resolução Final (Horas Úteis)</th>
                <th className="py-3 px-3">Janela Útil</th>
                <th className="py-3 px-3">Escalonamento Automático</th>
                <th className="py-3 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {slaPolicies.map((pol) => {
                const prio = priorities.find((p) => p.id === pol.priorityId);
                const isEditing = editingPolicyId === pol.id;

                return (
                  <tr key={pol.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: prio?.color || '#3b82f6' }}
                        />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">{pol.name}</span>
                          <span className="text-[11px] text-slate-400">Prioridade {prio?.name}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={firstResponseHours}
                          onChange={(e) => setFirstResponseHours(Number(e.target.value))}
                          className="w-20 px-2 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-xs"
                        />
                      ) : (
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {pol.firstResponseHours} horas
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={resolutionHours}
                          onChange={(e) => setResolutionHours(Number(e.target.value))}
                          className="w-20 px-2 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-xs"
                        />
                      ) : (
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {pol.resolutionHours} horas ({Math.round(pol.resolutionHours / 8)} dias úteis)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                      {pol.workingHoursStart}:00 às {pol.workingHoursEnd}:00 (Seg-Sex)
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        {(pol.escalationHierarchy && pol.escalationHierarchy.length > 0 ? pol.escalationHierarchy : ['Atendente', 'Líder Técnico', 'Gerência']).join(' → ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      {isEditing ? (
                        <button
                          onClick={() => handleSave(pol.id)}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 ml-auto"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Salvar</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEdit(pol)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
