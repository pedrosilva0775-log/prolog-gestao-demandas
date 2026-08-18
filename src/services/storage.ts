/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  RolePermissionsMap
} from '../types';

import {
  INITIAL_CATEGORIES,
  INITIAL_STATUSES,
  INITIAL_PRIORITIES,
  INITIAL_ROLE_PERMISSIONS
} from '../data/initialData';

// Perfil operacional necessário para autoria e permissões; não representa
// uma pessoa ou organização fictícia e pode ser editado no primeiro acesso.
const INITIAL_USERS: User[] = [{
  id: 'system-admin',
  name: 'Administrador do Sistema',
  email: '',
  role: 'admin',
  roleTitle: 'Administrador',
  department: '',
  phone: '',
  avatar: '',
  teamIds: [],
  active: true,
  mfaEnabled: false
}];

const INITIAL_TEAMS: Team[] = [];
const INITIAL_DEMANDS: Demand[] = [];
const INITIAL_INBOX: InboxItem[] = [];
const INITIAL_TEMPLATES: DemandTemplate[] = [];
const INITIAL_RECURRING: RecurringRule[] = [];
const INITIAL_SLA_POLICIES: SlaPolicy[] = [];
const INITIAL_APPROVALS: ApprovalRequest[] = [];
const INITIAL_STRATEGIC_OBJECTIVES: StrategicObjective[] = [];
const INITIAL_RISKS: RiskItem[] = [];
const INITIAL_SCHEDULED_REPORTS: ScheduledReportConfig[] = [];
const INITIAL_API_KEYS: ApiKeyItem[] = [];
const INITIAL_WEBHOOKS: WebhookSubscription[] = [];
const INITIAL_LGPD_ACTIVITIES: LgpdProcessingActivity[] = [];
const INITIAL_BACKUPS: BackupSnapshot[] = [];
const INITIAL_TRACEABILITY_MATRIX: TraceabilityItem[] = [];
const INITIAL_AUDIT_LOGS: AuditLog[] = [];
const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
const INITIAL_GOOGLE_SERVICES: GoogleIntegrationService[] = [];
const INITIAL_AUTOMATIONS: AutomationRule[] = [];

const STORAGE_KEYS = {
  USERS: 'gd_users_v3',
  TEAMS: 'gd_teams_v3',
  ROLE_PERMISSIONS: 'gd_role_permissions_v3',
  CATEGORIES: 'gd_categories_v3',
  STATUSES: 'gd_statuses_v3',
  PRIORITIES: 'gd_priorities_v3',
  DEMANDS: 'gd_demands_v3',
  INBOX: 'gd_inbox_v3',
  TEMPLATES: 'gd_templates_v3',
  RECURRING: 'gd_recurring_v3',
  SLA_POLICIES: 'gd_sla_policies_v3',
  APPROVALS: 'gd_approvals_v3',
  STRATEGIC_OBJECTIVES: 'gd_strategic_objectives_v3',
  RISKS: 'gd_risks_v3',
  SCHEDULED_REPORTS: 'gd_scheduled_reports_v3',
  API_KEYS: 'gd_api_keys_v3',
  WEBHOOKS: 'gd_webhooks_v3',
  LGPD_ACTIVITIES: 'gd_lgpd_activities_v3',
  BACKUPS: 'gd_backups_v3',
  TRACEABILITY_MATRIX: 'gd_traceability_matrix_v3',
  OFFLINE_QUEUE: 'gd_offline_sync_queue_v3',
  SESSIONS: 'gd_security_sessions_v3',
  AUDIT_LOGS: 'gd_audit_logs_v3',
  NOTIFICATIONS: 'gd_notifications_v3',
  GOOGLE_SERVICES: 'gd_google_services_v3',
  AUTOMATIONS: 'gd_automations_v3',
  ACTIVE_USER_ID: 'gd_active_user_id_v3',
  THEME: 'gd_theme_v3',
  DEVICE_MODE: 'gd_device_mode_v3', // 'web' | 'android'
  OFFLINE_MODE: 'gd_offline_mode_v3',
  DRAFT_DEMAND: 'gd_draft_demand_v3',
  SIDEBAR_COLLAPSED: 'gd_sidebar_collapsed_v3',
};

export const StorageService = {
  getUsers: (): User[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  },
  setUsers: (users: User[]) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getTeams: (): Team[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEAMS);
      return data ? JSON.parse(data) : INITIAL_TEAMS;
    } catch {
      return INITIAL_TEAMS;
    }
  },
  setTeams: (teams: Team[]) => {
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
  },

  getRolePermissions: (): RolePermissionsMap => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROLE_PERMISSIONS);
      return data ? { ...INITIAL_ROLE_PERMISSIONS, ...JSON.parse(data) } : INITIAL_ROLE_PERMISSIONS;
    } catch {
      return INITIAL_ROLE_PERMISSIONS;
    }
  },
  setRolePermissions: (rolePermissions: RolePermissionsMap) => {
    localStorage.setItem(STORAGE_KEYS.ROLE_PERMISSIONS, JSON.stringify(rolePermissions));
  },

  getCategories: (): CategoryConfig[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  },
  setCategories: (categories: CategoryConfig[]) => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  getStatuses: (): StatusConfig[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATUSES);
      return data ? JSON.parse(data) : INITIAL_STATUSES;
    } catch {
      return INITIAL_STATUSES;
    }
  },
  setStatuses: (statuses: StatusConfig[]) => {
    localStorage.setItem(STORAGE_KEYS.STATUSES, JSON.stringify(statuses));
  },

  getPriorities: (): PriorityConfig[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRIORITIES);
      return data ? JSON.parse(data) : INITIAL_PRIORITIES;
    } catch {
      return INITIAL_PRIORITIES;
    }
  },
  setPriorities: (priorities: PriorityConfig[]) => {
    localStorage.setItem(STORAGE_KEYS.PRIORITIES, JSON.stringify(priorities));
  },

  getDemands: (): Demand[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DEMANDS);
      return data ? JSON.parse(data) : INITIAL_DEMANDS;
    } catch {
      return INITIAL_DEMANDS;
    }
  },
  setDemands: (demands: Demand[]) => {
    localStorage.setItem(STORAGE_KEYS.DEMANDS, JSON.stringify(demands));
  },

  getInbox: (): InboxItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INBOX);
      return data ? JSON.parse(data) : INITIAL_INBOX;
    } catch {
      return INITIAL_INBOX;
    }
  },
  setInbox: (inbox: InboxItem[]) => {
    localStorage.setItem(STORAGE_KEYS.INBOX, JSON.stringify(inbox));
  },

  getTemplates: (): DemandTemplate[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      return data ? JSON.parse(data) : INITIAL_TEMPLATES;
    } catch {
      return INITIAL_TEMPLATES;
    }
  },
  setTemplates: (templates: DemandTemplate[]) => {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  },

  getRecurringRules: (): RecurringRule[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECURRING);
      return data ? JSON.parse(data) : INITIAL_RECURRING;
    } catch {
      return INITIAL_RECURRING;
    }
  },
  setRecurringRules: (rules: RecurringRule[]) => {
    localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(rules));
  },

  getSlaPolicies: (): SlaPolicy[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SLA_POLICIES);
      return data ? JSON.parse(data) : INITIAL_SLA_POLICIES;
    } catch {
      return INITIAL_SLA_POLICIES;
    }
  },
  setSlaPolicies: (policies: SlaPolicy[]) => {
    localStorage.setItem(STORAGE_KEYS.SLA_POLICIES, JSON.stringify(policies));
  },

  getApprovals: (): ApprovalRequest[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APPROVALS);
      return data ? JSON.parse(data) : INITIAL_APPROVALS;
    } catch {
      return INITIAL_APPROVALS;
    }
  },
  setApprovals: (approvals: ApprovalRequest[]) => {
    localStorage.setItem(STORAGE_KEYS.APPROVALS, JSON.stringify(approvals));
  },

  getStrategicObjectives: (): StrategicObjective[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STRATEGIC_OBJECTIVES);
      return data ? JSON.parse(data) : INITIAL_STRATEGIC_OBJECTIVES;
    } catch {
      return INITIAL_STRATEGIC_OBJECTIVES;
    }
  },
  setStrategicObjectives: (objs: StrategicObjective[]) => {
    localStorage.setItem(STORAGE_KEYS.STRATEGIC_OBJECTIVES, JSON.stringify(objs));
  },

  getRisks: (): RiskItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RISKS);
      return data ? JSON.parse(data) : INITIAL_RISKS;
    } catch {
      return INITIAL_RISKS;
    }
  },
  setRisks: (risks: RiskItem[]) => {
    localStorage.setItem(STORAGE_KEYS.RISKS, JSON.stringify(risks));
  },

  getScheduledReports: (): ScheduledReportConfig[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCHEDULED_REPORTS);
      return data ? JSON.parse(data) : INITIAL_SCHEDULED_REPORTS;
    } catch {
      return INITIAL_SCHEDULED_REPORTS;
    }
  },
  setScheduledReports: (reports: ScheduledReportConfig[]) => {
    localStorage.setItem(STORAGE_KEYS.SCHEDULED_REPORTS, JSON.stringify(reports));
  },

  getApiKeys: (): ApiKeyItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.API_KEYS);
      return data ? JSON.parse(data) : INITIAL_API_KEYS;
    } catch {
      return INITIAL_API_KEYS;
    }
  },
  setApiKeys: (keys: ApiKeyItem[]) => {
    localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(keys));
  },

  getWebhooks: (): WebhookSubscription[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WEBHOOKS);
      return data ? JSON.parse(data) : INITIAL_WEBHOOKS;
    } catch {
      return INITIAL_WEBHOOKS;
    }
  },
  setWebhooks: (webhooks: WebhookSubscription[]) => {
    localStorage.setItem(STORAGE_KEYS.WEBHOOKS, JSON.stringify(webhooks));
  },

  getLgpdActivities: (): LgpdProcessingActivity[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LGPD_ACTIVITIES);
      return data ? JSON.parse(data) : INITIAL_LGPD_ACTIVITIES;
    } catch {
      return INITIAL_LGPD_ACTIVITIES;
    }
  },
  setLgpdActivities: (activities: LgpdProcessingActivity[]) => {
    localStorage.setItem(STORAGE_KEYS.LGPD_ACTIVITIES, JSON.stringify(activities));
  },

  getBackups: (): BackupSnapshot[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BACKUPS);
      return data ? JSON.parse(data) : INITIAL_BACKUPS;
    } catch {
      return INITIAL_BACKUPS;
    }
  },
  setBackups: (backups: BackupSnapshot[]) => {
    localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(backups));
  },

  getTraceabilityMatrix: (): TraceabilityItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRACEABILITY_MATRIX);
      return data ? JSON.parse(data) : INITIAL_TRACEABILITY_MATRIX;
    } catch {
      return INITIAL_TRACEABILITY_MATRIX;
    }
  },
  setTraceabilityMatrix: (matrix: TraceabilityItem[]) => {
    localStorage.setItem(STORAGE_KEYS.TRACEABILITY_MATRIX, JSON.stringify(matrix));
  },

  getOfflineQueue: (): OfflineSyncQueueItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  setOfflineQueue: (queue: OfflineSyncQueueItem[]) => {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  },

  getSecuritySessions: (): SecuritySession[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (data) return JSON.parse(data);
      return [];
      /* Dados de sessão não são mais simulados. O trecho legado abaixo
         permanece temporariamente apenas como referência de estrutura. */
      const defaultSessions: SecuritySession[] = [
        {
          id: 'sess-01',
          userId: 'usr-1',
          userName: 'Pedro Silva',
          device: 'Chrome 128 / macOS Sequoia (Estação Matriz SP)',
          ipAddress: '177.136.240.12',
          location: 'São Paulo, Brasil',
          startedAt: new Date(Date.now() - 28800000).toISOString(),
          lastActiveAt: new Date().toISOString(),
          isCurrent: true
        },
        {
          id: 'sess-02',
          userId: 'usr-1',
          userName: 'Pedro Silva',
          device: 'App Android / Samsung Galaxy S24 (Field App v2.4)',
          ipAddress: '189.40.88.54',
          location: 'Cajamar, Brasil',
          startedAt: new Date(Date.now() - 86400000).toISOString(),
          lastActiveAt: new Date(Date.now() - 3600000).toISOString(),
          isCurrent: false
        }
      ];
      return defaultSessions;
    } catch {
      return [];
    }
  },
  setSecuritySessions: (sessions: SecuritySession[]) => {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  },

  getAuditLogs: (): AuditLog[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  },
  setAuditLogs: (logs: AuditLog[]) => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  },

  getNotifications: (): NotificationItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  },
  setNotifications: (notifications: NotificationItem[]) => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  },

  getGoogleServices: (): GoogleIntegrationService[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GOOGLE_SERVICES);
      return data ? JSON.parse(data) : INITIAL_GOOGLE_SERVICES;
    } catch {
      return INITIAL_GOOGLE_SERVICES;
    }
  },
  setGoogleServices: (services: GoogleIntegrationService[]) => {
    localStorage.setItem(STORAGE_KEYS.GOOGLE_SERVICES, JSON.stringify(services));
  },

  getAutomations: (): AutomationRule[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTOMATIONS);
      return data ? JSON.parse(data) : INITIAL_AUTOMATIONS;
    } catch {
      return INITIAL_AUTOMATIONS;
    }
  },
  setAutomations: (automations: AutomationRule[]) => {
    localStorage.setItem(STORAGE_KEYS.AUTOMATIONS, JSON.stringify(automations));
  },

  getActiveUserId: (): string => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID) || 'system-admin';
  },
  setActiveUserId: (id: string) => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, id);
  },

  getTheme: (): 'light' | 'dark' | 'system' => {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as any) || 'light';
  },
  setTheme: (theme: 'light' | 'dark' | 'system') => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  getDeviceMode: (): 'web' | 'android' => {
    return (localStorage.getItem(STORAGE_KEYS.DEVICE_MODE) as any) || 'web';
  },
  setDeviceMode: (mode: 'web' | 'android') => {
    localStorage.setItem(STORAGE_KEYS.DEVICE_MODE, mode);
  },

  getOfflineMode: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.OFFLINE_MODE) === 'true';
  },
  setOfflineMode: (offline: boolean) => {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_MODE, String(offline));
  },

  getDraftDemand: (): Partial<Demand> | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DRAFT_DEMAND);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setDraftDemand: (draft: Partial<Demand> | null) => {
    if (!draft) {
      localStorage.removeItem(STORAGE_KEYS.DRAFT_DEMAND);
    } else {
      localStorage.setItem(STORAGE_KEYS.DRAFT_DEMAND, JSON.stringify(draft));
    }
  },

  getSidebarCollapsed: (): boolean => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true';
    } catch {
      return false;
    }
  },
  setSidebarCollapsed: (collapsed: boolean) => {
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(collapsed));
  },

  resetAllToDefault: () => {
    localStorage.clear();
  }
};
