/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { AndroidShell } from './components/layout/AndroidShell';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { ListView } from './components/views/ListView';
import { CalendarView } from './components/views/CalendarView';
import { TimelineView } from './components/views/TimelineView';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { ExecutiveReport } from './components/reports/ExecutiveReport';
import { GoogleWorkspaceHub } from './components/integrations/GoogleWorkspaceHub';
import { TeamsManagement } from './components/admin/TeamsManagement';
import { CategoriesConfig } from './components/admin/CategoriesConfig';
import { AuditLogsView } from './components/admin/AuditLogsView';
import { AuthGate } from './components/auth/AuthGate';

// Enterprise Roadmap Views
import { AndroidDistributionView } from './components/views/AndroidDistributionView';
import { TemplatesAndRecurrenceView } from './components/views/TemplatesAndRecurrenceView';
import { SlaManagementView } from './components/views/SlaManagementView';
import { RiskManagementView } from './components/views/RiskManagementView';
import { ScheduledReportsView } from './components/views/ScheduledReportsView';
import { ApiWebhooksAutomationsView } from './components/views/ApiWebhooksAutomationsView';
import { SystemHealthAndBackupView } from './components/views/SystemHealthAndBackupView';

// Modals
import { DemandDetailModal } from './components/modals/DemandDetailModal';
import { CreateDemandModal } from './components/modals/CreateDemandModal';
import { ExportModal } from './components/modals/ExportModal';
import { NotificationDrawer } from './components/modals/NotificationDrawer';
import { CommandPaletteModal } from './components/modals/CommandPaletteModal';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    activeView,
    deviceMode,
    isCreateModalOpen,
    setIsCreateModalOpen,
    toasts,
    removeToast,
    isSidebarOpen,
    closeSidebar
  } = useApp();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

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

  const renderActiveView = () => {
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
      case 'timeline':
        return <TimelineView />;
      case 'dashboard':
        return <ExecutiveDashboard />;
      case 'executive_report':
        return <ExecutiveReport />;
      case 'google_integrations':
        return <GoogleWorkspaceHub />;
      case 'teams_management':
        return <TeamsManagement />;
      case 'categories_config':
        return <CategoriesConfig />;
      case 'audit_logs':
        return <AuditLogsView />;
      
      // Enterprise Roadmap Views
      case 'android':
        return <AndroidDistributionView />;
      case 'templates':
        return <TemplatesAndRecurrenceView />;
      case 'sla':
        return <SlaManagementView />;
      case 'risks':
        return <RiskManagementView />;
      case 'reports':
        return <ScheduledReportsView />;
      case 'api_webhooks':
        return <ApiWebhooksAutomationsView />;
      case 'system_health':
        return <SystemHealthAndBackupView />;

      default:
        return <KanbanBoard />;
    }
  };

  const mainView = renderActiveView();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-blue-500 selection:text-white">
      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3 rounded-xl shadow-xl border flex items-start space-x-3 text-xs animate-in slide-in-from-bottom-3 duration-200 ${
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
          </div>
        ))}
      </div>

      {/* Mode Switch: Android Simulator vs Desktop Web Application */}
      {deviceMode === 'android' ? (
        <AndroidShell
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
        >
          {mainView}
        </AndroidShell>
      ) : (
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

            <main className="flex-1 min-w-0 overflow-y-auto p-3 sm:p-4 bg-slate-100/60 dark:bg-slate-950">
              <div className="w-full">{mainView}</div>
            </main>
          </div>
        </div>
      )}

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
