/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExportService } from '../../services/exportService';
import {
  X,
  Download,
  FileSpreadsheet,
  Image as ImageIcon,
  CheckCircle2,
  Filter,
  UserCheck,
  Users,
  LayoutTemplate
} from 'lucide-react';

export const ExportModal: React.FC = () => {
  const {
    exportModalOpen,
    setExportModalOpen,
    demands,
    filteredDemands,
    statuses,
    priorities,
    categories,
    users,
    teams,
    currentUser,
    setActiveView,
    showToast
  } = useApp();

  const [isExporting, setIsExporting] = useState(false);
  const [includeOnlyFiltered, setIncludeOnlyFiltered] = useState(true);

  if (!exportModalOpen) return null;

  const datasetToExport = includeOnlyFiltered ? filteredDemands : demands;

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await ExportService.exportToExcel({
        demands: datasetToExport,
        statuses,
        priorities,
        categories,
        users,
        teams,
        currentUser,
        fileName: `Gestao_Demandas_Relatorio_${new Date().toISOString().slice(0, 10)}.xlsx`
      });
      showToast({
        type: 'success',
        title: 'Planilha Gerada com Sucesso',
        message: 'O arquivo Excel (.xlsx) profissional com 2 abas foi baixado.'
      });
      setExportModalOpen(false);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Falha na Exportação',
        message: 'Não foi possível gerar a planilha Excel.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleGoToVisualReport = () => {
    setExportModalOpen(false);
    setActiveView('executive_report');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Central de Exportação de Dados & Relatórios
            </h3>
          </div>
          <button
            onClick={() => setExportModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Selecione o formato de exportação desejado para compartilhar com sua equipe, diretoria ou comitês:
          </p>

          <label className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={includeOnlyFiltered}
              onChange={(e) => setIncludeOnlyFiltered(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Exportar apenas itens com base no filtro atual ({datasetToExport.length} demandas)
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Visual Report Option (Model Image) */}
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-300 font-bold">
                  <LayoutTemplate className="w-4 h-4 text-blue-600" />
                  <span>Relatório de Demandas (PNG/PDF)</span>
                </div>
                <p className="text-[11px] text-blue-950/80 dark:text-blue-300/80 mt-1">
                  Layout oficial com KPIs, tabela de Pendentes e Concluídas por usuário ou equipe.
                </p>
              </div>

              <button
                onClick={handleGoToVisualReport}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Visualizar e Exportar</span>
              </button>
            </div>

            {/* Excel Export Option */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-emerald-900 dark:text-emerald-300 font-bold">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Planilha Excel (.xlsx)</span>
                </div>
                <p className="text-[11px] text-emerald-950/80 dark:text-emerald-300/80 mt-1">
                  2 abas completas com cores corporativas: Resumo Executivo e Base 5W2H analítica.
                </p>
              </div>

              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Processando...' : 'Baixar Excel (.xlsx)'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setExportModalOpen(false)}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-300"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
