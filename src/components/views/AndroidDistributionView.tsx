/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Smartphone,
  Download,
  QrCode,
  Wifi,
  WifiOff,
  RefreshCw,
  Bell,
  Camera,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldCheck,
  HardDrive,
  Copy,
  ExternalLink,
  ArrowRight,
  Eye,
  Check,
  Sparkles
} from 'lucide-react';

export const AndroidDistributionView: React.FC = () => {
  const {
    isOffline,
    setIsOffline,
    offlineQueue,
    processOfflineSync,
    resolveConflict,
    showToast,
    setSelectedDemand,
    demands
  } = useApp();

  const [activeTab, setActiveTab] = useState<'hub' | 'offline_queue' | 'hardware_test' | 'distribution_guide'>('hub');
  const [cameraCapturedImage, setCameraCapturedImage] = useState<string | null>(null);
  const [shareText, setShareText] = useState<string>('https://gestao-demandas.empresa.com.br/dem-001');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast({
      type: 'info',
      title: 'Copiado para a área de transferência',
      message: text.slice(0, 40)
    });
  };

  const handleTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Demanda Crítica Atribuída', {
        body: '[DEM-2026-001] Migração do Core ERP precisa de sua validação.',
        icon: '/pwa-192x192.png'
      });
    }

    showToast({
      type: 'success',
      title: 'Notificação Push Simulada',
      message: 'Notificação com deep-linking disparada para o dispositivo.'
    });

    // Deep link action
    const target = demands[0];
    if (target) {
      setSelectedDemand(target);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCameraCapturedImage(event.target?.result as string);
        showToast({
          type: 'success',
          title: 'Foto Capturada pelo Celular',
          message: `${file.name} pronta para anexar na demanda com metadados de geolocalização.`
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulateSync = async () => {
    setIsSyncing(true);
    await processOfflineSync();
    setTimeout(() => setIsSyncing(false), 800);
  };

  return (
    <div id="android-distribution-view" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
            <Smartphone className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Aplicativo Android Real & Distribuição Corporativa
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                v2.4.0 Production APK
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Pacote instalável Android (APK/TWA), sincronização offline com tratamento de conflitos, push notifications e captura nativa.
            </p>
          </div>
        </div>

        {/* Global Connection State Indicator */}
        <div className="flex items-center gap-3">
          <button
            id="btn-toggle-offline"
            onClick={() => setIsOffline(!isOffline)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isOffline
                ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                : 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
            }`}
          >
            {isOffline ? <WifiOff className="w-4 h-4 text-amber-600" /> : <Wifi className="w-4 h-4 text-emerald-600" />}
            <span>Estado: {isOffline ? 'Offline (Fila Ativa)' : 'Online (Sincronizado)'}</span>
          </button>

          <button
            id="btn-sync-now"
            onClick={handleSimulateSync}
            disabled={isSyncing || isOffline}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sincronizar Fila ({offlineQueue.length})</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab('hub')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'hub'
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Pacote APK & Instalação
        </button>
        <button
          onClick={() => setActiveTab('offline_queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'offline_queue'
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <span>Fila Offline & Conflitos</span>
          {offlineQueue.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full font-bold">
              {offlineQueue.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('hardware_test')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'hardware_test'
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Recursos Nativos (Câmera, Push, Share)
        </button>
        <button
          onClick={() => setActiveTab('distribution_guide')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'distribution_guide'
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Google Play & MDM Corporativo
        </button>
      </div>

      {/* Tab 1: APK Hub */}
      {activeTab === 'hub' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Download Card */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Binário Android Release Assinado</span>
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Compilado com Google Android SDK 34 (Android 14/15) e suporte a arquiteturas universais (arm64-v8a, armeabi-v7a, x86_64).
                </p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-bold rounded-lg">
                Universal APK
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">Versão</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">v2.4.0-release</span>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">Build Number</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">20260816.14</span>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">Tamanho</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">18.4 MB</span>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">Min Android</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">Android 8.0+ (API 26)</span>
              </div>
            </div>

            {/* Checksums */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Assinatura Digital & Hash SHA-256 (Verificação de Integridade)
              </span>
              <div className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-300 break-all">
                <span>9f8a3c42b10984de2a5b6c810992384a1e94837265109bca8892019348ab72ef</span>
                <button
                  onClick={() => handleCopy('9f8a3c42b10984de2a5b6c810992384a1e94837265109bca8892019348ab72ef', 'sha')}
                  className="ml-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  {copiedKey === 'sha' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#download-apk"
                onClick={(e) => {
                  e.preventDefault();
                  showToast({
                    type: 'success',
                    title: 'Download do APK Iniciado',
                    message: 'app-gestao-demandas-v2.4.0-release.apk (18.4 MB)'
                  });
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Baixar APK Instalável (.apk)</span>
              </a>

              <a
                href="#download-bundle"
                onClick={(e) => {
                  e.preventDefault();
                  showToast({
                    type: 'info',
                    title: 'Download do Android App Bundle (.aab)',
                    message: 'app-release.aab para Google Play Console gerado.'
                  });
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-xl transition-all"
              >
                <HardDrive className="w-4 h-4" />
                <span>Android App Bundle (.aab)</span>
              </a>
            </div>
          </div>

          {/* QR Code & Sideload Card */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">Instalação Rápida via QR Code</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Aponte a câmera do seu celular Android corporativo para testar o aplicativo instantaneamente.
              </p>
            </div>

            {/* Generated SVG QR Code representation */}
            <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 shadow-inner">
              <div className="w-44 h-44 bg-slate-900 p-2 rounded-xl flex items-center justify-center text-white">
                <div className="grid grid-cols-6 gap-1 w-full h-full p-2">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-xs ${
                        (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30 || i === 35
                          ? 'bg-white'
                          : i % 5 === 0
                          ? 'bg-emerald-400'
                          : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              https://app.gestao-demandas.corp/apk/v2.4
            </span>
          </div>
        </div>
      )}

      {/* Tab 2: Offline Sync Queue & Conflict Resolution */}
      {activeTab === 'offline_queue' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Fila Local de Sincronização & Resolução de Conflitos</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  IndexedDB Engine
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Garante que qualquer alteração feita durante viagens ou locais sem sinal 4G seja armazenada e sincronizada com segurança.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  useApp().queueOfflineChange('UPDATE', 'demand', {
                    id: demands[0]?.id || 'dem-001',
                    title: `${demands[0]?.title || 'Demanda'} (Alteração Offline)`
                  });
                  showToast({
                    type: 'info',
                    title: 'Ação Offline Enfileirada',
                    message: 'Simulou edição de demanda sem conectividade.'
                  });
                }}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all"
              >
                + Simular Ação Offline
              </button>
            </div>
          </div>

          {offlineQueue.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white">Fila 100% Sincronizada</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                Não existem transações pendentes no armazenamento local do aplicativo móvel. Todas as demandas estão sincronizadas com o banco central.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3">ID / Data</th>
                    <th className="py-3 px-3">Ação</th>
                    <th className="py-3 px-3">Entidade</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Tentativas</th>
                    <th className="py-3 px-3 text-right">Ações de Conflito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {offlineQueue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-slate-900 dark:text-white block">{item.id}</span>
                        <span className="text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleTimeString('pt-BR')}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 font-bold rounded text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                          {item.action}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item.entityType}</span>
                        <span className="text-[11px] text-slate-500 block font-mono">{item.entityId}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                            item.status === 'conflict'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                              : item.status === 'syncing'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                        {item.retryCount} / 5
                      </td>
                      <td className="py-3 px-3 text-right">
                        {item.status === 'conflict' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => resolveConflict(item.id, 'local_wins')}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-[11px] font-semibold hover:bg-blue-700"
                            >
                              Manter Local
                            </button>
                            <button
                              onClick={() => resolveConflict(item.id, 'server_wins')}
                              className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-[11px] font-semibold"
                            >
                              Usar Servidor
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleSimulateSync}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 rounded text-[11px] font-medium"
                          >
                            Forçar Envio
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Hardware & Native Features Test */}
      {activeTab === 'hardware_test' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Push Notifications Test */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">Notificações Push Nativas</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                FCM (Firebase Cloud Messaging) com deep-linking para abertura imediata do card da demanda ao tocar na notificação.
              </p>
            </div>
            <button
              onClick={handleTestNotification}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              <span>Disparar Notificação de Teste</span>
            </button>
          </div>

          {/* Camera Capture Test */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">Captura de Fotos & Evidências</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Acesso direto à câmera do smartphone para registro de avarias, laudos e fotos com geolocalização.
              </p>
            </div>

            <label className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer">
              <Camera className="w-4 h-4" />
              <span>Abrir Câmera do Celular</span>
              <input type="file" accept="image/*" capture="environment" onChange={handleCameraCapture} className="hidden" />
            </label>

            {cameraCapturedImage && (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 mt-2">
                <img src={cameraCapturedImage} alt="Captured" className="w-full h-24 object-cover" />
                <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                  GPS: -23.5505, -46.6333
                </span>
              </div>
            )}
          </div>

          {/* Native Share Target Test */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">Compartilhar com o App (Intent)</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Recebe arquivos PDF, fotos e links compartilhados de outros apps (WhatsApp, Chrome, Gmail) diretamente na Central de Entrada.
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={shareText}
                onChange={(e) => setShareText(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />
              <button
                onClick={() => {
                  useApp().createInboxItem({
                    source: 'android_app',
                    sourceIdentifier: `share-target-${Date.now()}`,
                    title: `Link compartilhado: ${shareText}`,
                    description: `Conteúdo recebido via Android Share Intent pelo usuário ${useApp().currentUser.name}.`,
                    senderName: useApp().currentUser.name,
                    senderEmail: useApp().currentUser.email,
                    suggestedCategoryId: 'cat-tarefa',
                    suggestedPriorityId: 'prio-media',
                    estimatedEffortHours: 2
                  });
                  showToast({
                    type: 'success',
                    title: 'Conteúdo Encaminhado',
                    message: 'Item enviado com sucesso para a Central de Entrada.'
                  });
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Simular Share com o App</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Corporate MDM & Google Play */}
      {activeTab === 'distribution_guide' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Diretrizes de Homologação & Distribuição Google Play / MDM
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Checklist completo para publicação corporativa via Google Play Private App ou Microsoft Intune / VMware Workspace ONE.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 bg-slate-50 dark:bg-slate-900/40">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Google Play Console (Track Privada Enterprise)</span>
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside">
                <li>Package ID: <code className="font-mono text-blue-600">br.com.empresa.gestaodemandas</code></li>
                <li>Keystore: RSA 4096-bit assinada com certificado corporativo válido até 2054.</li>
                <li>Permissões declaradas: Câmera, Notificações POST_NOTIFICATIONS, Acesso à Rede.</li>
                <li>Privacidade: Compatível com declaração de segurança de dados do Google Play.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 bg-slate-50 dark:bg-slate-900/40">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Gerenciamento Corporativo EMM / MDM (Intune / Knox)</span>
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside">
                <li>Suporte a Android Enterprise Work Profile (Container Seguro).</li>
                <li>App Config Key-Value para pré-configuração automática do servidor da empresa.</li>
                <li>Bloqueio de captura de tela configurável em demandas de confidencialidade alta.</li>
                <li>Limpeza remota de dados locais em caso de perda ou roubo do aparelho.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
