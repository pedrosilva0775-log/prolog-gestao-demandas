/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppSelect } from '../common/AppSelect';
import { useApp } from '../../context/AppContext';
import { ScheduledReportConfig } from '../../types';
import {
  FileSpreadsheet,
  Send,
  Calendar,
  Clock,
  Mail,
  FileText,
  CheckCircle2,
  Plus,
  Play,
  Layers,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const ScheduledReportsView: React.FC = () => {
  const { scheduledReports, triggerScheduledReportDispatch, createScheduledReport, showToast } = useApp();

  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [repTitle, setRepTitle] = useState<string>('');
  const [repDesc, setRepDesc] = useState<string>('');
  const [repFreq, setRepFreq] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [repRecipients, setRepRecipients] = useState<string>('diretoria@empresa.com.br, gestao@empresa.com.br');

  const handleCreate = () => {
    if (!repTitle.trim()) return;
    createScheduledReport({
      title: repTitle,
      description: repDesc,
      frequency: repFreq,
      dispatchHour: 8,
      recipients: repRecipients.split(',').map((e) => e.trim()),
      exportFormats: ['png', 'excel', 'google_sheets'],
      isConfidential: true,
      isAuthorizedForEmailDispatch: true,
      active: true
    });
    setIsNewModalOpen(false);
    setRepTitle('');
    setRepDesc('');
  };

  return (
    <div id="scheduled-reports-view" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Relatórios Executivos Programados
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                Disparos Automáticos
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Envio programado de resumos gerenciais consolidados via E-mail, Google Sheets, Google Slides, Excel e PNG.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Programar Novo Relatório</span>
        </button>
      </div>

      {/* List of Scheduled Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {scheduledReports.map((rep) => (
          <div
            key={rep.id}
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                  {rep.frequency.toUpperCase()} às {rep.dispatchHour}:00
                </span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ativo
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{rep.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{rep.description}</p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  <span>
                    <strong>Destinatários:</strong> {(rep.recipients || []).join(', ') || 'Nenhum'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    <strong>Formatos:</strong> {(rep.exportFormats || []).map((f) => f.toUpperCase()).join(', ') || '-'}
                  </span>
                </div>
              </div>

              {/* Dispatch history */}
              {rep.dispatchHistory && rep.dispatchHistory.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                    Último Disparo
                  </span>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Enviado em {new Date(rep.dispatchHistory[0].dispatchedAt).toLocaleString('pt-BR')} (Status: OK)
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">ID: {rep.id}</span>
              <button
                onClick={() => triggerScheduledReportDispatch(rep.id)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Disparar Agora</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: New Report */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Programar Envio de Relatório
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Título do Relatório
                </label>
                <input
                  type="text"
                  placeholder="Ex: Resumo Semanal de Demandas da Diretoria"
                  value={repTitle}
                  onChange={(e) => setRepTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Frequência
                </label>
                <AppSelect
                  value={repFreq}
                  onChange={(e) => setRepFreq(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="daily">Diário (Todo dia útil às 08:00)</option>
                  <option value="weekly">Semanal (Toda segunda-feira às 08:00)</option>
                  <option value="monthly">Mensal (1º dia útil do mês)</option>
                </AppSelect>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Destinatários (Separados por vírgula)
                </label>
                <input
                  type="text"
                  value={repRecipients}
                  onChange={(e) => setRepRecipients(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs"
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
