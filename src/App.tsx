/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { AuthGate } from './components/auth/AuthGate';
import { isViewEnabled } from './config/views';

// Enterprise Roadmap Views
const viewLoaders = {
  kanban: () => import('./components/kanban/KanbanBoard'),
  list: () => import('./components/views/ListView'),
  calendar: () => import('./components/views/CalendarView'),
  dashboard: () => import('./components/dashboard/ExecutiveDashboard'),
  executiveReport: () => import('./components/reports/ExecutiveReport'),
  teams: () => import('./components/admin/TeamsManagement'),
  categories: () => import('./components/admin/CategoriesConfig'),
  audit: () => import('./components/admin/AuditLogsView'),
};

const KanbanBoard = lazy(() => viewLoaders.kanban().then(module => ({ default: module.KanbanBoard })));
const ListView = lazy(() => viewLoaders.list().then(module => ({ default: module.ListView })));
const CalendarView = lazy(() => viewLoaders.calendar().then(module => ({ default: module.CalendarView })));
const ExecutiveDashboard = lazy(() => viewLoaders.dashboard().then(module => ({ default: module.ExecutiveDashboard })));
const ExecutiveReport = lazy(() => viewLoaders.executiveReport().then(module => ({ default: module.ExecutiveReport })));
const TeamsManagement = lazy(() => viewLoaders.teams().then(module => ({ default: module.TeamsManagement })));
const CategoriesConfig = lazy(() => viewLoaders.categories().then(module => ({ default: module.CategoriesConfig })));
const AuditLogsView = lazy(() => viewLoaders.audit().then(module => ({ default: module.AuditLogsView })));

// Modals
import { DemandDetailModal } from './components/modals/DemandDetailModal';
import { CreateDemandModal } from './components/modals/CreateDemandModal';
import { ExportModal } from './components/modals/ExportModal';
import { NotificationDrawer } from './components/modals/NotificationDrawer';
import { CommandPaletteModal } from './components/modals/CommandPaletteModal';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MOTION_EASE_OUT } from './components/motion/presets';

const AppContent: React.FC = () => {
  const {
    activeView,
    isCreateModalOpen,
    setIsCreateModalOpen,
    toasts,
    removeToast,
    isSidebarOpen,
    closeSidebar
  } = useApp();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const viewTransitionKey = ['kanban', 'projects', 'improvements', 'tasks', 'my_demands', 'created_by_me', 'team_demands'].includes(activeView)
    ? 'kanban'
    : activeView;

  // Global Keyboard listener for Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Warm all route chunks after the first paint. Navigation then swaps an
  // already-cached component instead of exposing Suspense's loading fallback.
  useEffect(() => {
    const preloadViews = () => { void Promise.allSettled(Object.values(viewLoaders).map(load => load())); };
    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(preloadViews, { timeout: 1800 });
      return () => window.cancelIdleCallback(idleId);
    }
    const timeoutId = globalThis.setTimeout(preloadViews, 350);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const closeTopModal = (modal: HTMLElement) => {
      if (modal.dataset.modalDecision === 'true') return;
      const buttons = Array.from(modal.querySelectorAll<HTMLButtonElement>('button'));
      const closeButton = buttons.find(button => button.dataset.modalClose === 'true' || button.getAttribute('aria-label')?.toLowerCase() === 'fechar')
        || buttons.find(button => ['fechar', 'cancelar'].includes(button.textContent?.trim().toLowerCase() || ''));
      closeButton?.click();
    };
    const visibleModals = () => Array.from(document.querySelectorAll<HTMLElement>('[data-modal-overlay="true"]')).filter(element => element.getClientRects().length > 0);
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const modals = visibleModals();
      const topModal = modals.at(-1);
      if (topModal && topModal.dataset.modalDecision !== 'true') { event.preventDefault(); closeTopModal(topModal); }
    };
    let pressedBackdrop: HTMLElement | null = null;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      pressedBackdrop = target.dataset.modalOverlay === 'true' ? target : null;
    };
    const handleBackdropClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target === pressedBackdrop && target.dataset.modalOverlay === 'true' && target.dataset.modalDecision !== 'true') closeTopModal(target);
      pressedBackdrop = null;
    };
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('click', handleBackdropClick);
    return () => { document.removeEventListener('keydown', handleEscape); document.removeEventListener('pointerdown', handlePointerDown); document.removeEventListener('click', handleBackdropClick); };
  }, []);

  const renderActiveView = () => {
    if (!isViewEnabled(activeView)) return <KanbanBoard />;
    switch (activeView) {
      case 'kanban':
      case 'projects':
      case 'improvements':
      case 'tasks':
      case 'my_demands':
      case 'created_by_me':
      case 'team_demands':
        return <KanbanBoard />;
      case 'list':
        return <ListView />;
      case 'calendar':
        return <CalendarView />;
      case 'dashboard':
        return <ExecutiveDashboard />;
      case 'executive_report':
        return <ExecutiveReport />;
      case 'teams_management':
        return <TeamsManagement />;
      case 'categories_config':
        return <CategoriesConfig />;
      case 'audit_logs':
        return <AuditLogsView />;
      
      default:
        return <KanbanBoard />;
    }
  };

  const mainView = (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Carregando módulo…</div>}>
      {renderActiveView()}
    </Suspense>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-blue-500 selection:text-white">
      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm pointer-events-none">
        <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={reduceMotion ? false : { opacity: 0, x: 28, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.97 }}
            transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }}
            className={`pointer-events-auto p-3 rounded-xl shadow-xl border flex items-start space-x-3 text-xs ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toast.type === 'error'
                ? 'bg-red-900 text-white border-red-700'
                : toast.type === 'warning'
                ? 'bg-amber-900 text-white border-amber-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
              {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold leading-tight">{toast.title}</p>
              <p className="opacity-90 mt-0.5 leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="opacity-70 hover:opacity-100 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>

      <div className="flex h-screen overflow-hidden relative">
          {/* Backdrop Overlay for collapsible sidebar when open on mobile or drawer */}
          {isSidebarOpen && (
            <div
              onClick={closeSidebar}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity animate-in fade-in duration-200"
              aria-hidden="true"
              id="sidebar-backdrop"
            />
          )}

          {/* Desktop / Drawer Left Sidebar */}
          <Sidebar />

          {/* Right Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
            />

            <main className="relative flex-1 min-w-0 overflow-y-auto p-3 sm:p-4 bg-slate-100/60 dark:bg-slate-950">
              <motion.div
                key={viewTransitionKey}
                initial={reduceMotion ? false : { x: 8 }}
                animate={{ x: 0 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: MOTION_EASE_OUT }}
                className="w-full will-change-transform"
              >
                {mainView}
              </motion.div>
            </main>
          </div>
      </div>

      {/* Global Modals & Drawers */}
      <DemandDetailModal />
      <CreateDemandModal />
      <ExportModal />
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthGate>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthGate>
  );
}

export default App;
