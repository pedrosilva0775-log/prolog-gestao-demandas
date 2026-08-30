/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { isCalendarDateOverdue } from '../../utils/date';
import { Demand } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import { UserAvatar } from '../common/UserAvatar';
import { ProfileSettingsModal } from '../modals/ProfileSettingsModal';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { dropdownVariants } from '../motion/presets';
import { MotionButton } from '../motion/MotionButton';
import {
  Search,
  Plus,
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Menu,
  PanelLeft,
  X,
  ChevronRight,
  Layers,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Zap,
  CornerDownLeft,
  LogOut
  ,UserCog
} from 'lucide-react';

export const Header: React.FC<{
  onOpenNotifications: () => void;
  onOpenCreateModal: () => void;
}> = ({ onOpenNotifications, onOpenCreateModal }) => {
  const reduceMotion = useReducedMotion();
  const {
    currentUser,
    users,
    filters,
    setFilters,
    unreadNotificationCount,
    demands,
    statuses,
    priorities,
    categories,
    teams,
    setSelectedDemand,
    setActiveView,
    resetAllData,
    toggleSidebar,
    createDemand,
    showToast,
    hasPermission
  } = useApp();

  const canCreateDemands = hasPermission('demands', 'create');

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quick Add State
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [quickAddSuccess, setQuickAddSuccess] = useState(false);
  const quickAddInputRef = useRef<HTMLInputElement>(null);

  // Sync external filter changes
  useEffect(() => {
    setSearchQuery(filters.search);
  }, [filters.search]);

  // Global Keyboard Shortcut: Ctrl+K or Cmd+K or "/" to focus search, "q" or "n" when not in input to focus quick add
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputActive =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (e.key === '/' && !isInputActive) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (e.key.toLowerCase() === 'q' && !isInputActive && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        quickAddInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (isSearchFocused) {
          setIsSearchFocused(false);
          inputRef.current?.blur();
        }
        if (document.activeElement === quickAddInputRef.current) {
          setQuickAddTitle('');
          quickAddInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchFocused]);

  // Handle Quick Add submit
  const handleQuickAddSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const title = quickAddTitle.trim();
    if (!title || isQuickAdding) return;

    try {
      setIsQuickAdding(true);
      const created = await createDemand({
        title,
        description: `Criada rapidamente via barra superior por ${currentUser.name}.`,
        requesterId: currentUser.id,
        assigneeId: currentUser.id,
        statusId: statuses[0]?.id,
        priorityId: priorities[2]?.id || priorities[0]?.id,
        categoryId: categories[0]?.id,
        teamId: currentUser.teamId || teams[0]?.id,
        dueDate: new Date(Date.now() + 3 * 86400000).toISOString()
      });

      setQuickAddTitle('');
      setQuickAddSuccess(true);
      setTimeout(() => setQuickAddSuccess(false), 2200);

      // Feedback animation and optional selection
      if (created) {
        // Keep focus ready for another quick add or let user continue
      }
    } catch {
      showToast({type:'error',title:'Demanda não criada',message:'Não foi possível registrar a demanda rápida. Tente novamente.'});
    } finally {
      setIsQuickAdding(false);
    }
  };

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSearchFocused(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Compute live search matches across title, code, description, whyReason, whereLocation, tags, assignee
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return demands.filter((demand) => {
      const assignee = users.find((u) => u.id === demand.assigneeId)?.name.toLowerCase() || '';
      const requester = users.find((u) => u.id === demand.requesterId)?.name.toLowerCase() || '';
      const category = categories.find((c) => c.id === demand.categoryId)?.name.toLowerCase() || '';
      const team = teams.find((t) => t.id === demand.teamId)?.name.toLowerCase() || '';
      const status = statuses.find((s) => s.id === demand.statusId)?.name.toLowerCase() || '';
      const priority = priorities.find((p) => p.id === demand.priorityId)?.name.toLowerCase() || '';

      return (
        demand.code.toLowerCase().includes(query) ||
        demand.title.toLowerCase().includes(query) ||
        demand.description.toLowerCase().includes(query) ||
        (demand.whyReason && demand.whyReason.toLowerCase().includes(query)) ||
        (demand.whereLocation && demand.whereLocation.toLowerCase().includes(query)) ||
        (demand.howExecutionGuide && demand.howExecutionGuide.toLowerCase().includes(query)) ||
        demand.tags.some((t) => t.toLowerCase().includes(query)) ||
        assignee.includes(query) ||
        requester.includes(query) ||
        category.includes(query) ||
        team.includes(query) ||
        status.includes(query) ||
        priority.includes(query)
      );
    });
  }, [demands, searchQuery, users, categories, teams, statuses, priorities]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilters((prev) => ({ ...prev, search: '' }));
    inputRef.current?.focus();
  };

  const handleSelectResult = (demand: Demand) => {
    setSelectedDemand(demand);
    setIsSearchFocused(false);
  };

  const handleViewAllInKanban = () => {
    setFilters((prev) => ({ ...prev, search: searchQuery }));
    setActiveView('kanban');
    setIsSearchFocused(false);
  };

  const handleViewAllInList = () => {
    setFilters((prev) => ({ ...prev, search: searchQuery }));
    setActiveView('list');
    setIsSearchFocused(false);
  };

  const now = new Date();
  const overdueCount = demands.filter((d) => {
    const isCompleted = statuses.find((s) => s.id === d.statusId)?.category === 'completed';
    const isCancelled = statuses.find((s) => s.id === d.statusId)?.category === 'cancelled';
    return !isCompleted && !isCancelled && isCalendarDateOverdue(d.dueDate, now);
  }).length;

  const blockedCount = demands.filter((d) => d.blocker?.isBlocked).length;
  const criticalAlertsCount = overdueCount + blockedCount;
  const totalNotificationsAndAlerts = unreadNotificationCount + criticalAlertsCount;

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors font-sans gap-3">
      {/* Left: Clean Sidebar Toggle + Global Search Bar + Quick Add Input */}
      <div className="flex items-center gap-2.5 flex-1 max-w-2xl min-w-0">
        {/* Sleek Minimal Menu Toggle */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-colors flex items-center justify-center shrink-0"
          title="Alternar Menu Lateral"
          id="btn-sidebar-toggle"
          aria-label="Alternar menu lateral"
        >
          <PanelLeft className="w-4 h-4 hidden lg:block" />
          <Menu className="w-4 h-4 lg:hidden" />
        </button>

        {/* Quick Add Demand Input */}
        {canCreateDemands && (
          <form
            onSubmit={handleQuickAddSubmit}
            className="relative flex-1 max-w-xs hidden md:flex items-center"
            id="header-quick-add-form"
          >
            <div
              className={`flex items-center gap-2 bg-slate-100/90 dark:bg-slate-800/90 rounded-full px-3 py-1.5 w-full border transition-all duration-200 ${
                quickAddSuccess
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                  : 'border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-500/20'
              }`}
            >
              {quickAddSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 animate-in zoom-in-50 duration-150" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
              )}

              <input
                ref={quickAddInputRef}
                type="text"
                placeholder="Criar rápida: digite e tecle Enter..."
                value={quickAddTitle}
                onChange={(e) => setQuickAddTitle(e.target.value)}
                disabled={isQuickAdding}
                className="bg-transparent border-none outline-none text-xs w-full text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                id="header-quick-add-input"
                aria-label="Criar demanda rápida"
              />

              {quickAddTitle.trim() ? (
                <button
                  type="submit"
                  disabled={isQuickAdding}
                  className="p-1 rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors shrink-0 flex items-center justify-center"
                  title="Pressione Enter para criar"
                  id="btn-submit-quick-add"
                >
                  <CornerDownLeft className="w-3 h-3" />
                </button>
              ) : (
                <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono text-slate-400 dark:text-slate-500 bg-slate-200/70 dark:bg-slate-700/60 rounded border border-slate-300/60 dark:border-slate-600/60 shrink-0">
                  Q
                </kbd>
              )}
            </div>
          </form>
        )}

        {/* Global Search Capsule */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-sm">
          <div
            className={`flex items-center gap-2.5 bg-slate-100/90 dark:bg-slate-800/90 rounded-full px-3.5 py-1.5 w-full border transition-all duration-200 ${
              isSearchFocused
                ? 'border-blue-500 bg-white dark:bg-slate-900 shadow-md ring-2 ring-blue-500/20'
                : 'border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <Search className={`w-4 h-4 shrink-0 transition-colors ${isSearchFocused ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />

            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar por código (#001), 5W2H, título ou responsável..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setFilters((prev) => ({ ...prev, search: searchQuery }));
                  setIsSearchFocused(false);
                }
              }}
              className="bg-transparent border-none outline-none text-xs sm:text-sm w-full text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
              id="global-search-input"
              aria-label="Pesquisa global de demandas"
            />

            {searchQuery ? (
              <button
                onClick={handleClearSearch}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
                title="Limpar pesquisa (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-200/70 dark:bg-slate-700/60 rounded border border-slate-300/60 dark:border-slate-600/60 shrink-0">
                <span className="text-[11px]">⌘</span>K
              </kbd>
            )}
          </div>

          {/* Global Search Results Dropdown Popover */}
          <AnimatePresence>
          {isSearchFocused && (
            <motion.div variants={reduceMotion ? undefined : dropdownVariants} initial={reduceMotion ? false : 'closed'} animate="open" exit="closed" className="absolute top-full left-0 right-0 mt-2 origin-top bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 font-sans">
              {searchQuery.trim() ? (
                <div>
                  {/* Results Header */}
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-blue-500" />
                      Resultados da Busca
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                      {searchResults.length} {searchResults.length === 1 ? 'encontrada' : 'encontradas'}
                    </span>
                  </div>

                  {/* Results List */}
                  {searchResults.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                      {searchResults.slice(0, 8).map((demand) => {
                        const category = categories.find((c) => c.id === demand.categoryId) || categories[0];
                        const priority = priorities.find((p) => p.id === demand.priorityId) || priorities[0];
                        const status = statuses.find((s) => s.id === demand.statusId) || statuses[0];
                        const isBlocked = demand.blocker?.isBlocked;

                        return (
                          <div
                            key={demand.id}
                            onClick={() => handleSelectResult(demand)}
                            className="p-3 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 cursor-pointer transition-colors group flex items-start gap-3"
                          >
                            <div className={`p-2 rounded-xl border ${category.bgColor} ${category.textColor} ${category.borderColor} shrink-0 mt-0.5`}>
                              <IconRenderer name={category.iconName} className="w-3.5 h-3.5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                                  {demand.code}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${priority.bgColor}`}>
                                  {priority.name}
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {status.name}
                                </span>
                                {isBlocked && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 flex items-center gap-1">
                                    <ShieldAlert className="w-3 h-3" /> Bloqueada
                                  </span>
                                )}
                              </div>

                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                                {demand.title}
                              </p>
                            </div>

                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 self-center shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Nenhuma demanda encontrada
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                        Não encontramos resultados para "{searchQuery}". Tente outro termo de busca.
                      </p>
                    </div>
                  )}

                  {/* Actions Footer */}
                  {searchResults.length > 0 && (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={handleViewAllInKanban}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-950/60 flex items-center gap-1.5 transition-colors"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Ver no Kanban ({searchResults.length})
                      </button>
                      <button
                        onClick={handleViewAllInList}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
                      >
                        Abrir em Lista
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Quick Shortcuts when query is empty */
                <div className="p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                    <span>Atalhos Rápidos</span>
                    <span className="text-[10px]">ESC para fechar</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSearchChange('PROJETO')}
                      className="p-2 rounded-xl text-left bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100 transition-colors"
                    >
                      <p className="text-xs font-bold text-blue-700 dark:text-blue-300">📁 Projetos</p>
                      <p className="text-[10px] text-blue-600/70 dark:text-blue-400">Demandas de grande porte</p>
                    </button>

                    <button
                      onClick={() => handleSearchChange('MELHORIA')}
                      className="p-2 rounded-xl text-left bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-100 transition-colors"
                    >
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">⚡ Melhorias</p>
                      <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400">Otimizações de fluxo</p>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Controls: Unified Notifications/Alerts, Tools Menu, Primary Action & User Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* 1. Unified Notifications & Alerts Button (Crucial Position with Status Badges) */}
        <button
          onClick={onOpenNotifications}
          className={`relative p-2 rounded-xl border transition-all flex items-center justify-center ${
            criticalAlertsCount > 0
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 shadow-xs'
              : unreadNotificationCount > 0
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title={
            criticalAlertsCount > 0
              ? `Central de Alertas: ${overdueCount} atrasada(s), ${blockedCount} bloqueada(s)`
              : 'Central de Notificações e Alertas'
          }
          id="btn-notifications-alerts"
          aria-label="Alertas e Notificações"
        >
          {criticalAlertsCount > 0 ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          ) : (
            <Bell className="w-4 h-4" />
          )}

          {/* Badge indicator */}
          {totalNotificationsAndAlerts > 0 && (
            <span
              className={`absolute -top-1 -right-1 px-1.5 min-w-[18px] h-[18px] text-[10px] font-extrabold rounded-full flex items-center justify-center text-white shadow-xs ${
                criticalAlertsCount > 0 ? 'bg-red-600 animate-pulse' : 'bg-blue-600'
              }`}
            >
              {totalNotificationsAndAlerts}
            </span>
          )}
        </button>

        {/* 3. Primary CTA: + Nova Demanda */}
        {canCreateDemands && (
          <MotionButton
            onClick={onOpenCreateModal}
            className="bg-blue-600 text-white px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors duration-150 flex items-center gap-1.5 shrink-0"
            id="btn-new-demand-header"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Demanda</span>
            <span className="sm:hidden">Nova</span>
          </MotionButton>
        )}

        {/* 4. Active User Avatar & Profile Menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-1.5 p-0.5 rounded-xl hover:ring-2 hover:ring-blue-500/30 transition-all"
            title={`${currentUser.name} (${currentUser.roleTitle || currentUser.role})`}
            id="btn-user-profile-menu"
          >
            <UserAvatar name={currentUser.name} src={currentUser.avatar} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs text-xs" />
          </button>

          <AnimatePresence>
          {userDropdownOpen && (
            <motion.div variants={reduceMotion ? undefined : dropdownVariants} initial={reduceMotion ? false : 'closed'} animate="open" exit="closed" className="absolute right-0 mt-2 w-72 origin-top-right bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 font-sans">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {currentUser.roleTitle || currentUser.role} • {currentUser.department}
                </p>
              </div>

              <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                <button onClick={() => { setUserDropdownOpen(false); setProfileSettingsOpen(true); }} className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <UserCog className="w-4 h-4 text-blue-600" /><div className="text-left"><p>Meu perfil</p><p className="text-[10px] font-normal text-slate-400">Foto, tema e senha</p></div>
                </button>
              </div>

              <div className="px-3 pt-2 border-t border-slate-100 dark:border-slate-800 mt-1">
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    window.dispatchEvent(new Event('prolog:logout'));
                  }}
                  className="w-full py-1.5 mb-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-center gap-1.5 font-medium transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Deseja limpar os dados locais e restaurar apenas as configurações padrão?')) {
                      resetAllData();
                      setUserDropdownOpen(false);
                    }
                  }}
                  className="w-full py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg flex items-center justify-center gap-1.5 font-medium transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpar Dados Locais</span>
                </button>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
      <ProfileSettingsModal isOpen={profileSettingsOpen} onClose={() => setProfileSettingsOpen(false)} />
    </header>
  );
};
