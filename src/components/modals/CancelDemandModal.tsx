/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Demand } from '../../types';
import { formatCalendarDate } from '../../utils/date';
import { useApp } from '../../context/AppContext';
import {
  X,
  XCircle,
  AlertTriangle,
  FileText,
  Ban,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

interface CancelDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  demand: Demand | null;
}

const COMMON_CANCEL_REASONS = [
  'Substituída por outro projeto / escopo',
  'Decisão estratégica da Diretoria',
  'Inviabilidade técnica ou orçamentária',
  'Mudança de prioridade do cliente / solicitante',
  'Duplicidade com outra demanda já existente',
  'Fornecedor / terceiro descontinuou o serviço',
  'Outro motivo operacional'
];

export const CancelDemandModal: React.FC<CancelDemandModalProps> = ({
  isOpen,
  onClose,
  demand
}) => {
  const { statuses, updateDemand, showToast, currentUser } = useApp();

  const [selectedPresetReason, setSelectedPresetReason] = useState(COMMON_CANCEL_REASONS[0]);
  const [detailedJustification, setDetailedJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !demand) return null;

  const handleCancelDemand = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!detailedJustification.trim() && selectedPresetReason === 'Outro motivo operacional') {
      showToast({
        type: 'warning',
        title: 'Justificativa Obrigatória',
        message: 'Por favor, detalhe o motivo do cancelamento da demanda.'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const cancelledStatus = statuses.find(s => s.category === 'cancelled') || statuses.find(s => s.id === 'status-cancelada') || statuses[statuses.length - 1];
      const fullReason = `${selectedPresetReason}${detailedJustification.trim() ? `: ${detailedJustification.trim()}` : ''}`;

      await updateDemand(
        demand.id,
        {
          statusId: cancelledStatus.id,
          updatedAt: new Date().toISOString(),
          updatedByUserId: currentUser.id
        },
        `Cancelamento de demanda: ${fullReason}`
      );

      showToast({
        type: 'warning',
        title: 'Demanda Cancelada',
        message: `A demanda [${demand.code}] foi cancelada e movida para o status "${cancelledStatus.name}".`
      });

      onClose();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao Cancelar',
        message: 'Não foi possível cancelar a demanda no momento.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div data-modal-overlay="true" data-modal-decision="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-red-200 dark:border-red-900/60 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-red-50/60 dark:bg-red-950/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Cancelar Demanda</span>
                <span className="font-mono text-xs px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold">
                  {demand.code}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Esta ação moverá a tarefa para a esteira de canceladas e registrará no log de auditoria
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCancelDemand} className="p-4 sm:p-6 space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
              {demand.title}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Responsável: {demand.assigneeId ? 'Atribuído' : 'Não atribuído'} • Prazo atual: {formatCalendarDate(demand.dueDate)}
            </p>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Motivo Principal do Cancelamento <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {COMMON_CANCEL_REASONS.map((reason) => (
                <label
                  key={reason}
                  onClick={() => setSelectedPresetReason(reason)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedPresetReason === reason
                      ? 'border-red-500 bg-red-50/70 dark:bg-red-950/40 text-red-900 dark:text-red-200 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    checked={selectedPresetReason === reason}
                    onChange={() => setSelectedPresetReason(reason)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Detailed Justification */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Justificativa Detalhada & Parecer de Governança
            </label>
            <textarea
              rows={3}
              placeholder="Explique o contexto da decisão para fins de auditoria e prestação de contas..."
              value={detailedJustification}
              onChange={(e) => setDetailedJustification(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500 outline-none transition-all"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Voltar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-md shadow-red-500/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>Confirmar Cancelamento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
