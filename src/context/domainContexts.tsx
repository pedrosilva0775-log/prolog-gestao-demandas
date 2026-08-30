import React, { createContext, ReactNode, useCallback, useContext, useMemo, useRef } from 'react';
import type { AppContextType } from './AppContext';

type SessionContextValue = Pick<AppContextType, 'currentUser' | 'setCurrentUserId' | 'securitySessions' | 'revokeSession'>;
type PermissionsContextValue = Pick<AppContextType, 'allRbacPermissions' | 'rolePermissions' | 'updateRolePermissions' | 'resetRolePermissions' | 'updateUserCustomPermissions' | 'hasPermission' | 'userHasPermission'>;
type DemandsContextValue = Pick<AppContextType, 'demands' | 'filteredDemands' | 'filters' | 'setFilters' | 'resetFilters' | 'selectedDemand' | 'setSelectedDemand' | 'isCreateModalOpen' | 'setIsCreateModalOpen' | 'editingDemand' | 'setEditingDemand' | 'createDemand' | 'updateDemand' | 'deleteDemand' | 'moveDemandStatus' | 'toggleBlocker' | 'extendDeadline' | 'addComment' | 'editComment' | 'toggleChecklist' | 'completeDemand'>;
type PeopleContextValue = Pick<AppContextType, 'users' | 'teams' | 'createTeam' | 'updateTeam' | 'deleteTeam' | 'createUser' | 'updateUser' | 'deleteUser'>;
type SettingsContextValue = Pick<AppContextType, 'categories' | 'statuses' | 'priorities' | 'updateCategory' | 'createCategory' | 'deleteCategory' | 'updateStatus' | 'createStatus' | 'deleteStatus' | 'reorderStatuses' | 'updatePriority' | 'createPriority' | 'googleServices' | 'toggleGoogleService' | 'automations' | 'toggleAutomationRule' | 'resetAllData'>;
type NotificationsContextValue = Pick<AppContextType, 'notifications' | 'unreadNotificationCount' | 'markNotificationAsRead' | 'markAllNotificationsAsRead' | 'clearAllNotifications' | 'toasts' | 'showToast' | 'removeToast'>;
type VisualStateContextValue = Pick<AppContextType, 'activeView' | 'setActiveView' | 'theme' | 'setTheme' | 'deviceMode' | 'setDeviceMode' | 'isOffline' | 'setIsOffline' | 'isSidebarOpen' | 'setIsSidebarOpen' | 'toggleSidebar' | 'closeSidebar' | 'isSidebarCollapsed' | 'setIsSidebarCollapsed' | 'toggleSidebarCollapse' | 'exportModalOpen' | 'setExportModalOpen' | 'commandPaletteOpen' | 'setCommandPaletteOpen'>;

const SessionContext = createContext<SessionContextValue | undefined>(undefined);
const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined);
const DemandsContext = createContext<DemandsContextValue | undefined>(undefined);
const PeopleContext = createContext<PeopleContextValue | undefined>(undefined);
const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);
const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);
const ToastActionsContext = createContext<Pick<AppContextType, 'showToast' | 'removeToast'> | undefined>(undefined);
const VisualStateContext = createContext<VisualStateContextValue | undefined>(undefined);

const required = <T,>(value: T | undefined, hook: string): T => {
  if (!value) throw new Error(`${hook} must be used within an AppProvider`);
  return value;
};

export const useSession = () => required(useContext(SessionContext), 'useSession');
export const usePermissions = () => required(useContext(PermissionsContext), 'usePermissions');
export const useDemands = () => required(useContext(DemandsContext), 'useDemands');
export const usePeople = () => required(useContext(PeopleContext), 'usePeople');
export const useSettings = () => required(useContext(SettingsContext), 'useSettings');
export const useNotifications = () => required(useContext(NotificationsContext), 'useNotifications');
export const useToastActions = () => required(useContext(ToastActionsContext), 'useToastActions');
export const useVisualState = () => required(useContext(VisualStateContext), 'useVisualState');

export const DomainProviders: React.FC<{ value: AppContextType; children: ReactNode }> = ({ value, children }) => {
  const latest = useRef(value);
  latest.current = value;
  // Event-style wrappers keep command identities stable while always invoking the latest legacy implementation.
  const command = <K extends keyof AppContextType>(key: K) => ((...args: unknown[]) => (latest.current[key] as (...inner: unknown[]) => unknown)(...args)) as AppContextType[K];
  const setCurrentUserId = useCallback(command('setCurrentUserId'), []);
  const revokeSession = useCallback(command('revokeSession'), []);
  const showToast = useCallback(command('showToast'), []);
  const removeToast = useCallback(command('removeToast'), []);
  const setActiveView = useCallback(command('setActiveView'), []);
  const setTheme = useCallback(command('setTheme'), []);
  const setDeviceMode = useCallback(command('setDeviceMode'), []);
  const setIsOffline = useCallback(command('setIsOffline'), []);
  const setIsSidebarOpen = useCallback(command('setIsSidebarOpen'), []);
  const toggleSidebar = useCallback(command('toggleSidebar'), []);
  const closeSidebar = useCallback(command('closeSidebar'), []);
  const setIsSidebarCollapsed = useCallback(command('setIsSidebarCollapsed'), []);
  const toggleSidebarCollapse = useCallback(command('toggleSidebarCollapse'), []);
  const setExportModalOpen = useCallback(command('setExportModalOpen'), []);
  const setCommandPaletteOpen = useCallback(command('setCommandPaletteOpen'), []);
  // Each projection changes only with its own domain. This is the structural boundary that
  // lets migrated consumers avoid updates caused by unrelated legacy state.
  const session = useMemo<SessionContextValue>(() => ({ currentUser: value.currentUser, setCurrentUserId, securitySessions: value.securitySessions, revokeSession }), [value.currentUser, value.securitySessions, setCurrentUserId, revokeSession]);
  const permissions = useMemo<PermissionsContextValue>(() => ({ allRbacPermissions: value.allRbacPermissions, rolePermissions: value.rolePermissions, updateRolePermissions: value.updateRolePermissions, resetRolePermissions: value.resetRolePermissions, updateUserCustomPermissions: value.updateUserCustomPermissions, hasPermission: value.hasPermission, userHasPermission: value.userHasPermission }), [value.allRbacPermissions, value.rolePermissions, value.updateRolePermissions, value.resetRolePermissions, value.updateUserCustomPermissions, value.hasPermission, value.userHasPermission]);
  const demands = useMemo<DemandsContextValue>(() => ({ demands: value.demands, filteredDemands: value.filteredDemands, filters: value.filters, setFilters: value.setFilters, resetFilters: value.resetFilters, selectedDemand: value.selectedDemand, setSelectedDemand: value.setSelectedDemand, isCreateModalOpen: value.isCreateModalOpen, setIsCreateModalOpen: value.setIsCreateModalOpen, editingDemand: value.editingDemand, setEditingDemand: value.setEditingDemand, createDemand: value.createDemand, updateDemand: value.updateDemand, deleteDemand: value.deleteDemand, moveDemandStatus: value.moveDemandStatus, toggleBlocker: value.toggleBlocker, extendDeadline: value.extendDeadline, addComment: value.addComment, editComment: value.editComment, toggleChecklist: value.toggleChecklist, completeDemand: value.completeDemand }), [value.demands, value.filteredDemands, value.filters, value.selectedDemand, value.isCreateModalOpen, value.editingDemand, value.createDemand, value.updateDemand, value.deleteDemand, value.moveDemandStatus, value.toggleBlocker, value.extendDeadline, value.addComment, value.editComment, value.toggleChecklist, value.completeDemand]);
  const people = useMemo<PeopleContextValue>(() => ({ users: value.users, teams: value.teams, createTeam: value.createTeam, updateTeam: value.updateTeam, deleteTeam: value.deleteTeam, createUser: value.createUser, updateUser: value.updateUser, deleteUser: value.deleteUser }), [value.users, value.teams, value.createTeam, value.updateTeam, value.deleteTeam, value.createUser, value.updateUser, value.deleteUser]);
  const settings = useMemo<SettingsContextValue>(() => ({ categories: value.categories, statuses: value.statuses, priorities: value.priorities, updateCategory: value.updateCategory, createCategory: value.createCategory, deleteCategory: value.deleteCategory, updateStatus: value.updateStatus, createStatus: value.createStatus, deleteStatus: value.deleteStatus, reorderStatuses: value.reorderStatuses, updatePriority: value.updatePriority, createPriority: value.createPriority, googleServices: value.googleServices, toggleGoogleService: value.toggleGoogleService, automations: value.automations, toggleAutomationRule: value.toggleAutomationRule, resetAllData: value.resetAllData }), [value.categories, value.statuses, value.priorities, value.updateCategory, value.createCategory, value.deleteCategory, value.updateStatus, value.createStatus, value.deleteStatus, value.reorderStatuses, value.updatePriority, value.createPriority, value.googleServices, value.toggleGoogleService, value.automations, value.toggleAutomationRule, value.resetAllData]);
  const notifications = useMemo<NotificationsContextValue>(() => ({ notifications: value.notifications, unreadNotificationCount: value.unreadNotificationCount, markNotificationAsRead: value.markNotificationAsRead, markAllNotificationsAsRead: value.markAllNotificationsAsRead, clearAllNotifications: value.clearAllNotifications, toasts: value.toasts, showToast, removeToast }), [value.notifications, value.unreadNotificationCount, value.markNotificationAsRead, value.markAllNotificationsAsRead, value.clearAllNotifications, value.toasts, showToast, removeToast]);
  const toastActions = useMemo(() => ({ showToast, removeToast }), [showToast, removeToast]);
  const visual = useMemo<VisualStateContextValue>(() => ({ activeView: value.activeView, setActiveView, theme: value.theme, setTheme, deviceMode: value.deviceMode, setDeviceMode, isOffline: value.isOffline, setIsOffline, isSidebarOpen: value.isSidebarOpen, setIsSidebarOpen, toggleSidebar, closeSidebar, isSidebarCollapsed: value.isSidebarCollapsed, setIsSidebarCollapsed, toggleSidebarCollapse, exportModalOpen: value.exportModalOpen, setExportModalOpen, commandPaletteOpen: value.commandPaletteOpen, setCommandPaletteOpen }), [value.activeView, value.theme, value.deviceMode, value.isOffline, value.isSidebarOpen, value.isSidebarCollapsed, value.exportModalOpen, value.commandPaletteOpen, setActiveView, setTheme, setDeviceMode, setIsOffline, setIsSidebarOpen, toggleSidebar, closeSidebar, setIsSidebarCollapsed, toggleSidebarCollapse, setExportModalOpen, setCommandPaletteOpen]);

  return <SessionContext.Provider value={session}><PermissionsContext.Provider value={permissions}><DemandsContext.Provider value={demands}><PeopleContext.Provider value={people}><SettingsContext.Provider value={settings}><NotificationsContext.Provider value={notifications}><ToastActionsContext.Provider value={toastActions}><VisualStateContext.Provider value={visual}>{children}</VisualStateContext.Provider></ToastActionsContext.Provider></NotificationsContext.Provider></SettingsContext.Provider></PeopleContext.Provider></DemandsContext.Provider></PermissionsContext.Provider></SessionContext.Provider>;
};
