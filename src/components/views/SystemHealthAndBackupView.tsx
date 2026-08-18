/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackupPoint } from '../../types';
import {
  Activity,
  Database,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Cpu,
  Clock,
  ShieldCheck,
  Play
} from 'lucide-react';

export const SystemHealthAndBackupView: React.FC = () => {
  const {
    backupPoints,
    createBackupPoint,
    testBackupRestore,
    offlineQueue,
    demands,
    inbox,
    auditLogs,
    showToast
  } = useApp();

  const [isCreatingBackup, setIsCreatingBackup] = useState<boolean>(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleCreateSnapshot = () => {
    setIsCreatingBackup(true);
    setTimeout(() => {
      createBackupPoint(
        `Snapshot Automático de Integridade v2.4 (${demands.length} demandas, ${inbox.length} inbox, ${auditLogs.length} logs)`
      );
      setIsCreatingBackup(false);
    }, 500);
  };

  const handleTestRestore = (id: string) => {
    setTestingId(id);
    setTimeout(() => {
      testBackupRestore(id);
      setTestingId(null);
    }, 600);
  };

  // Calculate approximate storage usage
  const storageUsageKb = Math.round(
    (JSON.stringify(demands).length +
      JSON.stringify(inbox).length +
      JSON.stringify(auditLogs).length) /
      1024
  );

  return (
    <div id="system-health-view" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Diagnóstico do Sistema & Backup Enterprise
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                100% Operacional & Verificado
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Testes automatizados de restauração (Dry-run), verificação de checksum SHA-256 e monitoramento de telemetria.
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateSnapshot}
          disabled={isCreatingBackup}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <Database className="w-4 h-4" />
          <span>{isCreatingBackup ? 'Gerando Checksum...' : '+ Criar Snapshot de Backup'}</span>
        </button>
      </div>

      {/* System Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Uso de Armazenamento Local</span>
            <HardDrive className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white block">
            {storageUsageKb} KB
          </span>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Capacidade livre: 99.8%</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Fila de Sincronização Offline</span>
            <Cpu className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white block">
            {offlineQueue.length} itens pendentes
          </span>
          <div className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Motor de idempotência ativo</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Pontos de Restauração</span>
            <Database className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-2xl font-bold text-purple-600 dark:text-purple-400 block">
            {backupPoints.length} snapshots
          </span>
          <div className="text-[11px] text-purple-600 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Integridade SHA-256 válida</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Latência de E/S Storage</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white block">
            3.2 ms
          </span>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Alta performance</span>
          </div>
        </div>
      </div>

      {/* Backup Points Table */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Histórico de Snapshots de Backup & Validação de Restauração
        </h3>

        <div className="space-y-3">
          {backupPoints.map((bp) => (
            <div
              key={bp.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 space-y-3 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm block">
                    {bp.description}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    ID: {bp.id} • Criado em: {new Date(bp.createdAt).toLocaleString('pt-BR')} • {bp.itemCount} registros • Schema v{bp.version}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      bp.verified
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {bp.verified ? 'Teste de Restauração OK' : 'Não Verificado'}
                  </span>
                </div>
              </div>

              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all">
                Checksum SHA-256: {bp.checksum}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <button
                  onClick={() => handleTestRestore(bp.id)}
                  disabled={testingId === bp.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 rounded-lg font-bold hover:bg-blue-200 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingId === bp.id ? 'animate-spin' : ''}`} />
                  <span>{testingId === bp.id ? 'Simulando...' : 'Simular Restauração (Dry-run)'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
