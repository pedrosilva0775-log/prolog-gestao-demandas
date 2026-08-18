/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveView } from '../../types';
import { CollapsedTooltip } from '../common/CollapsedTooltip';
import {
  LayoutGrid,
  ListOrdered,
  Calendar,
  Clock,
  PieChart,
  FileSpreadsheet,
  Crown,
  BookOpen,
  Cog,
  UserCheck,
  Send,
  Users,
  Sliders,
  ShieldCheck,
  Cloud,
  ChevronDown,
  X,
  Smartphone,
  Repeat,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    demands,
    currentUser,
    categories,
    googleServices,
    isSidebarOpen,
    closeSidebar,
    isSidebarCollapsed,
    toggleSidebarCollapse,
    hasPermission
  } = useApp();

  const sidebarRef = useRef<HTMLElement>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    try { return { main: true, enterprise: true, scopes: true, admin: true, ...JSON.parse(localStorage.getItem('prolog_sidebar_sections') || '{}') }; }
    catch { return { main: true, enterprise: true, scopes: true, admin: true }; }
  });
  const toggleSection = (section: string) => {
    setOpenSections(previous => {
      const next = { ...previous, [section]: !previous[section] };
      localStorage.setItem('prolog_sidebar_sections', JSON.stringify(next));
      return next;
    });
  };

  // Click outside listener: Automatically close drawer when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const toggleBtn = document.getElementById('btn-sidebar-toggle');
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        (!toggleBtn || !toggleBtn.contains(event.target as Node))
      ) {
        closeSidebar();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSidebarOpen) {
        closeSidebar();
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSidebarOpen, closeSidebar]);

  const handleNavClick = (viewId: ActiveView) => {
    setActiveView(viewId);
    // Auto-close on mobile / tablet drawer mode
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  const connectedGoogleCount = googleServices.filter((s) => s.connected).length;

  const projectCount = demands.filter((d) => d.categoryId === 'cat-projeto').length;
  const improvementCount = demands.filter((d) => d.categoryId === 'cat-melhoria').length;
  const taskCount = demands.filter((d) => d.categoryId === 'cat-tarefa').length;
  const myDemandsCount = demands.filter((d) => d.assigneeId === currentUser.id).length;
  const createdByMeCount = demands.filter((d) => d.requesterId === currentUser.id).length;

  const mainNavItems = [
    { id: 'dashboard' as ActiveView, label: 'Dashboard Executivo', icon: PieChart },
    { id: 'kanban' as ActiveView, label: 'Quadro Kanban', icon: LayoutGrid, badge: demands.length },
    { id: 'list' as ActiveView, label: 'Lista de Atividades', icon: ListOrdered },
    { id: 'calendar' as ActiveView, label: 'Calendário de Prazos', icon: Calendar },
    { id: 'timeline' as ActiveView, label: 'Linha do Tempo (Gantt)', icon: Clock },
    ...(hasPermission('reports', 'read') ? [{ id: 'executive_report' as ActiveView, label: 'Relatórios Executivos', icon: FileSpreadsheet, highlight: true }] : []),
  ];

  const enterpriseModules = [
    { id: 'android' as ActiveView, label: 'Aplicativo Android & APK', icon: Smartphone, badge: 'APK v2.4', badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
    { id: 'templates' as ActiveView, label: 'Modelos & Recorrências', icon: Repeat },
    ...(hasPermission('sla', 'read') ? [{ id: 'sla' as ActiveView, label: 'Gestão de SLA & Horário Útil', icon: Clock }] : []),
    ...(hasPermission('scheduled_reports', 'read') ? [{ id: 'reports' as ActiveView, label: 'Relatórios Programados', icon: Calendar }] : []),
  ];

  const scopeNavItems = [
    ...(hasPermission('projects', 'read') ? [{ id: 'projects' as ActiveView, label: 'Projetos', icon: Crown, color: 'text-amber-500', badge: projectCount }] : []),
    ...(hasPermission('improvements', 'read') ? [{ id: 'improvements' as ActiveView, label: 'Melhorias', icon: BookOpen, color: 'text-cyan-500', badge: improvementCount }] : []),
    ...(hasPermission('tasks', 'read') ? [{ id: 'tasks' as ActiveView, label: 'Tarefas', icon: Cog, color: 'text-indigo-500', badge: taskCount }] : []),
    { id: 'my_demands' as ActiveView, label: 'Minhas Demandas', icon: UserCheck, badge: myDemandsCount },
    { id: 'created_by_me' as ActiveView, label: 'Criadas por Mim', icon: Send, badge: createdByMeCount },
    { id: 'team_demands' as ActiveView, label: 'Minhas Equipes', icon: Users },
  ];

  const adminNavItems = [
    ...(hasPermission('google_workspace', 'read') ? [{
      id: 'google_integrations' as ActiveView,
      label: 'Google Workspace',
      icon: Cloud,
      badge: `${connectedGoogleCount}/${googleServices.length}`,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
    }] : []),
    ...(hasPermission('users_teams', 'read') ? [{ id: 'teams_management' as ActiveView, label: 'Equipes e Usuários', icon: Users }] : []),
    ...(hasPermission('categories', 'read') ? [{ id: 'categories_config' as ActiveView, label: 'Configurações', icon: Sliders }] : []),
    ...(hasPermission('audit', 'read') ? [{ id: 'audit_logs' as ActiveView, label: 'Auditoria & Logs', icon: ShieldCheck }] : []),
  ];

  return (
    <aside
      ref={sidebarRef}
      id="main-sidebar"
      className={`fixed lg:static top-0 bottom-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 h-full overflow-hidden font-sans shadow-2xl lg:shadow-none transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
      } ${
        isSidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-64'
      }`}
    >
      {/* Brand Header */}
      <div className={`border-b border-slate-100 dark:border-slate-800 flex items-center transition-all ${
        isSidebarCollapsed ? 'p-3 justify-center' : 'p-4 sm:p-5 justify-between gap-3'
      }`}>
        <div
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-3 min-w-0 cursor-pointer group"
          title="PROLOG"
        >
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20 shrink-0 group-hover:bg-blue-700 transition-colors">
            P
          </div>
          {!isSidebarCollapsed && (
            <div className="min-w-0 animate-in fade-in duration-200">
              <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-slate-100 block truncate">
                PROLOG
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block uppercase tracking-wider">
                Gestão de Demandas
              </span>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={closeSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 lg:hidden"
          title="Fechar Menu Lateral"
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Scroll Container */}
      <div className={`flex-1 overflow-y-auto overflow-x-hidden space-y-6 ${
        isSidebarCollapsed ? 'p-2 space-y-4' : 'p-4'
      }`}>
        {/* Main Views */}
        <div>
          {!isSidebarCollapsed ? (
            <button onClick={() => toggleSection('main')} className="w-full px-3 mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300" aria-expanded={openSections.main}>
              <span>Visões Principais</span><ChevronDown className={`w-3.5 h-3.5 transition-transform ${openSections.main ? '' : '-rotate-90'}`} />
            </button>
          ) : (
            <div className="h-px bg-slate-200/60 dark:bg-slate-800 my-2 mx-1" />
          )}
          <nav className={`space-y-1 ${!isSidebarCollapsed && !openSections.main ? 'hidden' : ''}`}>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <CollapsedTooltip
                  key={item.id}
                  content={item.label}
                  badge={item.badge}
                  enabled={isSidebarCollapsed}
                >
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all ${
                      isSidebarCollapsed
                        ? 'justify-center p-2.5 h-10 w-10 mx-auto'
                        : 'justify-between p-2.5 sm:p-3'
                    } ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold shadow-xs'
                        : item.highlight
                        ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                    id={`nav-${item.id}`}
                    aria-label={item.label}
                  >
                    <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!isSidebarCollapsed && item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                </CollapsedTooltip>
              );
            })}
          </nav>
        </div>

        {/* Enterprise Modules */}
        <div>
          {!isSidebarCollapsed ? (
            <button onClick={() => toggleSection('enterprise')} className="w-full px-3 mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300" aria-expanded={openSections.enterprise}>
              <span>Módulos Corporativos</span><ChevronDown className={`w-3.5 h-3.5 transition-transform ${openSections.enterprise ? '' : '-rotate-90'}`} />
            </button>
          ) : (
            <div className="h-px bg-slate-200/60 dark:bg-slate-800 my-2 mx-1" />
          )}
          <nav className={`space-y-1 ${!isSidebarCollapsed && !openSections.enterprise ? 'hidden' : ''}`}>
            {enterpriseModules.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <CollapsedTooltip
                  key={item.id}
                  content={item.label}
                  badge={item.badge}
                  enabled={isSidebarCollapsed}
                >
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all ${
                      isSidebarCollapsed
                        ? 'justify-center p-2.5 h-10 w-10 mx-auto'
                        : 'justify-between p-2 sm:p-2.5'
                    } ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                    id={`nav-${item.id}`}
                    aria-label={item.label}
                  >
                    <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      {!isSidebarCollapsed && <span className="truncate text-[12px]">{item.label}</span>}
                    </div>
                    {!isSidebarCollapsed && item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                          item.badgeColor || (isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                </CollapsedTooltip>
              );
            })}
          </nav>
        </div>

        {/* Demand Categories & Scopes */}
        <div>
          {!isSidebarCollapsed ? (
            <button onClick={() => toggleSection('scopes')} className="w-full px-3 mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300" aria-expanded={openSections.scopes}>
              <span>Categorias & Filtros</span><ChevronDown className={`w-3.5 h-3.5 transition-transform ${openSections.scopes ? '' : '-rotate-90'}`} />
            </button>
          ) : (
            <div className="h-px bg-slate-200/60 dark:bg-slate-800 my-2 mx-1" />
          )}
          <nav className={`space-y-1 ${!isSidebarCollapsed && !openSections.scopes ? 'hidden' : ''}`}>
            {scopeNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <CollapsedTooltip
                  key={item.id}
                  content={item.label}
                  badge={item.badge}
                  enabled={isSidebarCollapsed}
                >
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center rounded-lg text-xs font-medium transition-all ${
                      isSidebarCollapsed
                        ? 'justify-center p-2.5 h-10 w-10 mx-auto'
                        : 'justify-between px-3 py-2'
                    } ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                    id={`nav-${item.id}`}
                    aria-label={item.label}
                  >
                    <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                      <Icon className={`w-5 h-5 shrink-0 ${item.color || 'text-slate-400 dark:text-slate-500'}`} />
                      {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!isSidebarCollapsed && item.badge !== undefined && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </CollapsedTooltip>
              );
            })}
          </nav>
        </div>

        {/* Administration & Ecosystem */}
        <div>
          {!isSidebarCollapsed ? (
            <button onClick={() => toggleSection('admin')} className="w-full px-3 mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300" aria-expanded={openSections.admin}>
              <span>Gestão & Configurações</span><ChevronDown className={`w-3.5 h-3.5 transition-transform ${openSections.admin ? '' : '-rotate-90'}`} />
            </button>
          ) : (
            <div className="h-px bg-slate-200/60 dark:bg-slate-800 my-2 mx-1" />
          )}
          <nav className={`space-y-1 ${!isSidebarCollapsed && !openSections.admin ? 'hidden' : ''}`}>
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <CollapsedTooltip
                  key={item.id}
                  content={item.label}
                  badge={item.badge}
                  enabled={isSidebarCollapsed}
                >
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center rounded-lg text-xs font-medium transition-all ${
                      isSidebarCollapsed
                        ? 'justify-center p-2.5 h-10 w-10 mx-auto'
                        : 'justify-between px-3 py-2'
                    } ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                    id={`nav-${item.id}`}
                    aria-label={item.label}
                  >
                    <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                      <Icon className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
                      {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!isSidebarCollapsed && item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                </CollapsedTooltip>
              );
            })}
          </nav>
        </div>
      </div>

    </aside>
  );
};
