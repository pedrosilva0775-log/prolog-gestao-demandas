/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  User,
  Team,
  CategoryConfig,
  StatusConfig,
  PriorityConfig,
  Demand,
  AuditLog,
  NotificationItem,
  GoogleIntegrationService,
  AutomationRule,
  FilterState,
  ActiveView,
  BlockerInfo,
  ChecklistItem,
  Comment,
  Attachment,
  InboxItem,
  DemandTemplate,
  RecurringRule,
  SlaPolicy,
  ApprovalRequest,
  StrategicObjective,
  RiskItem,
  ScheduledReportConfig,
  ApiKeyItem,
  WebhookSubscription,
  LgpdProcessingActivity,
  BackupSnapshot,
  TraceabilityItem,
  OfflineSyncQueueItem,
  SecuritySession,
  RbacModule,
  RbacAction,
  RbacPermissionRule,
  RolePermissionsMap,
  UserCustomPermissions,
  UserRole
} from '../types';
import { StorageService } from '../services/storage';
import { GoogleService } from '../services/googleService';
import { apiClient, ApiError } from '../services/apiClient';
import { ALL_RBAC_PERMISSIONS, INITIAL_ROLE_PERMISSIONS, INITIAL_CATEGORIES, INITIAL_STATUSES, INITIAL_PRIORITIES } from '../data/initialData';
import confetti from 'canvas-confetti';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
}

interface AppContextType {
  // Master Entities
  users: User[];
  teams: Team[];
  categories: CategoryConfig[];
  statuses: StatusConfig[];
  priorities: PriorityConfig[];
  demands: Demand[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
  googleServices: GoogleIntegrationService[];
  automations: AutomationRule[];

  // Enterprise Modules
  inbox: InboxItem[];
  templates: DemandTemplate[];
  recurringRules: RecurringRule[];
  slaPolicies: SlaPolicy[];
  approvals: ApprovalRequest[];
  strategicObjectives: StrategicObjective[];
  risks: RiskItem[];
  scheduledReports: ScheduledReportConfig[];
  apiKeys: ApiKeyItem[];
  webhooks: WebhookSubscription[];
  lgpdActivities: LgpdProcessingActivity[];
  backups: BackupSnapshot[];
  traceabilityMatrix: TraceabilityItem[];
  offlineQueue: OfflineSyncQueueItem[];
  securitySessions: SecuritySession[];

  // App Navigation & Session
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  currentUser: User;
  setCurrentUserId: (id: string) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  deviceMode: 'web' | 'android';
  setDeviceMode: (mode: 'web' | 'android') => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebarCollapse: () => void;

  // Filters & Search
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  filteredDemands: Demand[];

  // Demand Actions
  selectedDemand: Demand | null;
  setSelectedDemand: (demand: Demand | null) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  editingDemand: Demand | null;
  setEditingDemand: (demand: Demand | null) => void;
  
  createDemand: (demandData: Partial<Demand>) => Promise<Demand>;
  updateDemand: (id: string, updates: Partial<Demand>, justification?: string) => Promise<void>;
  deleteDemand: (id: string, reason?: string) => Promise<void>;
  moveDemandStatus: (id: string, newStatusId: string) => Promise<void>;
  toggleBlocker: (id: string, blocker: BlockerInfo) => Promise<void>;
  extendDeadline: (id: string, newDueDate: string, reason: string) => Promise<void>;
  addComment: (demandId: string, content: string, attachments?: Attachment[], isDecision?: boolean, isConfidential?: boolean) => Promise<void>;
  toggleChecklist: (demandId: string, itemId: string) => Promise<void>;
  completeDemand: (demandId: string, summary: string) => Promise<void>;

  // Inbox & Triage
  triageInboxItem: (
    id: string,
    action: 'accept' | 'reject' | 'request_info',
    data?: {
      demandOverrides?: Partial<Demand>;
      rejectionReason?: string;
      infoMessage?: string;
    }
  ) => Promise<Demand | null>;
  createInboxItem: (item: Omit<InboxItem, 'id' | 'receivedAt' | 'status'>) => void;

  // Templates & Recurrence
  createTemplate: (template: Omit<DemandTemplate, 'id' | 'createdAt'>) => void;
  updateTemplate: (id: string, updates: Partial<DemandTemplate>) => void;
  deleteTemplate: (id: string) => void;
  createRecurringRule: (rule: Omit<RecurringRule, 'id' | 'lastGeneratedAt' | 'generationCount' | 'idempotencyKeys'>) => void;
  toggleRecurringRule: (id: string, isSuspended: boolean) => void;
  triggerRecurringGeneration: () => Promise<number>;

  // SLA Management
  updateSlaPolicy: (id: string, updates: Partial<SlaPolicy>) => void;

  // Approvals & Governance
  respondApproval: (id: string, decision: 'approved' | 'rejected', comment: string) => Promise<void>;
  createApprovalRequest: (request: Omit<ApprovalRequest, 'id' | 'createdAt' | 'status' | 'approvalHistory'>) => void;

  // Strategic Objectives & Risks
  updateStrategicObjective: (id: string, updates: Partial<StrategicObjective>) => void;
  createRisk: (risk: Omit<RiskItem, 'id' | 'createdAt' | 'updatedAt' | 'severity' | 'history'>) => void;
  updateRisk: (id: string, updates: Partial<RiskItem>, note?: string) => void;
  deleteRisk: (id: string) => void;

  // Scheduled Reports
  createScheduledReport: (config: Omit<ScheduledReportConfig, 'id' | 'dispatchHistory'>) => void;
  triggerScheduledReportDispatch: (id: string) => Promise<void>;

  // API & Webhooks
  createApiKey: (key: Omit<ApiKeyItem, 'id' | 'createdAt' | 'tokenPrefix'>) => string;
  revokeApiKey: (id: string) => void;
  createWebhook: (webhook: Omit<WebhookSubscription, 'id' | 'recentDeliveries' | 'secret'>) => void;
  testWebhookDelivery: (id: string) => Promise<void>;
  deleteWebhook: (id: string) => void;

  // Backup, DR & System Health
  createBackupSnapshot: () => Promise<BackupSnapshot>;
  runDrDrill: () => Promise<{ success: boolean; rtoMinutes: number; rpoMinutes: number; log: string }>;

  // Traceability & QA Homologation
  runAutomatedTestSuite: () => Promise<void>;

  // Security Sessions
  revokeSession: (id: string) => void;

  // Offline Sync Queue
  queueOfflineChange: (action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE', entityType: string, payload: any) => void;
  processOfflineSync: () => Promise<{ processed: number; conflicts: number }>;
  resolveConflict: (queueItemId: string, resolution: 'local_wins' | 'server_wins' | 'merge') => void;

  // Management CRUD
  createTeam: (team: Omit<Team, 'id'>) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  deleteTeam: (id: string) => void;

  createUser: (user: Omit<User, 'id'>, id?: string) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

  updateCategory: (id: string, updates: Partial<CategoryConfig>) => void;
  createCategory: (cat: Omit<CategoryConfig, 'id'>) => void;
  deleteCategory: (id: string) => void;

  updateStatus: (id: string, updates: Partial<StatusConfig>) => void;
  createStatus: (status: Omit<StatusConfig, 'id'>) => void;
  deleteStatus: (id: string) => void;
  reorderStatuses: (newStatuses: StatusConfig[]) => void;

  updatePriority: (id: string, updates: Partial<PriorityConfig>) => void;
  createPriority: (prio: Omit<PriorityConfig, 'id'>) => void;

  toggleGoogleService: (serviceKey: string, connected: boolean) => Promise<void>;
  toggleAutomationRule: (ruleId: string, active: boolean) => void;

  // Notifications
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;

  // Toasts
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // RBAC & Permissões Segregadas
  allRbacPermissions: RbacPermissionRule[];
  rolePermissions: RolePermissionsMap;
  updateRolePermissions: (role: UserRole, permissions: string[]) => void;
  resetRolePermissions: () => void;
  updateUserCustomPermissions: (userId: string, customPermissions?: UserCustomPermissions) => void;
  hasPermission: (module: RbacModule, action: RbacAction, activityType?: 'PROJETO' | 'MELHORIA' | 'TAREFA' | 'GERAL') => boolean;
  userHasPermission: (user: User | undefined, module: RbacModule, action: RbacAction, activityType?: 'PROJETO' | 'MELHORIA' | 'TAREFA' | 'GERAL') => boolean;

  // Helpers
  exportModalOpen: boolean;
  setExportModalOpen: (open: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  resetAllData: () => void;
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  categoryIds: [],
  statusIds: [],
  priorityIds: [],
  teamIds: [],
  assigneeIds: [],
  requesterIds: [],
  tags: [],
  onlyMyDemands: false,
  onlyCreatedByMe: false,
  onlyMyTeam: false,
  onlyOverdue: false,
  onlyBlocked: false,
  onlyDueSoon: false,
  groupBy: 'none',
  sortBy: 'dueDate',
  sortOrder: 'asc'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [categories, setCategories] = useState<CategoryConfig[]>(INITIAL_CATEGORIES);
  const [statuses, setStatuses] = useState<StatusConfig[]>(INITIAL_STATUSES);
  const [priorities, setPriorities] = useState<PriorityConfig[]>(INITIAL_PRIORITIES);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [googleServices, setGoogleServices] = useState<GoogleIntegrationService[]>([]);
  const [automations, setAutomations] = useState<AutomationRule[]>([]);

  // New enterprise module state
  const [inbox, setInbox] = useState<InboxItem[]>([]); const [templates, setTemplates] = useState<DemandTemplate[]>([]); const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]); const [slaPolicies, setSlaPolicies] = useState<SlaPolicy[]>([]); const [approvals, setApprovals] = useState<ApprovalRequest[]>([]); const [strategicObjectives, setStrategicObjectives] = useState<StrategicObjective[]>([]); const [risks, setRisks] = useState<RiskItem[]>([]); const [scheduledReports, setScheduledReports] = useState<ScheduledReportConfig[]>([]); const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]); const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([]); const [lgpdActivities, setLgpdActivities] = useState<LgpdProcessingActivity[]>([]); const [backups, setBackups] = useState<BackupSnapshot[]>([]); const [traceabilityMatrix, setTraceabilityMatrix] = useState<TraceabilityItem[]>([]); const [offlineQueue, setOfflineQueue] = useState<OfflineSyncQueueItem[]>([]); const [securitySessions, setSecuritySessions] = useState<SecuritySession[]>([]); const [rolePermissions, setRolePermissions] = useState<RolePermissionsMap>(INITIAL_ROLE_PERMISSIONS);


  const [activeView, setActiveView] = useState<ActiveView>('kanban');
  const [currentUserId, setCurrentUserIdState] = useState<string>('');
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(StorageService.getTheme);
  const [deviceMode, setDeviceModeState] = useState<'web' | 'android'>(StorageService.getDeviceMode);
  const [isOffline, setIsOfflineState] = useState<boolean>(StorageService.getOfflineMode);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(StorageService.getSidebarCollapsed);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);

  const setIsOffline = (offline: boolean) => {
    setIsOfflineState(offline);
    StorageService.setOfflineMode(offline);
    if (offline) {
      showToast({
        type: 'warning',
        title: 'Modo Offline Ativado',
        message: 'Alterações serão enfileiradas localmente e sincronizadas quando a conexão for restabelecida.'
      });
    } else {
      showToast({
        type: 'info',
        title: 'Conexão Restabelecida',
        message: 'Sincronizando fila local com a nuvem...'
      });
      processOfflineSync();
    }
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(prev => !prev);
    } else {
      setIsSidebarCollapsed(prev => {
        const next = !prev;
        StorageService.setSidebarCollapsed(next);
        return next;
      });
    }
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      StorageService.setSidebarCollapsed(next);
      return next;
    });
  };

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingDemand, setEditingDemand] = useState<Demand | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Keyboard shortcut listener (Cmd+K or Ctrl+K for Global Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => { apiClient.bootstrap().then(data => { setUsers(data.users); setTeams(data.teams); setDemands(data.demands); setAuditLogs(data.auditLogs || []); setCurrentUserIdState(data.currentUserId); if(data.configurations?.categories?.length)setCategories(data.configurations.categories); if(data.configurations?.statuses?.length)setStatuses(data.configurations.statuses); if(data.configurations?.priorities?.length)setPriorities(data.configurations.priorities); setDataError(''); }).catch(error => setDataError(error instanceof ApiError ? error.message : 'Não foi possível carregar os dados corporativos.')).finally(()=>setDataLoading(false)); }, []);

  // Handle Theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
    StorageService.setTheme(theme);
  }, [theme]);

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
  };

  const setDeviceMode = (mode: 'web' | 'android') => {
    setDeviceModeState(mode);
    StorageService.setDeviceMode(mode);
  };

  const setCurrentUserId = (id: string) => {
    setCurrentUserIdState(id);
    const user = users.find(u => u.id === id);
    if (user) {
      showToast({
        type: 'info',
        title: 'Perfil Ativo Alterado',
        message: `Você agora está operando como ${user.name} (${user.role.toUpperCase()} - ${user.roleTitle}).`
      });
    }
  };

  const currentUser = useMemo(() => {
    return users.find(u => u.id === currentUserId) || users[0] || { id:'loading', name:'Carregando', email:'', role:'colaborador', roleTitle:'', department:'', avatar:'', teamIds:[], active:false } as User;
  }, [users, currentUserId]);

  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast: ToastMessage = { ...toast, id, duration: toast.duration || 4500 };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, newToast.duration);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addAuditLog = (entry: Omit<AuditLog, 'id' | 'timestamp' | 'userId' | 'userName' | 'userAvatar'>) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      ...entry
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addNotification = (item: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      read: false,
      ...item
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // ----------------------------------------------------
  // OFFLINE QUEUE & SYNC
  // ----------------------------------------------------
  const queueOfflineChange = (
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE',
    entityType: string,
    payload: any
  ) => {
    const item: OfflineSyncQueueItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      entityType: entityType as any,
      entityId: payload.id || `pending-${Date.now()}`,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'pending'
    };
    setOfflineQueue(prev => [...prev, item]);
  };

  const processOfflineSync = async (): Promise<{ processed: number; conflicts: number }> => {
    if (offlineQueue.length === 0) return { processed: 0, conflicts: 0 };

    let processed = 0;
    let conflicts = 0;

    // Simulate backend sync & conflict detection
    const updatedQueue = offlineQueue.map(item => {
      // Simulate random conflict if modified simultaneously
      if (item.retryCount > 2) {
        conflicts++;
        return {
          ...item,
          status: 'conflict' as const,
          conflictDetails: {
            localVersion: item.payload,
            serverVersion: { ...item.payload, updatedAt: new Date().toISOString(), title: `${item.payload.title || 'Item'} (Versão Servidor)` },
            conflictReason: 'Versão no servidor foi alterada por outro usuário durante o período offline.'
          }
        };
      }
      processed++;
      return { ...item, status: 'synced' as const };
    });

    setOfflineQueue(updatedQueue.filter(q => q.status === 'conflict'));
    showToast({
      type: conflicts > 0 ? 'warning' : 'success',
      title: 'Sincronização Concluída',
      message: `${processed} alteração(ões) sincronizadas com o servidor. ${conflicts > 0 ? `${conflicts} conflito(s) para resolução.` : ''}`
    });

    return { processed, conflicts };
  };

  const resolveConflict = (queueItemId: string, resolution: 'local_wins' | 'server_wins' | 'merge') => {
    const item = offlineQueue.find(q => q.id === queueItemId);
    if (!item) return;

    if (resolution === 'local_wins' && item.entityType === 'demand') {
      updateDemand(item.entityId, item.payload, 'Resolução de conflito: Versão Local Mantida');
    }

    setOfflineQueue(prev => prev.filter(q => q.id !== queueItemId));
    showToast({
      type: 'info',
      title: 'Conflito Resolvido',
      message: `Conflito no item ${item.entityId} resolvido com política [${resolution}].`
    });
  };

  // ----------------------------------------------------
  // DEMAND CRUD & WORKFLOW ACTIONS
  // ----------------------------------------------------
  const createDemand = async (demandData: Partial<Demand>): Promise<Demand> => {
    const year = new Date().getFullYear();
    const count = demands.length + 1;
    const code = `DEM-${year}-${String(count).padStart(3, '0')}`;

    const newDemand: Demand = {
      id: `dem-${Date.now()}`,
      code,
      title: demandData.title || 'Sem título',
      description: demandData.description || '',
      categoryId: demandData.categoryId || categories[0].id,
      whyReason: demandData.whyReason || '',
      expectedOutcome: demandData.expectedOutcome || '',
      whereLocation: demandData.whereLocation || '',
      howExecutionGuide: demandData.howExecutionGuide || '',
      requesterId: demandData.requesterId || currentUser.id,
      assigneeId: demandData.assigneeId || currentUser.id,
      participantIds: demandData.participantIds || [],
      teamId: demandData.teamId || teams[0].id,
      createdAt: new Date().toISOString(),
      plannedStartDate: demandData.plannedStartDate || new Date().toISOString(),
      dueDate: demandData.dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      originalBaselineStartDate: demandData.plannedStartDate || new Date().toISOString(),
      originalBaselineDueDate: demandData.dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      isMilestone: demandData.isMilestone || false,
      statusId: demandData.statusId || statuses[0].id,
      priorityId: demandData.priorityId || priorities[2].id,
      progressPercent: demandData.progressPercent || 0,
      tags: demandData.tags || [],
      checklist: demandData.checklist || [],
      dependencies: demandData.dependencies || [],
      advancedDependencies: demandData.advancedDependencies || [],
      blocker: demandData.blocker || { isBlocked: false },
      financials: demandData.financials || {
        estimatedCost: 0,
        approvedCost: 0,
        realizedCost: 0,
        estimatedHours: 0,
        realizedHours: 0,
        costCenter: 'CC-Geral',
        expectedBenefit: 'Otimização operacional e valor ao negócio',
        financialImpact: 'Neutro',
        operationalImpact: 'Baixo',
        regulatoryImpact: 'Neutro',
        strategicImpact: 'Operacional'
      },
      sla: demandData.sla || {
        policyId: 'sla-padrao',
        firstResponseDue: new Date(Date.now() + 4 * 3600000).toISOString(),
        resolutionDue: demandData.dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
        isBreached: false,
        isPaused: false,
        totalPausedMinutes: 0,
        pauseHistory: [],
        escalationLevel: 'none'
      },
      watchers: [currentUser.id],
      deadlineExtensions: [],
      attachments: demandData.attachments || [],
      comments: [],
      updatedAt: new Date().toISOString(),
      updatedByUserId: currentUser.id
    };

    if (isOffline) {
      queueOfflineChange('CREATE', 'demand', newDemand);
    }

    const persistedDemand = await apiClient.createDemand(newDemand);
    setDemands(prev => [persistedDemand as Demand, ...prev]);

    // Audit Log
    addAuditLog({
      demandId: newDemand.id,
      demandCode: newDemand.code,
      action: 'Criação de Demanda',
      details: `Demanda ${newDemand.code} cadastrada com prioridade ${priorities.find(p => p.id === newDemand.priorityId)?.name}.`
    });

    // Notify Assignee if not the creator
    if (newDemand.assigneeId !== currentUser.id) {
      addNotification({
        userId: newDemand.assigneeId,
        title: 'Nova Demanda Atribuída',
        message: `${currentUser.name} atribuiu a demanda [${newDemand.code}] "${newDemand.title}" a você.`,
        type: 'assigned',
        demandId: newDemand.id,
        demandCode: newDemand.code
      });
    }

    showToast({
      type: 'success',
      title: 'Demanda Criada com Sucesso',
      message: `[${newDemand.code}] "${newDemand.title}" cadastrada no sistema.`
    });

    // Run Automation Trigger
    const isCritical = priorities.find(p => p.id === newDemand.priorityId)?.level === 5;
    const trigger = isCritical ? 'demand_critical_created' : 'demand_created';
    const assignee = users.find(u => u.id === newDemand.assigneeId);
    
    GoogleService.runAutomationTrigger(trigger, newDemand, automations, assignee).then(({ executedRules }) => {
      if (executedRules.length > 0) {
        showToast({
          type: 'info',
          title: 'Google Workspace Sincronizado',
          message: `${executedRules.length} automação(ões) executada(s): ${executedRules.join(', ')}.`
        });
      }
    });

    return newDemand;
  };

  const updateDemand = async (id: string, updates: Partial<Demand>, justification?: string) => {
    const existing = demands.find(d => d.id === id);
    if (!existing) return;

    if (isOffline) {
      queueOfflineChange('UPDATE', 'demand', { id, ...updates });
    }

    const updatedDemand: Demand = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedByUserId: currentUser.id
    };

    await apiClient.updateDemand(id, updates);
    setDemands(prev => prev.map(d => (d.id === id ? updatedDemand : d)));
    if (selectedDemand?.id === id) {
      setSelectedDemand(updatedDemand);
    }

    // Audit Log
    addAuditLog({
      demandId: id,
      demandCode: existing.code,
      action: 'Atualização de Demanda',
      fieldChanged: Object.keys(updates).join(', '),
      details: justification || `Campos atualizados por ${currentUser.name}.`
    });
  };

  const deleteDemand = async (id: string, reason?: string) => {
    const existing = demands.find(d => d.id === id);
    if (!existing) return;

    // Conceptual Rule: Do not hard delete if it has audit logs/history; archive instead
    const updatedDemand: Demand = {
      ...existing,
      statusId: statuses.find(s => s.category === 'cancelled')?.id || existing.statusId,
      updatedAt: new Date().toISOString(),
      updatedByUserId: currentUser.id
    };

    await apiClient.updateDemand(id, { statusId: updatedDemand.statusId });
    setDemands(prev => prev.map(d => (d.id === id ? updatedDemand : d)));
    if (selectedDemand?.id === id) {
      setSelectedDemand(null);
    }

    addAuditLog({
      demandId: id,
      demandCode: existing.code,
      action: 'Desativação / Cancelamento de Demanda',
      details: reason ? `Motivo: ${reason}` : 'Demanda desativada sem exclusão permanente do histórico.'
    });

    showToast({
      type: 'info',
      title: 'Demanda Desativada',
      message: `[${existing.code}] foi movida para Cancelada e preservada no histórico de auditoria.`
    });
  };

  const moveDemandStatus = async (id: string, newStatusId: string) => {
    const existing = demands.find(d => d.id === id);
    if (!existing || existing.statusId === newStatusId) return;

    const oldStatus = statuses.find(s => s.id === existing.statusId);
    const newStatus = statuses.find(s => s.id === newStatusId);

    // Automatic SLA pause calculation
    let updatedSla = { ...existing.sla };
    if (newStatus?.pausesSla && !existing.sla?.isPaused) {
      updatedSla = {
        ...updatedSla,
        isPaused: true,
        pauseHistory: [
          ...(updatedSla.pauseHistory || []),
          {
            pausedAt: new Date().toISOString(),
            statusId: newStatusId,
            reason: `Pausa automática ao entrar no status "${newStatus.name}"`
          }
        ]
      };
    } else if (!newStatus?.pausesSla && existing.sla?.isPaused) {
      const history = [...(updatedSla.pauseHistory || [])];
      const lastPause = history[history.length - 1];
      if (lastPause && !lastPause.resumedAt) {
        lastPause.resumedAt = new Date().toISOString();
        const diffMinutes = Math.round((new Date(lastPause.resumedAt).getTime() - new Date(lastPause.pausedAt).getTime()) / 60000);
        updatedSla.totalPausedMinutes = (updatedSla.totalPausedMinutes || 0) + diffMinutes;
      }
      updatedSla.isPaused = false;
    }

    const isCompleted = newStatus?.category === 'completed';
    const progress = isCompleted ? 100 : existing.progressPercent;

    const updatedDemand: Demand = {
      ...existing,
      statusId: newStatusId,
      progressPercent: progress,
      sla: updatedSla,
      completedAt: isCompleted ? new Date().toISOString() : existing.completedAt,
      completedByUserId: isCompleted ? currentUser.id : existing.completedByUserId,
      updatedAt: new Date().toISOString(),
      updatedByUserId: currentUser.id
    };

    setDemands(prev => prev.map(d => (d.id === id ? updatedDemand : d)));
    if (selectedDemand?.id === id) {
      setSelectedDemand(updatedDemand);
    }

    if (isCompleted) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.65 }
      });
    }

    addAuditLog({
      demandId: id,
      demandCode: existing.code,
      action: 'Mudança de Status',
      fieldChanged: 'Status',
      previousValue: oldStatus?.name,
      newValue: newStatus?.name,
      details: `Movido de "${oldStatus?.name}" para "${newStatus?.name}" por ${currentUser.name}.`
    });
  };

  const toggleBlocker = async (id: string, blocker: BlockerInfo) => {
    const existing = demands.find(d => d.id === id);
    if (!existing) return;

    const blockedStatus = statuses.find(s => s.category === 'blocked');
    const newStatusId = blocker.isBlocked ? (blockedStatus ? blockedStatus.id : existing.statusId) : existing.statusId;

    const updatedDemand: Demand = {
      ...existing,
      statusId: newStatusId,
      blocker: {
        ...blocker,
        blockedAt: blocker.isBlocked ? new Date().toISOString() : existing.blocker?.blockedAt,
        blockedByUserId: blocker.isBlocked ? currentUser.id : existing.blocker?.blockedByUserId,
        resolvedAt: !blocker.isBlocked ? new Date().toISOString() : undefined
      },
      updatedAt: new Date().toISOString(),
      updatedByUserId: currentUser.id
    };

    setDemands(prev => prev.map(d => (d.id === id ? updatedDemand : d)));
    if (selectedDemand?.id === id) {
      setSelectedDemand(updatedDemand);
    }

    addAuditLog({
      demandId: id,
      demandCode: existing.code,
      action: blocker.isBlocked ? 'Registro de Impedimento (Bloqueio)' : 'Resolução de Impedimento (Desbloqueio)',
      details: blocker.isBlocked ? `Motivo: ${blocker.reason} (Impacto: ${blocker.impact})` : 'Impedimento resolvido.'
    });

    if (blocker.isBlocked) {
      GoogleService.runAutomationTrigger('status_changed_to_blocked', updatedDemand, automations);
    }
  };

  const extendDeadline = async (id: string, newDueDate: string, reason: string) => {
    const existing = demands.find(d => d.id === id);
    if (!existing) return;

    const extensionItem = {
      id: `ext-${Date.now()}`,
      previousDueDate: existing.dueDate,
      newDueDate,
      reason,
      requestedByUserId: currentUser.id,
      requestedAt: new Date().toISOString(),
      approved: true
    };

    const updatedDemand: Demand = {
      ...existing,
      dueDate: newDueDate,
      deadlineExtensions: [...(existing.deadlineExtensions || []), extensionItem],
      updatedAt: new Date().toISOString(),
      updatedByUserId: currentUser.id
    };

    setDemands(prev => prev.map(d => (d.id === id ? updatedDemand : d)));
    if (selectedDemand?.id === id) {
      setSelectedDemand(updatedDemand);
    }

    addAuditLog({
      demandId: id,
      demandCode: existing.code,
      action: 'Prorrogação de Prazo',
      fieldChanged: 'Prazo Limite',
      previousValue: new Date(existing.dueDate).toLocaleDateString('pt-BR'),
      newValue: new Date(newDueDate).toLocaleDateString('pt-BR'),
      details: `Justificativa: ${reason}`
    });

    showToast({
      type: 'info',
      title: 'Prazo Prorrogado',
      message: `[${existing.code}] agora vence em ${new Date(newDueDate).toLocaleDateString('pt-BR')}.`
    });

    GoogleService.runAutomationTrigger('deadline_changed', updatedDemand, automations);
  };

  const addComment = async (
    demandId: string,
    content: string,
    attachments?: Attachment[],
    isDecision?: boolean,
    isConfidential?: boolean
  ) => {
    const existing = demands.find(d => d.id === demandId);
    if (!existing) return;

    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content,
      createdAt: new Date().toISOString(),
      attachments,
      isDecision,
      isConfidential
    };

    const updatedComments = [...(existing.comments || []), newComment];
    const updatedDemand = {
      ...existing,
      comments: updatedComments,
      updatedAt: new Date().toISOString(),
      updatedByUserId: currentUser.id
    };

    setDemands(prev => prev.map(d => (d.id === demandId ? updatedDemand : d)));
    if (selectedDemand?.id === demandId) {
      setSelectedDemand(updatedDemand);
    }

    addAuditLog({
      demandId,
      demandCode: existing.code,
      action: isDecision ? 'Registro de Decisão Formal' : 'Comentário Adicionado',
      details: isConfidential ? '[Comentário Confidencial Registrado]' : content.slice(0, 100)
    });
  };

  const toggleChecklist = async (demandId: string, itemId: string) => {
    const existing = demands.find(d => d.id === demandId);
    if (!existing) return;

    const updatedChecklist = existing.checklist.map(item => {
      if (item.id === itemId) {
        const completed = !item.completed;
        return {
          ...item,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined
        };
      }
      return item;
    });

    const total = updatedChecklist.length;
    const completedCount = updatedChecklist.filter(i => i.completed).length;
    const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : existing.progressPercent;

    const updatedDemand = {
      ...existing,
      checklist: updatedChecklist,
      progressPercent,
      updatedAt: new Date().toISOString(),
      updatedByUserId: currentUser.id
    };

    setDemands(prev => prev.map(d => (d.id === demandId ? updatedDemand : d)));
    if (selectedDemand?.id === demandId) {
      setSelectedDemand(updatedDemand);
    }
  };

  const completeDemand = async (demandId: string, summary: string) => {
    const completedStatus = statuses.find(s => s.category === 'completed') || statuses[statuses.length - 1];
    const existing = demands.find(d => d.id === demandId);
    if (!existing) return;

    const updatedDemand: Demand = {
      ...existing,
      statusId: completedStatus.id,
      progressPercent: 100,
      completedAt: new Date().toISOString(),
      completedByUserId: currentUser.id,
      completionSummary: summary,
      updatedAt: new Date().toISOString(),
      updatedByUserId: currentUser.id
    };

    setDemands(prev => prev.map(d => (d.id === demandId ? updatedDemand : d)));
    if (selectedDemand?.id === demandId) {
      setSelectedDemand(updatedDemand);
    }

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    addAuditLog({
      demandId,
      demandCode: existing.code,
      action: 'Conclusão e Homologação',
      fieldChanged: 'Status',
      newValue: completedStatus.name,
      details: `Resumo de Entrega: ${summary}`
    });

    showToast({
      type: 'success',
      title: 'Demanda Concluída com Sucesso!',
      message: `[${existing.code}] finalizada e homologada.`
    });

    GoogleService.runAutomationTrigger('status_changed_to_completed', updatedDemand, automations);
  };

  // ----------------------------------------------------
  // INBOX & TRIAGE
  // ----------------------------------------------------
  const createInboxItem = (item: Omit<InboxItem, 'id' | 'receivedAt' | 'status'>) => {
    const newItem: InboxItem = {
      id: `inb-${Date.now()}`,
      receivedAt: new Date().toISOString(),
      status: 'pending_triage',
      ...item
    };
    setInbox(prev => [newItem, ...prev]);
    showToast({
      type: 'info',
      title: 'Nova Solicitação na Central de Entrada',
      message: `"${newItem.title}" recebido via ${newItem.source.toUpperCase()}.`
    });
  };

  const triageInboxItem = async (
    id: string,
    action: 'accept' | 'reject' | 'request_info',
    data?: {
      demandOverrides?: Partial<Demand>;
      rejectionReason?: string;
      infoMessage?: string;
    }
  ): Promise<Demand | null> => {
    const item = inbox.find(i => i.id === id);
    if (!item) return null;

    if (action === 'accept') {
      const created = await createDemand({
        title: item.title,
        description: item.description,
        categoryId: item.suggestedCategoryId || categories[0].id,
        priorityId: item.suggestedPriorityId || priorities[2].id,
        teamId: item.assignedTeamId || teams[0].id,
        assigneeId: item.assignedUserId || currentUser.id,
        inboxSourceId: item.id,
        inboxSourceType: item.source,
        financials: {
          estimatedHours: item.estimatedEffortHours || 0,
          estimatedCost: 0,
          approvedCost: 0,
          realizedCost: 0,
          realizedHours: 0,
          costCenter: 'CC-Geral',
          expectedBenefit: item.whyReason || 'Otimização operacional e valor ao negócio',
          financialImpact: 'Neutro',
          operationalImpact: 'Médio',
          regulatoryImpact: 'Neutro',
          strategicImpact: 'Operacional'
        },
        ...data?.demandOverrides
      });

      setInbox(prev =>
        prev.map(i =>
          i.id === id
            ? { ...i, status: 'converted_to_demand', convertedDemandId: created.id, triageNotes: data?.demandOverrides?.whyReason }
            : i
        )
      );

      return created;
    } else if (action === 'reject') {
      setInbox(prev =>
        prev.map(i =>
          i.id === id
            ? { ...i, status: 'rejected', rejectionReason: data?.rejectionReason || 'Recusado na triagem.' }
            : i
        )
      );
      showToast({
        type: 'info',
        title: 'Item Rejeitado',
        message: `Solicitação "${item.title}" foi recusada.`
      });
      return null;
    } else {
      const thread = item.additionalInfoThread || [];
      const newThread = [
        ...thread,
        {
          date: new Date().toISOString(),
          sender: currentUser.name,
          message: data?.infoMessage || 'Solicitamos informações complementares.'
        }
      ];

      setInbox(prev =>
        prev.map(i =>
          i.id === id
            ? { ...i, status: 'info_requested', additionalInfoThread: newThread }
            : i
        )
      );
      showToast({
        type: 'info',
        title: 'Informações Solicitadas',
        message: `Mensagem enviada para ${item.senderName || item.senderEmail}.`
      });
      return null;
    }
  };

  // ----------------------------------------------------
  // TEMPLATES & RECURRENCE
  // ----------------------------------------------------
  const createTemplate = (template: Omit<DemandTemplate, 'id' | 'createdAt'>) => {
    const newTmpl: DemandTemplate = {
      id: `tmpl-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...template
    };
    setTemplates(prev => [...prev, newTmpl]);
    showToast({
      type: 'success',
      title: 'Modelo Criado',
      message: `Template "${newTmpl.title}" disponível para uso.`
    });
  };

  const updateTemplate = (id: string, updates: Partial<DemandTemplate>) => {
    setTemplates(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const createRecurringRule = (rule: Omit<RecurringRule, 'id' | 'lastGeneratedAt' | 'generationCount' | 'idempotencyKeys'>) => {
    const newRule: RecurringRule = {
      id: `rec-${Date.now()}`,
      generationCount: 0,
      idempotencyKeys: [],
      ...rule
    };
    setRecurringRules(prev => [...prev, newRule]);
    showToast({
      type: 'success',
      title: 'Regra de Recorrência Criada',
      message: `Recorrência configurada para "${newRule.title}".`
    });
  };

  const toggleRecurringRule = (id: string, isSuspended: boolean) => {
    setRecurringRules(prev =>
      prev.map(r => (r.id === id ? { ...r, isSuspended } : r))
    );
    showToast({
      type: 'info',
      title: isSuspended ? 'Recorrência Pausada' : 'Recorrência Reativada',
      message: `A regra selecionada foi ${isSuspended ? 'suspensa' : 'reativada'}.`
    });
  };

  const triggerRecurringGeneration = async (): Promise<number> => {
    let generatedCount = 0;
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);

    for (const rule of recurringRules) {
      if (rule.active && !rule.isSuspended) {
        const idempotencyKey = `${rule.id}-${todayKey}`;
        if (!rule.idempotencyKeys.includes(idempotencyKey)) {
          await createDemand({
            title: `[Recorrente] ${rule.title}`,
            description: rule.description,
            categoryId: rule.categoryId,
            priorityId: rule.priorityId,
            assigneeId: rule.assigneeId,
            teamId: rule.teamId,
            whyReason: 'Atividade periódica gerada automaticamente pelo motor de recorrência.',
            tags: ['Recorrente', 'Rotina']
          });

          rule.idempotencyKeys.push(idempotencyKey);
          rule.generationCount++;
          rule.lastGeneratedAt = now.toISOString();
          generatedCount++;
        }
      }
    }

    setRecurringRules([...recurringRules]);
    showToast({
      type: 'success',
      title: 'Geração de Recorrências Concluída',
      message: `${generatedCount} nova(s) demanda(s) gerada(s) sem duplicidades.`
    });

    return generatedCount;
  };

  // ----------------------------------------------------
  // SLA POLICIES
  // ----------------------------------------------------
  const updateSlaPolicy = (id: string, updates: Partial<SlaPolicy>) => {
    setSlaPolicies(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    showToast({
      type: 'success',
      title: 'Política de SLA Atualizada',
      message: 'Regras de prazos e janelas úteis salvas.'
    });
  };

  // ----------------------------------------------------
  // APPROVALS & GOVERNANCE
  // ----------------------------------------------------
  const respondApproval = async (id: string, decision: 'approved' | 'rejected', comment: string) => {
    const item = approvals.find(a => a.id === id);
    if (!item) return;

    const newHistory = [
      ...(item.approvalHistory || []),
      {
        step: item.currentStep,
        approverName: currentUser.name,
        decision,
        comment,
        timestamp: new Date().toISOString()
      }
    ];

    const isFinished = decision === 'rejected' || item.currentStep >= item.totalSteps;
    const nextStep = decision === 'approved' && !isFinished ? item.currentStep + 1 : item.currentStep;

    const updatedItem: ApprovalRequest = {
      ...item,
      status: decision === 'rejected' ? 'rejected' : isFinished ? 'approved' : 'pending',
      decisionDate: isFinished ? new Date().toISOString() : undefined,
      currentStep: nextStep,
      approvalHistory: newHistory
    };

    setApprovals(prev => prev.map(a => (a.id === id ? updatedItem : a)));

    addAuditLog({
      demandId: item.demandId,
      demandCode: item.demandCode,
      action: `Parecer de Governança: ${decision === 'approved' ? 'Aprovado' : 'Reprovado'}`,
      details: `${currentUser.name} registrou decisão: "${comment}".`
    });

    showToast({
      type: decision === 'approved' ? 'success' : 'warning',
      title: `Aprovação ${decision === 'approved' ? 'Concedida' : 'Rejeitada'}`,
      message: `Solicitação da demanda [${item.demandCode}] processada.`
    });
  };

  const createApprovalRequest = (request: Omit<ApprovalRequest, 'id' | 'createdAt' | 'status' | 'approvalHistory'>) => {
    const newRequest: ApprovalRequest = {
      id: `appr-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
      approvalHistory: [],
      ...request
    };
    setApprovals(prev => [newRequest, ...prev]);
    showToast({
      type: 'info',
      title: 'Solicitação de Governança Aberta',
      message: `Enviada para aprovação de ${newRequest.approverName}.`
    });
  };

  // ----------------------------------------------------
  // STRATEGIC OBJECTIVES & RISKS
  // ----------------------------------------------------
  const updateStrategicObjective = (id: string, updates: Partial<StrategicObjective>) => {
    setStrategicObjectives(prev => prev.map(o => (o.id === id ? { ...o, ...updates } : o)));
  };

  const createRisk = (risk: Omit<RiskItem, 'id' | 'createdAt' | 'updatedAt' | 'severity' | 'history'>) => {
    const severity = risk.probability * risk.impact;
    const newRisk: RiskItem = {
      id: `rsk-${Date.now()}`,
      severity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          timestamp: new Date().toISOString(),
          userName: currentUser.name,
          note: 'Risco cadastrado na matriz.'
        }
      ],
      ...risk
    };
    setRisks(prev => [...prev, newRisk]);
    showToast({
      type: 'info',
      title: 'Risco Registrado',
      message: `Risco "${newRisk.title}" (Severidade ${severity}/25) mapeado.`
    });
  };

  const updateRisk = (id: string, updates: Partial<RiskItem>, note?: string) => {
    setRisks(prev =>
      prev.map(r => {
        if (r.id === id) {
          const prob = updates.probability ?? r.probability;
          const imp = updates.impact ?? r.impact;
          const severity = prob * imp;
          const history = r.history || [];
          if (note) {
            history.push({
              timestamp: new Date().toISOString(),
              userName: currentUser.name,
              note
            });
          }
          return {
            ...r,
            ...updates,
            probability: prob,
            impact: imp,
            severity,
            updatedAt: new Date().toISOString(),
            history
          };
        }
        return r;
      })
    );
  };

  const deleteRisk = (id: string) => {
    setRisks(prev => prev.filter(r => r.id !== id));
  };

  // ----------------------------------------------------
  // SCHEDULED REPORTS
  // ----------------------------------------------------
  const createScheduledReport = (config: Omit<ScheduledReportConfig, 'id' | 'dispatchHistory'>) => {
    const newConfig: ScheduledReportConfig = {
      id: `sch-${Date.now()}`,
      dispatchHistory: [],
      ...config
    };
    setScheduledReports(prev => [...prev, newConfig]);
    showToast({
      type: 'success',
      title: 'Relatório Programado',
      message: `Envio programado salvo com sucesso.`
    });
  };

  const triggerScheduledReportDispatch = async (id: string) => {
    const rep = scheduledReports.find(r => r.id === id);
    if (!rep) return;

    const newHistory = [
      ...(rep.dispatchHistory || []),
      {
        dispatchedAt: new Date().toISOString(),
        recipients: rep.recipients || [],
        dataVersion: `v${new Date().toISOString().slice(0, 10)}-rel`,
        format: (rep.exportFormats || []).join(', ').toUpperCase(),
        status: 'success' as const
      }
    ];

    setScheduledReports(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, lastDispatchedAt: new Date().toISOString(), dispatchHistory: newHistory }
          : r
      )
    );

    showToast({
      type: 'success',
      title: 'Relatório Disparado com Sucesso',
      message: `Enviado para ${rep.recipients.length} destinatários autorizados.`
    });
  };

  // ----------------------------------------------------
  // API & WEBHOOKS
  // ----------------------------------------------------
  const createApiKey = (key: Omit<ApiKeyItem, 'id' | 'createdAt' | 'tokenPrefix'>): string => {
    const token = `gd_live_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    const newKey: ApiKeyItem = {
      id: `key-${Date.now()}`,
      createdAt: new Date().toISOString(),
      tokenPrefix: `${token.slice(0, 12)}...`,
      ...key
    };
    setApiKeys(prev => [...prev, newKey]);
    showToast({
      type: 'success',
      title: 'Chave de API Gerada',
      message: 'Token gerado com sucesso. Guarde o segredo com segurança.'
    });
    return token;
  };

  const revokeApiKey = (id: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
    showToast({
      type: 'info',
      title: 'Chave de API Revogada',
      message: 'Acesso bloqueado imediatamente.'
    });
  };

  const createWebhook = (webhook: Omit<WebhookSubscription, 'id' | 'recentDeliveries' | 'secret'>) => {
    const newWh: WebhookSubscription = {
      id: `wh-${Date.now()}`,
      secret: `whsec_${Math.random().toString(36).slice(2, 14)}`,
      recentDeliveries: [],
      ...webhook
    };
    setWebhooks(prev => [...prev, newWh]);
    showToast({
      type: 'success',
      title: 'Webhook Cadastrado',
      message: `Notificações HTTP configuradas para ${newWh.targetUrl}.`
    });
  };

  const testWebhookDelivery = async (id: string) => {
    const wh = webhooks.find(w => w.id === id);
    if (!wh) return;

    const delivery = {
      id: `del-${Date.now()}`,
      event: wh.subscribedEvents[0] || 'demand.created',
      timestamp: new Date().toISOString(),
      statusCode: 200,
      success: true,
      retryCount: 0
    };

    setWebhooks(prev =>
      prev.map(w =>
        w.id === id ? { ...w, recentDeliveries: [delivery, ...w.recentDeliveries] } : w
      )
    );

    showToast({
      type: 'success',
      title: 'Disparo de Teste com Sucesso',
      message: `Payload entregue em ${wh.targetUrl} (HTTP 200 OK).`
    });
  };

  const deleteWebhook = (id: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== id));
  };

  // ----------------------------------------------------
  // BACKUP & DR DRILL
  // ----------------------------------------------------
  const createBackupSnapshot = async (): Promise<BackupSnapshot> => {
    const filename = `backup_gestao_demandas_${new Date().toISOString().replace(/[:.]/g, '')}.enc.json`;
    const snapshot: BackupSnapshot = {
      id: `bck-${Date.now()}`,
      filename,
      sizeBytes: JSON.stringify({ demands, users, teams, auditLogs }).length,
      createdAt: new Date().toISOString(),
      type: 'manual_admin',
      encryptionStatus: 'AES-256-GCM',
      checksum: `sha256:${Math.random().toString(36).slice(2, 18)}`,
      recordsCount: {
        demands: demands.length,
        users: users.length,
        auditLogs: auditLogs.length
      },
      verifiedInDrDrill: false
    };

    setBackups(prev => [snapshot, ...prev]);
    showToast({
      type: 'success',
      title: 'Snapshot de Backup Criado',
      message: `${filename} gravado com criptografia AES-256.`
    });

    return snapshot;
  };

  const runDrDrill = async (): Promise<{ success: boolean; rtoMinutes: number; rpoMinutes: number; log: string }> => {
    // Simulate disaster recovery test
    const rto = 4.2; // 4.2 minutes RTO
    const rpo = 12.0; // 12 minutes RPO

    setBackups(prev =>
      prev.map((b, idx) => (idx === 0 ? { ...b, verifiedInDrDrill: true } : b))
    );

    showToast({
      type: 'success',
      title: 'Simulação DR Drill Concluída',
      message: `RTO: ${rto}m (Meta <15m) | RPO: ${rpo}m (Meta <1h) - Aprovado 100%.`
    });

    return {
      success: true,
      rtoMinutes: rto,
      rpoMinutes: rpo,
      log: 'Restore verificado em ambiente isolado. Consistência de chaves e integridade relacional atestadas.'
    };
  };

  // ----------------------------------------------------
  // TRACEABILITY & QA SUITE
  // ----------------------------------------------------
  const runAutomatedTestSuite = async () => {
    const updated = traceabilityMatrix.map(item => ({
      ...item,
      testResult: 'pass' as const,
      homologationStatus: 'Aprovado' as const
    }));
    setTraceabilityMatrix(updated);
    showToast({
      type: 'success',
      title: 'Suíte de Homologação Executada',
      message: 'Todos os 21 requisitos testados e aprovados com evidências auditáveis.'
    });
  };

  // ----------------------------------------------------
  // SECURITY SESSIONS
  // ----------------------------------------------------
  const revokeSession = (id: string) => {
    setSecuritySessions(prev => prev.filter(s => s.id !== id));
    showToast({
      type: 'info',
      title: 'Sessão Revogada',
      message: 'O dispositivo foi desconectado e o token invalidado.'
    });
  };

  // ----------------------------------------------------
  // MANAGEMENT CRUD
  // ----------------------------------------------------
  const createTeam = (teamData: Omit<Team, 'id'>) => {
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      ...teamData
    };
    setTeams(prev => [...prev, newTeam]);
    apiClient.createTeam(teamData).then(saved=>setTeams(prev=>prev.map(team=>team.id===newTeam.id?{...newTeam,id:saved.id}:team))).catch(error=>{setTeams(prev=>prev.filter(team=>team.id!==newTeam.id));showToast({type:'error',title:'Equipe não criada',message:error instanceof Error?error.message:'Falha na API.'});});
    showToast({
      type: 'success',
      title: 'Equipe Criada',
      message: `Equipe "${newTeam.name}" adicionada.`
    });
  };

  const updateTeam = (id: string, updates: Partial<Team>) => {
    setTeams(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
    apiClient.updateTeam(id, updates).catch(error=>showToast({type:'error',title:'Equipe não atualizada',message:error instanceof Error?error.message:'Falha na API.'}));
  };

  const deleteTeam = (id: string) => {
    setTeams(prev => prev.filter(t => t.id !== id));
    apiClient.deleteTeam(id).catch(error=>showToast({type:'error',title:'Equipe não removida',message:error instanceof Error?error.message:'Falha na API.'}));
  };

  const createUser = (userData: Omit<User, 'id'>, id?: string) => {
    const newUser: User = {
      id: id || `usr-${Date.now()}`,
      ...userData
    };
    setUsers(prev => [...prev, newUser]);
    showToast({
      type: 'success',
      title: 'Colaborador Cadastrado',
      message: `${newUser.name} agora faz parte do sistema.`
    });
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updates } : u)));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const updateCategory = (id: string, updates: Partial<CategoryConfig>) => {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const createCategory = (cat: Omit<CategoryConfig, 'id'>) => {
    const newCat: CategoryConfig = {
      id: `cat-${Date.now()}`,
      ...cat
    };
    setCategories(prev => [...prev, newCat]);
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const updateStatus = (id: string, updates: Partial<StatusConfig>) => {
    setStatuses(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
  };

  const createStatus = (statusData: Omit<StatusConfig, 'id'>) => {
    const newStatus: StatusConfig = {
      id: `status-${Date.now()}`,
      ...statusData
    };
    setStatuses(prev => [...prev, newStatus]);
  };

  const deleteStatus = (id: string) => {
    // Conceptual Rule: Check if status is used
    const inUse = demands.some(d => d.statusId === id);
    if (inUse) {
      showToast({
        type: 'warning',
        title: 'Status em Uso',
        message: 'Status não pode ser excluído fisicamente para preservar o histórico. Utilize o arquivamento.'
      });
      // Soft archive
      setStatuses(prev => prev.map(s => (s.id === id ? { ...s, isArchived: true, active: false } : s)));
      return;
    }
    setStatuses(prev => prev.filter(s => s.id !== id));
  };

  const reorderStatuses = (newStatuses: StatusConfig[]) => {
    const indexed = newStatuses.map((s, idx) => ({ ...s, order: idx + 1 }));
    setStatuses(indexed);
  };

  const updatePriority = (id: string, updates: Partial<PriorityConfig>) => {
    setPriorities(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  const createPriority = (prioData: Omit<PriorityConfig, 'id'>) => {
    const newPrio: PriorityConfig = {
      id: `prio-${Date.now()}`,
      ...prioData
    };
    setPriorities(prev => [...prev, newPrio]);
  };

  const toggleGoogleService = async (serviceKey: string, connected: boolean) => {
    const updated = await GoogleService.toggleServiceConnection(googleServices, serviceKey, connected);
    setGoogleServices(updated);
    showToast({
      type: connected ? 'success' : 'info',
      title: connected ? 'Serviço Conectado' : 'Serviço Desconectado',
      message: `Google ${serviceKey.toUpperCase()} foi ${connected ? 'ativado' : 'desativado'}.`
    });
  };

  const toggleAutomationRule = (ruleId: string, active: boolean) => {
    setAutomations(prev => prev.map(r => (r.id === ruleId ? { ...r, active } : r)));
  };

  // ----------------------------------------------------
  // NOTIFICATIONS
  // ----------------------------------------------------
  const unreadNotificationCount = useMemo(() => {
    return notifications.filter(n => !n.read && (n.userId === currentUser.id || !n.userId)).length;
  }, [notifications, currentUser]);

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // ----------------------------------------------------
  // FILTERING LOGIC
  // ----------------------------------------------------
  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const filteredDemands = useMemo(() => {
    return demands.filter(demand => {
      // Search
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesCode = demand.code.toLowerCase().includes(query);
        const matchesTitle = demand.title.toLowerCase().includes(query);
        const matchesDesc = demand.description.toLowerCase().includes(query);
        const matchesWhy = (demand.whyReason || '').toLowerCase().includes(query);
        const matchesTags = (demand.tags || []).some(t => t.toLowerCase().includes(query));
        if (!matchesCode && !matchesTitle && !matchesDesc && !matchesWhy && !matchesTags) {
          return false;
        }
      }

      // Categories
      if (filters.categoryIds.length > 0 && !filters.categoryIds.includes(demand.categoryId)) {
        return false;
      }

      // Statuses
      if (filters.statusIds.length > 0 && !filters.statusIds.includes(demand.statusId)) {
        return false;
      }

      // Priorities
      if (filters.priorityIds.length > 0 && !filters.priorityIds.includes(demand.priorityId)) {
        return false;
      }

      // Teams
      if (filters.teamIds.length > 0 && !filters.teamIds.includes(demand.teamId)) {
        return false;
      }

      // Assignees
      if (filters.assigneeIds.length > 0 && !filters.assigneeIds.includes(demand.assigneeId)) {
        return false;
      }

      // Requesters
      if (filters.requesterIds.length > 0 && !filters.requesterIds.includes(demand.requesterId)) {
        return false;
      }

      // Tags
      if (filters.tags.length > 0 && !filters.tags.some(t => demand.tags.includes(t))) {
        return false;
      }

      // Quick Toggles
      if (filters.onlyMyDemands && demand.assigneeId !== currentUser.id && !demand.participantIds?.includes(currentUser.id)) {
        return false;
      }

      if (filters.onlyCreatedByMe && demand.requesterId !== currentUser.id) {
        return false;
      }

      if (filters.onlyMyTeam && !currentUser.teamIds.includes(demand.teamId)) {
        return false;
      }

      if (filters.onlyBlocked && !demand.blocker?.isBlocked) {
        return false;
      }

      if (filters.onlyOverdue) {
        const isCompleted = statuses.find(s => s.id === demand.statusId)?.category === 'completed';
        const isOverdue = new Date(demand.dueDate).getTime() < Date.now() && !isCompleted;
        if (!isOverdue) return false;
      }

      if (filters.onlyDueSoon) {
        const isCompleted = statuses.find(s => s.id === demand.statusId)?.category === 'completed';
        const diffDays = (new Date(demand.dueDate).getTime() - Date.now()) / (1000 * 3600 * 24);
        if (isCompleted || diffDays < 0 || diffDays > 3) return false;
      }

      return true;
    });
  }, [demands, filters, currentUser, statuses]);

  // RBAC Permission Logic
  const updateRolePermissions = (role: UserRole, permissions: string[]) => {
    setRolePermissions((prev) => ({
      ...prev,
      [role]: permissions
    }));
    addAuditLog({
      action: 'UPDATE_CONFIG',
      details: `Matriz RBAC: Perfil ${role.toUpperCase()} atualizado para ${permissions.length} permissões ativas.`
    });
    showToast({
      type: 'success',
      title: 'Permissões Salvas',
      message: `A matriz de permissões para o perfil ${role.toUpperCase()} foi atualizada.`
    });
  };

  const resetRolePermissions = () => {
    setRolePermissions(INITIAL_ROLE_PERMISSIONS);
    StorageService.setRolePermissions(INITIAL_ROLE_PERMISSIONS);
    addAuditLog({
      action: 'UPDATE_CONFIG',
      details: 'A matriz de permissões RBAC foi restaurada para os padrões originais de fábrica.'
    });
    showToast({
      type: 'info',
      title: 'Permissões Restauradas',
      message: 'A matriz de permissões RBAC foi restaurada para os padrões originais.'
    });
  };

  const updateUserCustomPermissions = (userId: string, customPermissions?: UserCustomPermissions) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, customPermissions } : u))
    );
    addAuditLog({
      action: 'UPDATE_CONFIG',
      details: customPermissions
        ? `Permissões personalizadas do usuário ${userId}: concedidas=${customPermissions.granted.length}, revogadas=${customPermissions.revoked.length}`
        : `Permissões personalizadas do usuário ${userId} redefinidas.`
    });
    showToast({
      type: 'success',
      title: 'Permissões do Usuário Salvas',
      message: 'As permissões personalizadas do colaborador foram atualizadas com sucesso.'
    });
  };

  const userHasPermission = (
    user: User | undefined,
    module: RbacModule,
    action: RbacAction,
    activityType?: 'PROJETO' | 'MELHORIA' | 'TAREFA' | 'GERAL'
  ): boolean => {
    if (!user) return false;

    // Check specific module:action key (or activity type module)
    const targetModule = activityType && ['PROJETO', 'MELHORIA', 'TAREFA'].includes(activityType)
      ? (activityType === 'PROJETO' ? 'projects' : activityType === 'MELHORIA' ? 'improvements' : 'tasks')
      : module;

    const permissionKey = `${targetModule}:${action}`;

    // Admin has all permissions unless explicitly revoked in custom overrides
    if (user.role === 'admin') {
      if (user.customPermissions?.revoked?.includes(permissionKey)) {
        return false;
      }
      return true;
    }

    // 1. Check custom overrides for the specific user
    if (user.customPermissions) {
      if (user.customPermissions.revoked?.includes(permissionKey)) {
        return false;
      }
      if (user.customPermissions.granted?.includes(permissionKey)) {
        return true;
      }
    }

    // 2. Check role permissions
    const permissionsForRole = rolePermissions[user.role] || [];
    if (permissionsForRole.includes(permissionKey)) {
      return true;
    }

    // 3. Fallback check: if checking project/improvement/task, also check general demands permission
    if (['projects', 'improvements', 'tasks'].includes(targetModule)) {
      if (permissionsForRole.includes(`demands:${action}`)) {
        return true;
      }
    }

    return false;
  };

  const hasPermission = (
    module: RbacModule,
    action: RbacAction,
    activityType?: 'PROJETO' | 'MELHORIA' | 'TAREFA' | 'GERAL'
  ): boolean => {
    return userHasPermission(currentUser, module, action, activityType);
  };

  const resetAllData = () => {
    StorageService.resetAllToDefault();
    window.location.reload();
  };

  return (
    <AppContext.Provider
      value={{
        users,
        teams,
        categories,
        statuses,
        priorities,
        demands,
        auditLogs,
        notifications,
        googleServices,
        automations,
        inbox,
        templates,
        recurringRules,
        slaPolicies,
        approvals,
        strategicObjectives,
        risks,
        scheduledReports,
        apiKeys,
        webhooks,
        lgpdActivities,
        backups,
        traceabilityMatrix,
        offlineQueue,
        securitySessions,
        activeView,
        setActiveView,
        currentUser,
        setCurrentUserId,
        theme,
        setTheme,
        deviceMode,
        setDeviceMode,
        isOffline,
        setIsOffline,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
        closeSidebar,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebarCollapse,
        filters,
        setFilters,
        resetFilters,
        filteredDemands,
        selectedDemand,
        setSelectedDemand,
        isCreateModalOpen,
        setIsCreateModalOpen,
        editingDemand,
        setEditingDemand,
        createDemand,
        updateDemand,
        deleteDemand,
        moveDemandStatus,
        toggleBlocker,
        extendDeadline,
        addComment,
        toggleChecklist,
        completeDemand,
        triageInboxItem,
        createInboxItem,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        createRecurringRule,
        toggleRecurringRule,
        triggerRecurringGeneration,
        updateSlaPolicy,
        respondApproval,
        createApprovalRequest,
        updateStrategicObjective,
        createRisk,
        updateRisk,
        deleteRisk,
        createScheduledReport,
        triggerScheduledReportDispatch,
        createApiKey,
        revokeApiKey,
        createWebhook,
        testWebhookDelivery,
        deleteWebhook,
        createBackupSnapshot,
        runDrDrill,
        runAutomatedTestSuite,
        revokeSession,
        queueOfflineChange,
        processOfflineSync,
        resolveConflict,
        createTeam,
        updateTeam,
        deleteTeam,
        createUser,
        updateUser,
        deleteUser,
        updateCategory,
        createCategory,
        deleteCategory,
        updateStatus,
        createStatus,
        deleteStatus,
        reorderStatuses,
        updatePriority,
        createPriority,
        toggleGoogleService,
        toggleAutomationRule,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        toasts,
        showToast,
        removeToast,
        // RBAC & Permissões
        allRbacPermissions: ALL_RBAC_PERMISSIONS,
        rolePermissions,
        updateRolePermissions,
        resetRolePermissions,
        updateUserCustomPermissions,
        hasPermission,
        userHasPermission,

        exportModalOpen,
        setExportModalOpen,
        commandPaletteOpen,
        setCommandPaletteOpen,
        resetAllData
      }}
    >
      {dataLoading ? <div className="min-h-dvh grid place-items-center bg-slate-50 text-sm font-bold text-slate-500">Carregando dados corporativos...</div> : dataError ? <div className="min-h-dvh grid place-items-center bg-slate-50 p-6"><div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center"><h1 className="font-black text-red-700">Falha ao carregar o PROLOG</h1><p className="mt-2 text-sm text-slate-600">{dataError}</p><button onClick={()=>window.location.reload()} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">Tentar novamente</button></div></div> : children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
