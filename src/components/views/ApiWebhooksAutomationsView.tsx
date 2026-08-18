/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiKeyItem, WebhookSubscription } from '../../types';
import {
  Webhook,
  Key,
  Code2,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  Copy,
  Check,
  ShieldAlert,
  Send,
  Sparkles,
  Layers
} from 'lucide-react';

export const ApiWebhooksAutomationsView: React.FC = () => {
  const {
    apiKeys,
    createApiKey,
    revokeApiKey,
    webhooks,
    createWebhook,
    testWebhookDelivery,
    deleteWebhook,
    automations,
    toggleAutomationRule,
    demands,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'api_docs' | 'api_keys' | 'webhooks' | 'automations'>('api_docs');

  // Key creation state
  const [keyName, setKeyName] = useState<string>('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  // Webhook creation state
  const [webhookName, setWebhookName] = useState<string>('');
  const [webhookUrl, setWebhookUrl] = useState<string>('');

  // API Playground state
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('GET /api/v2/demands');
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [isCallingApi, setIsCallingApi] = useState<boolean>(false);

  const handleGenerateKey = () => {
    if (!keyName.trim()) return;
    const token = createApiKey({
      name: keyName,
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
      scopes: ['demands:read', 'demands:write', 'inbox:write'],
      rateLimitPerMinute: 120,
      active: true
    });
    setCreatedToken(token);
    setKeyName('');
  };

  const handleCreateWebhook = () => {
    if (!webhookName.trim() || !webhookUrl.trim()) return;
    createWebhook({
      name: webhookName,
      targetUrl: webhookUrl,
      subscribedEvents: ['demand.created', 'demand.status_changed', 'demand.completed'],
      active: true
    });
    setWebhookName('');
    setWebhookUrl('');
  };

  const handleRunPlayground = () => {
    setIsCallingApi(true);
    setTimeout(() => {
      setIsCallingApi(false);
      if (selectedEndpoint === 'GET /api/v2/demands') {
        setApiResponse(
          JSON.stringify(
            {
              status: 200,
              meta: { total: demands.length, version: 'v2.4.0', rateLimitRemaining: 119 },
              data: demands.slice(0, 3)
            },
            null,
            2
          )
        );
      } else {
        setApiResponse(
          JSON.stringify(
            {
              status: 201,
              message: 'Demanda criada com sucesso via API REST',
              code: 'DEM-2026-099',
              id: 'dem-api-test-01'
            },
            null,
            2
          )
        );
      }
    }, 400);
  };

  return (
    <div id="api-webhooks-view" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-inner">
            <Code2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                API REST, Webhooks & Automações
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                OpenAPI 3.1 & HMAC Webhooks
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Integre seus sistemas legados, ERPs, CRMs e scripts com chaves de API autenticadas e notificações em tempo real.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab('api_docs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'api_docs'
              ? 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Playground API REST</span>
        </button>
        <button
          onClick={() => setActiveTab('api_keys')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'api_keys'
              ? 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Chaves de API ({apiKeys.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'webhooks'
              ? 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Webhook className="w-4 h-4" />
          <span>Webhooks ({webhooks.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('automations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'automations'
              ? 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Regras de Automação ({automations.length})</span>
        </button>
      </div>

      {/* Tab 1: API REST Playground */}
      {activeTab === 'api_docs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Testador Interativo de Endpoints
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Selecione o Endpoint
                </label>
                <select
                  value={selectedEndpoint}
                  onChange={(e) => setSelectedEndpoint(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                >
                  <option value="GET /api/v2/demands">GET /api/v2/demands (Listar Demandas com Filtros)</option>
                  <option value="POST /api/v2/demands">POST /api/v2/demands (Criar Nova Demanda 5W2H)</option>
                  <option value="GET /api/v2/inbox">GET /api/v2/inbox (Listar Caixa de Entrada)</option>
                  <option value="POST /api/v2/inbox/submit">POST /api/v2/inbox/submit (Receber Solicitação Externa)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 space-y-1 font-mono text-[11px]">
                <div className="text-slate-500">Headers:</div>
                <div className="text-cyan-600 dark:text-cyan-400">Authorization: Bearer gd_live_••••••••••••••••</div>
                <div className="text-slate-600 dark:text-slate-300">Content-Type: application/json</div>
              </div>

              <button
                onClick={handleRunPlayground}
                disabled={isCallingApi}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>{isCallingApi ? 'Executando Requisição...' : 'Executar Chamada API'}</span>
              </button>
            </div>
          </div>

          {/* Response Box */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-3 font-mono text-xs text-slate-200 flex flex-col justify-between">
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider mb-2">
                Resposta JSON (HTTP 200 OK)
              </span>
              <pre className="overflow-x-auto max-h-72 text-emerald-400 text-[11px]">
                {apiResponse || '// Clique em "Executar Chamada API" para visualizar o payload retornado'}
              </pre>
            </div>
            <span className="text-[10px] text-slate-500">Latency: 28ms | Cache: MISS | RateLimit: 120 req/min</span>
          </div>
        </div>
      )}

      {/* Tab 2: API Keys */}
      {activeTab === 'api_keys' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Tokens de Autenticação para Sistemas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Chaves de longa duração com escopos granulares e controle de taxa de requisição.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Nome do sistema (Ex: SAP Integration)"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
              <button
                onClick={handleGenerateKey}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shrink-0"
              >
                + Gerar Nova Chave
              </button>
            </div>
          </div>

          {createdToken && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Chave Gerada com Sucesso! Copie agora, ela não será exibida novamente:</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg font-mono text-slate-900 dark:text-white">
                <span>{createdToken}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdToken);
                    showToast({ type: 'success', title: 'Copiado!', message: 'Token copiado com sucesso.' });
                  }}
                  className="p-1 hover:text-cyan-600"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {apiKeys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{k.name}</span>
                  <span className="font-mono text-slate-400 text-[11px]">{k.tokenPrefix}</span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-slate-500 font-mono">Limite: {k.rateLimitPerMinute} req/min</span>
                  <button
                    onClick={() => revokeApiKey(k.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Webhooks */}
      {activeTab === 'webhooks' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Assinaturas de Webhook</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Disparos HTTP POST com assinatura HMAC SHA-256 no header <code className="font-mono">X-Signature</code>.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <input
              type="text"
              placeholder="Nome (Ex: Zapier Sync)"
              value={webhookName}
              onChange={(e) => setWebhookName(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
            <input
              type="text"
              placeholder="URL de Destino (https://...)"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
            <button
              onClick={handleCreateWebhook}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              + Adicionar Webhook
            </button>
          </div>

          <div className="space-y-3">
            {webhooks.map((w) => (
              <div
                key={w.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{w.name}</span>
                  <button
                    onClick={() => deleteWebhook(w.id)}
                    className="text-red-500 hover:text-red-700 font-semibold"
                  >
                    Remover
                  </button>
                </div>

                <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all">
                  Endpoint: {w.targetUrl}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-400">Eventos: {(w.subscribedEvents || []).join(', ') || 'Nenhum'}</span>
                  <button
                    onClick={() => testWebhookDelivery(w.id)}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-bold hover:bg-cyan-600 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Testar Envio HTTP</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Automations */}
      {activeTab === 'automations' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Regras de Automação & Triggers
          </h3>

          <div className="space-y-3">
            {automations.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-xs"
              >
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white text-sm block">
                    {rule.name}
                  </span>
                  <p className="text-slate-500 dark:text-slate-400">{rule.description}</p>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-cyan-600 dark:text-cyan-400">
                    <span>Gatilho: {rule.triggerType}</span>
                    <span>→</span>
                    <span>Ação: {rule.actionType}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-400">{rule.executionCount} execuções</span>
                  <button
                    onClick={() => toggleAutomationRule(rule.id, !rule.active)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                      rule.active
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {rule.active ? 'Ativa' : 'Desativada'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
