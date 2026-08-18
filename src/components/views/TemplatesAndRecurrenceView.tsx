/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DemandTemplate, RecurringRule } from '../../types';
import {
  Layers,
  Repeat,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit2,
  CheckSquare,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  Tag,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export const TemplatesAndRecurrenceView: React.FC = () => {
  const {
    templates,
    recurringRules,
    createTemplate,
    deleteTemplate,
    createRecurringRule,
    toggleRecurringRule,
    triggerRecurringGeneration,
    categories,
    priorities,
    teams,
    users,
    createDemand,
    showToast,
    setSelectedDemand
  } = useApp();

  const [activeTab, setActiveTab] = useState<'templates' | 'recurring'>('templates');
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState<boolean>(false);
  const [isNewRuleModalOpen, setIsNewRuleModalOpen] = useState<boolean>(false);

  // Template Form State
  const [tmplTitle, setTmplTitle] = useState<string>('');
  const [tmplDesc, setTmplDesc] = useState<string>('');
  const [tmplCategory, setTmplCategory] = useState<string>(categories[0]?.id || '');
  const [tmplPriority, setTmplPriority] = useState<string>(priorities[2]?.id || '');
  const [tmplTeam, setTmplTeam] = useState<string>(teams[0]?.id || '');
  const [tmplWhy, setTmplWhy] = useState<string>('');
  const [tmplHow, setTmplHow] = useState<string>('');
  const [tmplDays, setTmplDays] = useState<number>(7);
  const [tmplHours, setTmplHours] = useState<number>(16);

  // Recurrence Form State
  const [ruleTitle, setRuleTitle] = useState<string>('');
  const [ruleDesc, setRuleDesc] = useState<string>('');
  const [ruleFreq, setRuleFreq] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly');
  const [ruleDayOfMonth, setRuleDayOfMonth] = useState<number>(1);
  const [ruleCategory, setRuleCategory] = useState<string>(categories[0]?.id || '');
  const [rulePriority, setRulePriority] = useState<string>(priorities[2]?.id || '');
  const [ruleTeam, setRuleTeam] = useState<string>(teams[0]?.id || '');
  const [ruleAssignee, setRuleAssignee] = useState<string>(users[0]?.id || '');

  const handleCreateTemplate = () => {
    if (!tmplTitle.trim()) return;
    createTemplate({
      title: tmplTitle,
      description: tmplDesc,
      categoryId: tmplCategory,
      defaultPriorityId: tmplPriority,
      defaultTeamId: tmplTeam,
      defaultWhyReason: tmplWhy,
      defaultHowGuide: tmplHow,
      estimatedDurationDays: tmplDays,
      estimatedEffortHours: tmplHours,
      defaultChecklist: [
        'Checklist Inicial de Preparação',
        'Execução Técnica Conforme Procedimento',
        'Validação e Homologação Final'
      ],
      defaultTags: ['Modelo', 'Padronizado']
    });
    setIsNewTemplateModalOpen(false);
    setTmplTitle('');
    setTmplDesc('');
    setTmplWhy('');
  };

  const handleUseTemplate = async (template: DemandTemplate) => {
    const created = await createDemand({
      title: template.title,
      description: template.description,
      categoryId: template.categoryId,
      priorityId: template.defaultPriorityId,
      teamId: template.defaultTeamId,
      whyReason: template.defaultWhyReason,
      howExecutionGuide: template.defaultHowGuide,
      checklist: template.defaultChecklist.map((title, idx) => ({
        id: `chk-${Date.now()}-${idx}`,
        title,
        completed: false
      })),
      tags: template.defaultTags,
      financials: {
        estimatedHours: template.estimatedEffortHours,
        estimatedCost: template.estimatedCost || 0,
        approvedCost: template.estimatedCost || 0,
        realizedCost: 0,
        realizedHours: 0,
        costCenter: 'CC-Geral',
        financialImpact: 'Neutro',
        operationalImpact: 'Médio',
        regulatoryImpact: 'Neutro',
        strategicImpact: 'Operacional'
      }
    });

    setSelectedDemand(created);
    showToast({
      type: 'success',
      title: 'Demanda Gerada a partir do Modelo!',
      message: `[${created.code}] "${created.title}" criada.`
    });
  };

  const handleCreateRule = () => {
    if (!ruleTitle.trim()) return;
    createRecurringRule({
      title: ruleTitle,
      description: ruleDesc,
      frequency: ruleFreq,
      dayOfMonth: ruleDayOfMonth,
      categoryId: ruleCategory,
      priorityId: rulePriority,
      teamId: ruleTeam,
      assigneeId: ruleAssignee,
      active: true,
      isSuspended: false
    });
    setIsNewRuleModalOpen(false);
    setRuleTitle('');
    setRuleDesc('');
  };

  return (
    <div id="templates-and-recurrence-view" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
            <Repeat className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Modelos de Demanda & Automação Recorrente
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                {templates.length} Modelos | {recurringRules.length} Regras
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Padronize fluxos de trabalho com blueprints 5W2H e automatize rotinas periódicas sem risco de duplicações.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'templates' ? (
            <button
              onClick={() => setIsNewTemplateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Novo Modelo Blueprint</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerRecurringGeneration()}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <Play className="w-4 h-4" />
                <span>Gerar Recorrências Agora</span>
              </button>
              <button
                onClick={() => setIsNewRuleModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nova Regra Recorrente</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'templates'
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Biblioteca de Modelos (Templates)</span>
        </button>
        <button
          onClick={() => setActiveTab('recurring')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'recurring'
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Repeat className="w-4 h-4" />
          <span>Agendador de Recorrências</span>
        </button>
      </div>

      {/* Tab 1: Templates Library */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((tmpl) => {
            const cat = categories.find((c) => c.id === tmpl.categoryId);
            const prio = priorities.find((p) => p.id === tmpl.defaultPriorityId);
            const team = teams.find((t) => t.id === tmpl.defaultTeamId);

            return (
              <div
                key={tmpl.id}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2.5 py-0.5 rounded-lg text-xs font-bold"
                      style={{
                        backgroundColor: cat?.bgColor || '#e0e7ff',
                        color: cat?.textColor || '#3730a3'
                      }}
                    >
                      {cat?.name || 'Geral'}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {tmpl.estimatedDurationDays} dias
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{tmpl.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {tmpl.description}
                    </p>
                  </div>

                  {/* Checklist summary */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                      Checklist Padrão ({tmpl.defaultChecklist.length} etapas)
                    </span>
                    <ul className="text-slate-500 dark:text-slate-400 space-y-1 pl-4 list-disc text-[11px]">
                      {tmpl.defaultChecklist.slice(0, 3).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => deleteTemplate(tmpl.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleUseTemplate(tmpl)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    <span>Criar a partir deste Modelo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Recurring Rules */}
      {activeTab === 'recurring' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Motor de Geração Automática</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rotinas com chave de idempotência diária para evitar criação duplicada de tickets idênticos.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3">Regra Recorrente</th>
                  <th className="py-3 px-3">Frequência</th>
                  <th className="py-3 px-3">Equipe / Responsável</th>
                  <th className="py-3 px-3">Última Geração</th>
                  <th className="py-3 px-3">Total Gerado</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recurringRules.map((rule) => {
                  const team = teams.find((t) => t.id === rule.teamId);
                  const assignee = users.find((u) => u.id === rule.assigneeId);

                  return (
                    <tr key={rule.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 dark:text-white block">{rule.title}</span>
                        <span className="text-[11px] text-slate-400">{rule.description}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                          {rule.frequency.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">{team?.name}</span>
                        <span className="text-[11px] text-slate-400">{assignee?.name}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {rule.lastGeneratedAt ? new Date(rule.lastGeneratedAt).toLocaleDateString('pt-BR') : 'Ainda não executado'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {rule.generationCount}x
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rule.isSuspended
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {rule.isSuspended ? 'Pausada' : 'Ativa'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => toggleRecurringRule(rule.id, !rule.isSuspended)}
                          className={`p-1.5 rounded-lg text-xs font-semibold ${
                            rule.isSuspended
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-amber-600 hover:bg-amber-50'
                          }`}
                        >
                          {rule.isSuspended ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: New Template */}
      {isNewTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Novo Modelo de Demanda (Blueprint)
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Título do Modelo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Auditoria de Segurança Trimestral"
                  value={tmplTitle}
                  onChange={(e) => setTmplTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Descrição Geral
                </label>
                <textarea
                  rows={2}
                  value={tmplDesc}
                  onChange={(e) => setTmplDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Categoria
                  </label>
                  <select
                    value={tmplCategory}
                    onChange={(e) => setTmplCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Equipe Padrão
                  </label>
                  <select
                    value={tmplTeam}
                    onChange={(e) => setTmplTeam(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setIsNewTemplateModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTemplate}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs"
              >
                Salvar Modelo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Recurring Rule */}
      {isNewRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Nova Regra de Recorrência Automática
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Título da Atividade Periódica
                </label>
                <input
                  type="text"
                  placeholder="Ex: Backup e Teste de Restauração Mensal"
                  value={ruleTitle}
                  onChange={(e) => setRuleTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Frequência
                  </label>
                  <select
                    value={ruleFreq}
                    onChange={(e) => setRuleFreq(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="daily">Diária</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="custom">Customizada</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Responsável
                  </label>
                  <select
                    value={ruleAssignee}
                    onChange={(e) => setRuleAssignee(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setIsNewRuleModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateRule}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs"
              >
                Ativar Agendamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
