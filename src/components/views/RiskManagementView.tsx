/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppSelect } from '../common/AppSelect';
import { useApp } from '../../context/AppContext';
import { RiskItem } from '../../types';
import {
  AlertTriangle,
  Flame,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Users,
  Layers,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';

export const RiskManagementView: React.FC = () => {
  const { risks, createRisk, updateRisk, deleteRisk, users, demands, showToast } = useApp();

  const [isNewRiskModalOpen, setIsNewRiskModalOpen] = useState<boolean>(false);
  const [riskTitle, setRiskTitle] = useState<string>('');
  const [riskDesc, setRiskDesc] = useState<string>('');
  const [riskProb, setRiskProb] = useState<number>(3);
  const [riskImp, setRiskImp] = useState<number>(3);
  const [riskMitigation, setRiskMitigation] = useState<string>('');
  const [riskContingency, setRiskContingency] = useState<string>('');
  const [riskOwner, setRiskOwner] = useState<string>(users[0]?.id || '');
  const [riskDemand, setRiskDemand] = useState<string>(demands[0]?.id || '');

  const handleCreate = () => {
    if (!riskTitle.trim()) return;
    createRisk({
      title: riskTitle,
      description: riskDesc,
      probability: riskProb,
      impact: riskImp,
      mitigationPlan: riskMitigation || 'Monitoramento preventivo semanal.',
      contingencyPlan: riskContingency || 'Acionamento do comitê de crise.',
      ownerId: riskOwner,
      status: 'identified',
      demandId: riskDemand
    });

    setIsNewRiskModalOpen(false);
    setRiskTitle('');
    setRiskDesc('');
    setRiskMitigation('');
    setRiskContingency('');
  };

  const getSeverityBadge = (severity: number) => {
    if (severity >= 16) {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">Crítico ({severity}/25)</span>;
    } else if (severity >= 9) {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">Médio ({severity}/25)</span>;
    } else {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Baixo ({severity}/25)</span>;
    }
  };

  return (
    <div id="risk-management-view" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shadow-inner">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Gestão de Riscos & Matriz 5x5
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800">
                {risks.filter((r) => r.severity >= 15).length} Riscos Críticos
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Mapeamento de probabilidade x impacto, planos de mitigação preventiva e contingência executiva.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewRiskModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Mapear Novo Risco</span>
        </button>
      </div>

      {/* 5x5 Heatmap Matrix */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>Matriz de Severidade (Probabilidade x Impacto)</span>
          <span className="text-xs text-slate-400 font-normal">Escala 1 a 5</span>
        </h3>

        <div className="grid grid-cols-5 gap-2 max-w-2xl mx-auto py-2">
          {[5, 4, 3, 2, 1].map((prob) =>
            [1, 2, 3, 4, 5].map((imp) => {
              const cellSeverity = prob * imp;
              const matchingRisks = risks.filter((r) => r.probability === prob && r.impact === imp);

              return (
                <div
                  key={`${prob}-${imp}`}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                    cellSeverity >= 16
                      ? 'bg-red-100 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
                      : cellSeverity >= 9
                      ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                  }`}
                >
                  <span className="text-[10px] font-semibold opacity-70">P{prob} x I{imp}</span>
                  <span className="text-base font-bold">{matchingRisks.length}</span>
                  <span className="text-[9px] font-mono opacity-80">Sev {cellSeverity}</span>
                </div>
              );
            })
          )}
        </div>
        <div className="flex items-center justify-center gap-6 text-xs text-slate-500 pt-2">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            Baixo Risco (1-8)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            Médio Risco (9-15)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            Risco Crítico (16-25)
          </span>
        </div>
      </div>

      {/* Risks Table */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Registro Formal de Riscos & Planos de Contingência
        </h3>

        <div className="space-y-3">
          {risks.map((risk) => {
            const owner = users.find((u) => u.id === risk.ownerId);
            const demand = demands.find((d) => d.id === risk.demandId);

            return (
              <div
                key={risk.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(risk.severity)}
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{risk.title}</h4>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Responsável: <strong>{owner?.name || 'Não atribuído'}</strong>
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">{risk.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                      Plano de Mitigação Preventiva:
                    </span>
                    <span className="text-slate-700 dark:text-slate-200">{risk.mitigationPlan}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60">
                    <span className="font-bold text-red-800 dark:text-red-300 block mb-0.5">
                      Plano de Contingência:
                    </span>
                    <span className="text-slate-700 dark:text-slate-200">{risk.contingencyPlan}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs text-slate-400">
                  <span>Vinculado à demanda: <strong>{demand ? `[${demand.code}] ${demand.title}` : 'Geral'}</strong></span>
                  <button
                    onClick={() => deleteRisk(risk.id)}
                    className="text-red-500 hover:text-red-700 font-semibold"
                  >
                    Excluir Risco
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: New Risk */}
      {isNewRiskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Cadastrar Novo Risco no Portfólio
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Título do Risco
                </label>
                <input
                  type="text"
                  placeholder="Ex: Atraso na entrega de hardware pelo fornecedor externo"
                  value={riskTitle}
                  onChange={(e) => setRiskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Probabilidade (1 a 5)
                  </label>
                  <AppSelect
                    value={riskProb}
                    onChange={(e) => setRiskProb(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value={1}>1 - Muito Baixa</option>
                    <option value={2}>2 - Baixa</option>
                    <option value={3}>3 - Média</option>
                    <option value={4}>4 - Alta</option>
                    <option value={5}>5 - Muito Alta</option>
                  </AppSelect>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Impacto (1 a 5)
                  </label>
                  <AppSelect
                    value={riskImp}
                    onChange={(e) => setRiskImp(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value={1}>1 - Muito Baixo</option>
                    <option value={2}>2 - Baixo</option>
                    <option value={3}>3 - Moderado</option>
                    <option value={4}>4 - Alto</option>
                    <option value={5}>5 - Catastrófico</option>
                  </AppSelect>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Plano de Mitigação Preventiva
                </label>
                <input
                  type="text"
                  placeholder="Ações para reduzir a chance de ocorrência..."
                  value={riskMitigation}
                  onChange={(e) => setRiskMitigation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Plano de Contingência (Se o risco ocorrer)
                </label>
                <input
                  type="text"
                  placeholder="Ações imediatas para conter os danos..."
                  value={riskContingency}
                  onChange={(e) => setRiskContingency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setIsNewRiskModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs"
              >
                Salvar Risco
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
