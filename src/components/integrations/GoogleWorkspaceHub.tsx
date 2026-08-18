/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GoogleService } from '../../services/googleService';
import { GoogleIntegrationService, AutomationRule } from '../../types';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Power,
  Zap,
  Sliders,
  FileSpreadsheet,
  Calendar,
  Mail,
  HardDrive,
  FileText,
  Presentation,
  Video,
  ListTodo,
  MessageSquare,
  BarChart3,
  Database,
  Play
} from 'lucide-react';

export const GoogleWorkspaceHub: React.FC = () => {
  const {
    googleServices,
    toggleGoogleService,
    automations,
    toggleAutomationRule,
    showToast,
    demands,
    users
  } = useApp();

  const [isTestingAutomationId, setIsTestingAutomationId] = useState<string | null>(null);

  const getServiceIcon = (key: string) => {
    switch (key) {
      case 'gmail': return <Mail className="w-5 h-5 text-red-500" />;
      case 'sheets': return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      case 'drive': return <HardDrive className="w-5 h-5 text-amber-500" />;
      case 'calendar': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'docs': return <FileText className="w-5 h-5 text-blue-600" />;
      case 'slides': return <Presentation className="w-5 h-5 text-yellow-500" />;
      case 'forms': return <FileText className="w-5 h-5 text-purple-500" />;
      case 'meet': return <Video className="w-5 h-5 text-emerald-600" />;
      case 'tasks': return <ListTodo className="w-5 h-5 text-blue-400" />;
      case 'chat': return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      case 'looker': return <BarChart3 className="w-5 h-5 text-cyan-500" />;
      default: return <Cloud className="w-5 h-5 text-blue-500" />;
    }
  };

  const handleTestAutomation = async (automation: AutomationRule) => {
    setIsTestingAutomationId(automation.id);
    try {
      const sampleDemand = demands[0];
      const assignee = users.find(u => u.id === sampleDemand?.assigneeId);
      const res = await GoogleService.runAutomationTrigger(
        automation.triggerEvent,
        sampleDemand,
        [automation],
        assignee
      );
      showToast({
        type: 'success',
        title: 'Automação Executada',
        message: `A regra "${automation.title}" foi acionada com sucesso.`
      });
    } catch (e) {
      showToast({
        type: 'error',
        title: 'Falha no Teste',
        message: 'Não foi possível executar a regra.'
      });
    } finally {
      setIsTestingAutomationId(null);
    }
  };

  const connectedCount = googleServices.filter((s) => s.connected).length;

  return (
    <div className="space-y-6 pb-8">
      {/* Ecosystem Header Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-blue-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-300 text-[10px] font-extrabold uppercase tracking-wider border border-blue-400/40">
              OAuth 2.0 & Cloud API Gateway
            </span>
            <span className="text-xs text-blue-200">
              {connectedCount} de {googleServices.length} serviços integrados
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white">
            Central de Integrações Google Workspace
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Conecte o aplicativo aos serviços do Google para sincronização automática de agenda, planilhas gerenciais, repositório de arquivos, atas executivas e disparo de alertas.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-200">Conta Corporativa</p>
            <p className="text-xs text-blue-300 font-mono">carlos.mendes@empresa.com.br</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-600/50 border border-blue-400 flex items-center justify-center text-white font-bold">
            G
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center space-x-2">
          <Cloud className="w-4 h-4 text-blue-600" />
          <span>Serviços Conectados ({connectedCount}/{googleServices.length})</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {googleServices.map((service) => (
            <div
              key={service.id}
              className={`bg-white dark:bg-slate-900 rounded-xl p-4 border transition-all flex flex-col justify-between shadow-xs ${
                service.connected
                  ? 'border-slate-200 dark:border-slate-800'
                  : 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50/50 dark:bg-slate-900/40'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                    {getServiceIcon(service.serviceKey)}
                  </div>
                  <button
                    onClick={() => toggleGoogleService(service.serviceKey, !service.connected)}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center space-x-1 transition-all ${
                      service.connected
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-red-100 hover:text-red-800'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{service.connected ? 'Conectado' : 'Conectar'}</span>
                  </button>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {service.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {service.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>{service.connected ? `Sincronizado: ${service.lastSync ? new Date(service.lastSync).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Agora'}` : 'Desconectado'}</span>
                {service.connected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Automation Rules */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Regras de Automação em Tempo Real
              </h3>
              <p className="text-xs text-slate-500">
                Triggers automáticos acionados durante a criação, transição de status ou conclusão de demandas
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {automations.map((automation) => (
            <div
              key={automation.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {automation.title}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {automation.triggerEvent}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {automation.description}
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => handleTestAutomation(automation)}
                  disabled={isTestingAutomationId === automation.id}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center space-x-1 transition-colors"
                >
                  <Play className="w-3 h-3 text-emerald-500" />
                  <span>{isTestingAutomationId === automation.id ? 'Testando...' : 'Testar Regra'}</span>
                </button>

                <button
                  onClick={() => toggleAutomationRule(automation.id, !automation.active)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    automation.active ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      automation.active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
