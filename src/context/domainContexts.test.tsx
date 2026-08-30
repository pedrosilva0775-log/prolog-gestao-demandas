import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { AppContextType } from './AppContext';
import { DomainProviders, useSession, useToastActions, useVisualState } from './domainContexts';

const domainValue = (): AppContextType => ({
  currentUser: { id: 'u1', name: 'Maria', email: 'maria@local', role: 'admin', roleTitle: '', department: '', avatar: '', teamIds: [], active: true },
  securitySessions: [],
  theme: 'dark',
  activeView: 'kanban',
  deviceMode: 'web',
  isOffline: false,
  isSidebarOpen: false,
  isSidebarCollapsed: false,
  exportModalOpen: false,
  commandPaletteOpen: false,
  notifications: [],
  unreadNotificationCount: 0,
  toasts: [],
  showToast: vi.fn(),
  removeToast: vi.fn()
} as unknown as AppContextType);

describe('DomainProviders', () => {
  it('expõe sessão e estado visual pelos providers de domínio', () => {
    const Consumer = () => {
      const { currentUser } = useSession();
      const { theme } = useVisualState();
      return <span>{currentUser.name}:{theme}</span>;
    };
    expect(renderToStaticMarkup(<DomainProviders value={domainValue()}><Consumer /></DomainProviders>)).toContain('Maria:dark');
  });

  it('encaminha comandos de toast para a implementação compatível', () => {
    const value = domainValue();
    const Consumer = () => {
      const { showToast } = useToastActions();
      showToast({ type: 'success', title: 'OK', message: 'salvo' });
      return null;
    };
    renderToStaticMarkup(<DomainProviders value={value}><Consumer /></DomainProviders>);
    expect(value.showToast).toHaveBeenCalledWith({ type: 'success', title: 'OK', message: 'salvo' });
  });

  it('falha com mensagem útil fora do provider', () => {
    const Consumer = () => { useSession(); return null; };
    expect(() => renderToStaticMarkup(<Consumer />)).toThrow('useSession must be used within an AppProvider');
  });
});
