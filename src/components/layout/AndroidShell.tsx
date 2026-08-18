/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveView } from '../../types';
import {
  Wifi,
  BatteryCharging,
  Signal,
  LayoutGrid,
  ListOrdered,
  Calendar,
  PieChart,
  Plus,
  Bell,
  Search,
  SlidersHorizontal,
  Cloud,
  ChevronLeft,
  Smartphone,
  Monitor,
  Menu,
  X,
  FileSpreadsheet,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';

export const AndroidShell: React.FC<{
  children: React.ReactNode;
  onOpenCreateModal: () => void;
  onOpenNotifications: () => void;
}> = ({ children, onOpenCreateModal, onOpenNotifications }) => {
  const {
    activeView,
    setActiveView,
    deviceMode,
    setDeviceMode,
    unreadNotificationCount,
    filters,
    setFilters,
    currentUser,
    theme,
    setTheme
  } = useApp();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const bottomTabs = [
    { id: 'kanban' as ActiveView, label: 'Kanban', icon: LayoutGrid },
    { id: 'list' as ActiveView, label: 'Lista', icon: ListOrdered },
    { id: 'dashboard' as ActiveView, label: 'Painel', icon: PieChart },
    { id: 'executive_report' as ActiveView, label: 'Diretoria', icon: FileSpreadsheet },
    { id: 'calendar' as ActiveView, label: 'Agenda', icon: Calendar },
  ];

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch (e) {
        // Safe fallback
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-4 px-2 sm:px-6 flex flex-col items-center justify-center">
      {/* Top Banner to switch back to Web */}
      <div className="w-full max-w-md mb-2 flex items-center justify-between px-2 text-slate-400 text-xs">
        <span className="flex items-center space-x-1.5 font-medium text-slate-300">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>Simulador Android APK / PWA (Design System Mobile)</span>
        </span>
        <button
          onClick={() => setDeviceMode('web')}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-semibold flex items-center space-x-1 transition-colors"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Voltar para Web</span>
        </button>
      </div>

      {/* Android Device Frame */}
      <div className="w-full max-w-[420px] h-[850px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 relative flex flex-col overflow-hidden ring-1 ring-slate-700/50">
        {/* Screen Container */}
        <div className="w-full h-full bg-slate-50 dark:bg-slate-900 rounded-[34px] flex flex-col overflow-hidden relative">
          {/* Android Status Bar */}
          <div className="h-7 bg-slate-900 text-white px-5 flex items-center justify-between text-[11px] font-semibold shrink-0 z-40 select-none">
            <span>15:54</span>
            {/* Center Camera Punch hole */}
            <div className="w-4 h-4 rounded-full bg-black -mt-1 mx-auto" />
            <div className="flex items-center space-x-1.5 text-slate-300">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>

          {/* Android Top App Bar */}
          <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 flex items-center justify-between shrink-0 z-30">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  triggerHaptic();
                  setMobileDrawerOpen(true);
                }}
                className="p-2 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  GD
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  PROLOG
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  triggerHaptic();
                  onOpenNotifications();
                }}
                className="p-2 relative text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-blue-500 ml-1"
              />
            </div>
          </div>

          {/* Search Collapse */}
          {mobileSearchOpen && (
            <div className="p-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 duration-150">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  autoFocus
                />
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                {filters.search && (
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Main Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 pb-24 relative overscroll-contain scroll-smooth">
            {children}
          </div>

          {/* Floating Action Button (FAB) */}
          <button
            onClick={() => {
              triggerHaptic();
              onOpenCreateModal();
            }}
            className="absolute right-4 bottom-24 w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center active:scale-90 transition-transform z-30"
            id="fab-create-demand"
          >
            <Plus className="w-7 h-7" />
          </button>

          {/* Android Bottom Navigation Bar */}
          <div className="min-h-16 pb-[env(safe-area-inset-bottom)] bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 shrink-0 z-30">
            {bottomTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    triggerHaptic();
                    setActiveView(tab.id);
                  }}
                  className={`flex flex-col items-center justify-center min-w-14 min-h-12 py-1 rounded-xl transition-all active:scale-95 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                  <span className="text-[10px] mt-0.5">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Android Home Gesture Line */}
          <div className="h-3 bg-white dark:bg-slate-900 flex items-center justify-center pb-1 shrink-0">
            <div className="w-32 h-1 bg-slate-400 dark:bg-slate-600 rounded-full" />
          </div>

          {/* Mobile Drawer */}
          {mobileDrawerOpen && (
            <div className="absolute inset-0 z-50 flex">
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                onClick={() => setMobileDrawerOpen(false)}
              />
              <div className="relative w-4/5 max-w-[280px] bg-white dark:bg-slate-900 h-full shadow-2xl p-4 flex flex-col animate-in slide-in-from-left duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {currentUser.name}
                      </p>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase">
                        {currentUser.role}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="py-3 space-y-1 overflow-y-auto flex-1 text-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Navegação
                  </p>
                  {[
                    { id: 'kanban' as ActiveView, label: 'Quadro Kanban' },
                    { id: 'list' as ActiveView, label: 'Lista de Atividades' },
                    { id: 'dashboard' as ActiveView, label: 'Dashboard Executivo' },
                    { id: 'executive_report' as ActiveView, label: 'Relatório Diretoria' },
                    { id: 'calendar' as ActiveView, label: 'Calendário de Prazos' },
                    { id: 'timeline' as ActiveView, label: 'Linha do Tempo' },
                    { id: 'projects' as ActiveView, label: '👑 Projetos' },
                    { id: 'improvements' as ActiveView, label: '📓 Melhorias' },
                    { id: 'tasks' as ActiveView, label: '⚙️ Tarefas' },
                    { id: 'my_demands' as ActiveView, label: 'Minhas Demandas' },
                    { id: 'created_by_me' as ActiveView, label: 'Criadas por Mim' },
                    { id: 'google_integrations' as ActiveView, label: 'Central Google' },
                    { id: 'teams_management' as ActiveView, label: 'Equipes e Usuários' },
                    { id: 'categories_config' as ActiveView, label: 'Configurações' },
                    { id: 'audit_logs' as ActiveView, label: 'Registro de Auditoria' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        triggerHaptic();
                        setActiveView(m.id);
                        setMobileDrawerOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                        activeView === m.id
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Theme Selector in Android Drawer */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tema do Aplicativo
                  </p>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                      onClick={() => {
                        triggerHaptic();
                        setTheme('light');
                      }}
                      className={`flex items-center justify-center gap-1 py-1.5 rounded text-[11px] font-semibold transition-all ${
                        theme === 'light'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Sun className="w-3 h-3 text-amber-500" />
                      <span>Claro</span>
                    </button>
                    <button
                      onClick={() => {
                        triggerHaptic();
                        setTheme('dark');
                      }}
                      className={`flex items-center justify-center gap-1 py-1.5 rounded text-[11px] font-semibold transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-700 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-200'
                      }`}
                    >
                      <Moon className="w-3 h-3 text-blue-400" />
                      <span>Escuro</span>
                    </button>
                    <button
                      onClick={() => {
                        triggerHaptic();
                        setTheme('system');
                      }}
                      className={`flex items-center justify-center gap-1 py-1.5 rounded text-[11px] font-semibold transition-all ${
                        theme === 'system'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-200'
                      }`}
                    >
                      <Laptop className="w-3 h-3 text-slate-400" />
                      <span>Auto</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
