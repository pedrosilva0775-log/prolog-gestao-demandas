/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Bell,
  CheckCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  User,
  Filter
} from 'lucide-react';
import { Demand } from '../../types';

export const NotificationDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    demands,
    statuses,
    users,
    setSelectedDemand,
    setFilters,
    setActiveView
  } = useApp();

  const [tab, setTab] = useState<'alerts' | 'notifications'>('alerts');

  if (!isOpen) return null;

  const now = new Date();

  // Overdue demands
  const overdueDemands = demands.filter((d) => {
    const status = statuses.find((s) => s.id === d.statusId);
    const isCompleted = status?.category === 'completed';
    const isCancelled = status?.category === 'cancelled';
    return !isCompleted && !isCancelled && new Date(d.dueDate) < now;
  });

  // Blocked demands
  const blockedDemands = demands.filter((d) => d.blocker?.isBlocked);

  const totalAlertsCount = overdueDemands.length + blockedDemands.length;
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notif: any) => {
    markNotificationAsRead(notif.id);
    if (notif.demandId) {
      const found = demands.find((d) => d.id === notif.demandId);
      if (found) {
        setSelectedDemand(found);
        onClose();
      }
    }
  };

  const handleDemandClick = (demand: Demand) => {
    setSelectedDemand(demand);
    onClose();
  };

  const handleViewAllOverdue = () => {
    setFilters((prev) => ({ ...prev, onlyOverdue: true, onlyBlocked: false }));
    setActiveView('kanban');
    onClose();
  };

  const handleViewAllBlocked = () => {
    setFilters((prev) => ({ ...prev, onlyBlocked: true, onlyOverdue: false }));
    setActiveView('kanban');
    onClose();
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <Clock className="w-4 h-4 text-red-500" />;
      case 'blocked':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Central de Alertas & Notificações
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Avisos operacionais, prazos e impedimentos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Fechar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 p-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 gap-1">
          <button
            onClick={() => setTab('alerts')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              tab === 'alerts'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Alertas Críticos</span>
            {totalAlertsCount > 0 && (
              <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {totalAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab('notifications')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              tab === 'notifications'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-blue-500" />
            <span>Notificações</span>
            {unreadNotifsCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {unreadNotifsCount}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {tab === 'alerts' ? (
            <div className="space-y-4">
              {/* Overdue Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Fora do Prazo ({overdueDemands.length})
                    </span>
                  </div>
                  {overdueDemands.length > 0 && (
                    <button
                      onClick={handleViewAllOverdue}
                      className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                    >
                      Filtrar no Kanban
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {overdueDemands.length > 0 ? (
                  <div className="space-y-2">
                    {overdueDemands.map((demand) => {
                      const assignee = users.find((u) => u.id === demand.assigneeId);
                      const due = new Date(demand.dueDate);
                      const diffDays = Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

                      return (
                        <div
                          key={demand.id}
                          onClick={() => handleDemandClick(demand)}
                          className="p-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition-all space-y-1.5 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                              {demand.code}
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300">
                              {diffDays === 1 ? '1 dia de atraso' : `${diffDays} dias de atraso`}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-1">
                            {demand.title}
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-red-100 dark:border-red-900/40">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {assignee?.name || 'Não atribuído'}
                            </span>
                            <span>Prazo: {due.toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500">
                    Nenhuma demanda com prazo vencido. Excelente!
                  </div>
                )}
              </div>

              {/* Blocked Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Com Impedimentos / Bloqueios ({blockedDemands.length})
                    </span>
                  </div>
                  {blockedDemands.length > 0 && (
                    <button
                      onClick={handleViewAllBlocked}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                    >
                      Filtrar no Kanban
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {blockedDemands.length > 0 ? (
                  <div className="space-y-2">
                    {blockedDemands.map((demand) => {
                      const assignee = users.find((u) => u.id === demand.assigneeId);

                      return (
                        <div
                          key={demand.id}
                          onClick={() => handleDemandClick(demand)}
                          className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer transition-all space-y-1.5 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                              {demand.code}
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                              Impacto {demand.blocker?.impact || 'Alto'}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                            {demand.title}
                          </p>

                          {demand.blocker?.reason && (
                            <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-950/50 p-1.5 rounded-lg line-clamp-2">
                              <strong>Motivo:</strong> {demand.blocker.reason}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-amber-100 dark:border-amber-900/40">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {assignee?.name || 'Não atribuído'}
                            </span>
                            <span className="text-amber-600 dark:text-amber-400 font-bold">Ver Resolução →</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500">
                    Nenhum impedimento ativo no fluxo de trabalho.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* System Notifications Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-semibold">
                  {unreadNotifsCount} não lida(s)
                </span>
                {unreadNotifsCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center space-x-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Marcar todas como lidas</span>
                  </button>
                )}
              </div>

              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex space-x-3 text-xs ${
                    notif.read
                      ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 opacity-75'
                      : 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 shadow-xs'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-xs shrink-0 self-start">
                    {getNotifIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 ml-1" />
                      )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono pt-1">
                      {new Date(notif.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Nenhuma notificação no momento.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
