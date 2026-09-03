/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'gestor' | 'colaborador' | 'diretoria';

export type RbacModule =
  | 'comments'
  | 'demands'          // Gestão Geral de Demandas (Kanban, Lista e Calendário)
  | 'projects'         // Atividades do tipo Projeto Estratégico
  | 'improvements'     // Atividades do tipo Melhoria
  | 'tasks'            // Atividades do tipo Tarefa Operacional
  | 'dashboard'        // Painéis Executivos & Métricas
  | 'reports'          // Relatórios Executivos & Exportação
  | 'scheduled_reports'// Relatórios Programados por E-mail
  | 'templates'        // Modelos de Demandas & Recorrências
  | 'sla'              // Gestão de SLAs & Horário Útil
  | 'risks'            // Gestão de Riscos & Matriz 5x5
  | 'api_webhooks'     // API REST, Tokens & Webhooks
  | 'system_health'    // Saúde do Sistema & Backup
  | 'android'          // Aplicativo Android & APK
  | 'users_teams'      // Equipes, Usuários & Matriz RBAC
  | 'categories'       // Configuração de Categorias & Status
  | 'audit'            // Trilha de Auditoria & Logs
  | 'google_workspace';// Integrações Google Workspace

export type RbacAction = 
  | 'read'    // Leitura / Consulta
  | 'create'  // Criação / Inclusão
  | 'edit'    // Edição / Alteração
  | 'delete'  // Exclusão / Cancelamento
  | 'approve' // Aprovação / Homologação
  | 'export'  // Exportação (PDF, Excel, JSON)
  | 'admin';  // Administração / Configurações Avançadas

export interface RbacPermissionRule {
  id: string; // Ex: 'demands:read', 'projects:create', 'sla:admin'
  module: RbacModule;
  action: RbacAction;
  name: string;
  description: string;
  activityType?: 'PROJETO' | 'MELHORIA' | 'TAREFA' | 'GERAL';
}

export type RolePermissionsMap = Record<UserRole, string[]>;

export interface UserCustomPermissions {
  granted: string[]; // IDs de permissões concedidas especificamente a este usuário
  revoked: string[]; // IDs de permissões revogadas especificamente deste usuário
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string; // Cargo e.g. "Gerente de Projetos", "Tech Lead"
  department: string; // Área e.g. "Tecnologia", "Operações", "Financeiro"
  branch?: string;
  phone?: string;
  avatar: string;
  teamIds: string[];
  active: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
  approvedByUserId?: string;
  mfaEnabled?: boolean;
  substituteUserId?: string; // Substituto durante ausência/férias
  vacationUntil?: string;
  customPermissions?: UserCustomPermissions; // Sobrescritas personalizadas RBAC
}

export interface Team {
  id: string;
  name: string;
  description: string;
  department: string;
  leaderId: string;
  color: string;
  active: boolean;
  memberIds: string[];
  maxWeeklyHoursCapacity?: number;
}

export type CategoryType = 'PROJETO' | 'MELHORIA' | 'TAREFA' | string;

export interface CategoryConfig {
  id: string;
  code: string;
  name: string;
  description: string;
  iconName: 'Crown' | 'BookOpen' | 'Cog' | 'Sparkles' | 'Layers' | 'Briefcase';
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  isSystem?: boolean;
}

export type StatusCategory = 'open' | 'in_progress' | 'waiting' | 'blocked' | 'in_review' | 'completed' | 'cancelled';

export interface StatusConfig {
  id: string;
  name: string;
  description: string;
  category: StatusCategory;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  iconName: string;
  order: number;
  wipLimit?: number;
  active: boolean;
  allowedTeamIds?: string[];
  isArchived?: boolean; // Correção conceitual: desativação/arquivamento de status sem perder histórico
  pausesSla?: boolean; // Se o status pausa automaticamente o SLA
}

export interface PriorityConfig {
  id: string;
  name: string;
  level: number; // 1 (Baixa) to 5 (Crítica)
  color: string;
  bgColor: string;
  textColor: string;
  recommendedSlaDays: number;
  iconName: string;
  active: boolean;
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  assignedToUserId?: string;
  dueDate?: string;
  completedAt?: string;
}

export interface BlockerInfo {
  isBlocked: boolean;
  kind?: 'blocker' | 'impediment';
  reason?: string;
  impact?: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
  blockedAt?: string;
  blockedByUserId?: string;
  actionNeeded?: string;
  requiresBoardIntervention?: boolean;
  resolvedAt?: string;
  createRelatedTask?: boolean;
  responsibleTeamId?: string;
  linkedDemandId?: string;
  previousStatusId?: string;
  resolvedByDemandId?: string;
}

export interface DeadlineExtension {
  id: string;
  previousDueDate: string;
  newDueDate: string;
  reason: string;
  approvedByUserId: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedByUserId: string;
  uploadedAt: string;
  isGoogleDrive?: boolean;
  googleDriveId?: string;
  sourceDevice?: 'web' | 'android';
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
  editedAt?: string;
  editedByUserId?: string;
  mentions?: string[];
  attachments?: Attachment[];
  isDecision?: boolean; // Marcação formal de decisão
  isConfidential?: boolean; // Visível apenas para gestores/diretoria
  reactions?: { [emoji: string]: string[] }; // emoji -> userIds
  readBy?: { userId: string; readAt: string }[];
}

export interface AuditLog {
  id: string;
  demandId?: string;
  demandCode?: string;
  action: string;
  fieldChanged?: string;
  previousValue?: string;
  newValue?: string;
  justification?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: string;
  details?: string;
  ipAddress?: string;
  deviceInfo?: string;
}

export interface GoogleSyncMetadata {
  gmailThreadId?: string;
  gmailThreadUrl?: string;
  googleCalendarEventId?: string;
  googleCalendarEventUrl?: string;
  googleDocId?: string;
  googleDocUrl?: string;
  googleSheetRowId?: number;
  googleSlidesId?: string;
  googleDriveFolderId?: string;
  googleTaskId?: string;
  lastSyncedAt?: string;
}

// 8. Orçamento, Custo e Benefício (Separação estrita de Custo, Esforço e Impacto)
export interface FinancialAndImpact {
  estimatedCost: number; // R$
  approvedCost: number; // R$
  realizedCost: number; // R$
  estimatedHours: number; // Esforço em Horas
  realizedHours: number; // Horas registradas
  costCenter: string; // Centro de Custo e.g. "CC-104 - TI Corporativa"
  expectedBenefit: string; // Benefício esperado
  realizedBenefit?: string; // Benefício apurado
  financialImpact: string; // Impacto financeiro
  operationalImpact: string; // Impacto operacional
  regulatoryImpact: string; // Impacto regulatório/compliance
  strategicImpact: string; // Impacto estratégico
  expectedReturnRoi?: number; // % ROI
  costVarianceJustification?: string; // Justificativa de estouro ou variação
}

// 4. SLA Tracking Model
export interface SlaTracking {
  policyId: string;
  firstResponseDue: string;
  firstResponseMetAt?: string;
  resolutionDue: string;
  resolutionMetAt?: string;
  isBreached: boolean;
  breachReason?: string;
  isPaused: boolean;
  totalPausedMinutes: number;
  pauseHistory: {
    pausedAt: string;
    resumedAt?: string;
    reason: string;
    statusId: string;
    resumedByUserId?: string;
  }[];
  escalationLevel: 'none' | 'manager' | 'board';
}

// 6. Demand Dependency Link
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF'; // Finish-to-Start, Start-to-Start, Finish-to-Finish, Start-to-Finish

export interface DemandDependency {
  id: string;
  targetDemandId: string; // A demanda predecessora
  type: DependencyType;
  lagDays: number;
}

// 9. Gestão de Riscos
export interface RiskItem {
  id: string;
  demandId: string;
  title: string;
  description: string;
  probability: 1 | 2 | 3 | 4 | 5; // 1 = Muito Baixa, 5 = Crítica
  impact: 1 | 2 | 3 | 4 | 5;
  severity: number; // probability * impact (1-25)
  category: 'tecnico' | 'orcamentario' | 'prazo' | 'regulatorio' | 'operacional' | 'reputacao';
  ownerId: string;
  mitigationPlan: string;
  contingencyPlan: string;
  dueDate: string;
  status: 'identificado' | 'mitigado' | 'ocorrido' | 'encerrado';
  requiresBoardIntervention: boolean;
  createdAt: string;
  updatedAt: string;
  history: {
    timestamp: string;
    userName: string;
    note: string;
  }[];
}

// Full 5W2H Demand Model
export interface Demand {
  id: string;
  moduleId: string;
  version: number;
  code: string; // e.g. DEM-2026-001
  title: string; // O que (What)
  description: string; // Detalhamento
  whatDescription?: string;
  categoryId: string; // PROJETO, MELHORIA, TAREFA, etc.
  
  // 5W2H Core Elements
  whyReason: string; // Por que (Why)
  expectedOutcome: string; // Resultado esperado
  whereLocation: string; // Onde (Where)
  howExecutionGuide: string; // Como (How)
  
  requesterId: string; // Quem solicitou (Who)
  clientId?: string; // Cliente externo solicitante
  clientName?: string; // Nome exibido do cliente no histórico da demanda
  assigneeId: string; // Quem é o responsável principal (Who)
  participantIds: string[];
  teamId: string; // Equipe responsável
  
  // Dates (When) & Baseline
  createdAt: string;
  plannedStartDate: string;
  dueDate: string; // Prazo de conclusão
  originalBaselineStartDate?: string; // Linha de base original
  originalBaselineDueDate?: string;
  replanJustification?: string;
  isMilestone?: boolean; // Marco de projeto
  completedAt?: string;
  completedByUserId?: string;
  completionSummary?: string;
  
  // Status & Priority
  statusId: string;
  priorityId: string;
  progressPercent: number; // 0 - 100
  
  // Financial, Cost & Impact (8)
  financials: FinancialAndImpact;
  
  // SLA Engine (4)
  sla: SlaTracking;
  
  // Dependencies and planning (6)
  advancedDependencies: DemandDependency[];
  dependencies: string[]; // Legacy back-compatibility
  
  // Metadata & Features
  tags: string[];
  checklist: ChecklistItem[];
  blocker: BlockerInfo;
  deadlineExtensions: DeadlineExtension[];
  attachments: Attachment[];
  comments: Comment[];
  watchers: string[]; // User IDs que seguem a demanda
  
  // Google Workspace Links
  googleSync?: GoogleSyncMetadata;
  
  // Inbound Link
  inboxSourceId?: string;
  inboxSourceType?: InboundSource;
  templateSourceId?: string;
  recurrenceSourceId?: string;
  
  // System flags
  isArchived?: boolean;
  updatedAt: string;
  updatedByUserId: string;
  descriptionVersionHistory?: {
    version: number;
    description: string;
    updatedAt: string;
    updatedByUserName: string;
  }[];
}

// 2. Central de Entrada de Demandas (Unified Inbox)
export type InboundSource = 
  | 'manual'
  | 'gmail'
  | 'forms'
  | 'sheets'
  | 'api'
  | 'excel'
  | 'user_request'
  | 'android_app';

export type InboundStatus = 
  | 'pending_triage'
  | 'info_requested'
  | 'converted'
  | 'rejected'
  | 'duplicate';

export interface InboxItem {
  id: string;
  source: InboundSource;
  sourceIdentifier?: string; // e.g. Email message ID, Form response ID
  title: string;
  description: string;
  senderName: string;
  senderEmail: string;
  receivedAt: string;
  status: InboundStatus;
  suggestedCategoryId?: string;
  suggestedPriorityId?: string;
  estimatedEffortHours?: number;
  duplicateCandidateDemandId?: string; // ID da demanda duplicada se detectada
  triageNotes?: string;
  assignedTeamId?: string;
  assignedUserId?: string;
  convertedDemandId?: string;
  attachments?: Attachment[];
  additionalInfoThread?: {
    date: string;
    sender: string;
    message: string;
  }[];
}

// 3. Templates Reutilizáveis
export interface DemandTemplate {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  defaultPriorityId: string;
  defaultWhyReason: string;
  defaultHowExecutionGuide: string;
  defaultHowGuide?: string;
  defaultWhereLocation: string;
  defaultTeamId?: string;
  defaultChecklist: string[];
  defaultTags: string[];
  estimatedHours: number;
  estimatedEffortHours?: number;
  estimatedCost: number;
  costCenter: string;
  suggestedDurationDays: number;
  active: boolean;
  createdAt: string;
}

// 3. Demandas Recorrentes
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'custom_cron';

export interface RecurringRule {
  id: string;
  templateId?: string;
  title: string;
  description: string;
  categoryId: string;
  priorityId: string;
  assigneeId: string;
  teamId: string;
  frequency: RecurrenceFrequency;
  daysOfWeek?: number[]; // 0=Dom, 1=Seg...
  dayOfMonth?: number;
  cronExpression?: string;
  startDate: string;
  endDate?: string;
  active: boolean;
  isSuspended: boolean;
  lastGeneratedAt?: string;
  nextScheduledDate: string;
  generationCount: number;
  idempotencyKeys: string[]; // Anti-duplicação
}

// 4. Configuração de Políticas de SLA
export interface SlaPolicy {
  id: string;
  name: string;
  description: string;
  categoryId?: string;
  priorityId?: string;
  teamId?: string;
  firstResponseHours: number;
  startHours: number;
  resolutionHours: number;
  workingDaysOnly: boolean;
  workingHoursStart: number; // 8 = 08:00
  workingHoursEnd: number; // 18 = 18:00
  pauseOnStatusCategories: StatusCategory[];
  escalateToManagerHours: number;
  escalateToBoardHours: number;
  escalationHierarchy?: string[];
  active: boolean;
}

// 5. Governança e Fluxos de Aprovação
export type ApprovalType = 
  | 'project_creation'
  | 'deadline_extension'
  | 'budget_change'
  | 'completion'
  | 'cancellation'
  | 'priority_change'
  | 'assignee_change'
  | 'executive_report_publishing';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'adjustments_requested';

export interface ApprovalRequest {
  id: string;
  demandId: string;
  demandCode: string;
  demandTitle: string;
  type: ApprovalType;
  requesterId: string;
  requesterName: string;
  approverId: string;
  approverName: string;
  substituteApproverId?: string;
  currentStep: number;
  totalSteps: number;
  thresholdAmount?: number; // Alçada financeira
  status: ApprovalStatus;
  createdAt: string;
  decisionDate?: string;
  comment?: string;
  evidenceAttachmentUrl?: string;
  previousValue?: string;
  requestedValue?: string;
  approvalHistory: {
    step: number;
    approverName: string;
    decision: ApprovalStatus;
    comment: string;
    timestamp: string;
  }[];
}

// 7. Capacidade e Carga de Trabalho
export interface UserCapacityForecast {
  userId: string;
  userName: string;
  userAvatar: string;
  roleTitle: string;
  teamId: string;
  teamName: string;
  availableHoursWeekly: number;
  allocatedHours: number;
  activeDemandsCount: number;
  utilizationPercent: number;
  status: 'underload' | 'optimal' | 'overload';
  isAbsent: boolean;
  absentReason?: string;
  redistributionSuggestions?: {
    demandId: string;
    demandTitle: string;
    hours: number;
    recommendedTargetUserId: string;
    recommendedTargetUserName: string;
    reason: string;
    confirmedByManager: boolean;
  }[];
}

// 11. Filtros Salvos & Visões Compartilhadas
export interface SavedFilterView {
  id: string;
  name: string;
  isShared: boolean;
  createdById: string;
  filters: FilterState;
  createdAt: string;
}

// 12. Portfólio Estratégico & OKRs
export interface StrategicObjective {
  id: string;
  code: string;
  title: string;
  description: string;
  targetYear: number;
  pillar: 'Crescimento' | 'Eficiência' | 'Inovação' | 'Sustentabilidade' | 'Governança';
  ownerId: string;
  targetKpi: string;
  progressPercent: number;
  healthStatus: 'green' | 'amber' | 'red';
  linkedProjectIds: string[];
}

// 13. Relatórios Executivos Programados
export interface ScheduledReportConfig {
  id: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  dispatchHour: number;
  recipients: string[];
  exportFormats: ('png' | 'excel' | 'pdf' | 'google_sheets' | 'google_slides')[];
  isConfidential: boolean;
  isAuthorizedForEmailDispatch: boolean;
  filterPresetId?: string;
  lastDispatchedAt?: string;
  dispatchHistory: {
    dispatchedAt: string;
    recipients: string[];
    dataVersion: string;
    format: string;
    status: 'success' | 'failed';
  }[];
  active: boolean;
}

// 14. API Keys, Webhooks & Automações
export interface ApiKeyItem {
  id: string;
  name: string;
  tokenPrefix: string;
  createdAt: string;
  expiresAt: string;
  scopes: string[];
  rateLimitPerMinute: number;
  lastUsedAt?: string;
  active: boolean;
}

export interface WebhookSubscription {
  id: string;
  name: string;
  targetUrl: string;
  subscribedEvents: (
    | 'demand.created'
    | 'demand.status_changed'
    | 'demand.sla_breached'
    | 'demand.completed'
    | 'demand.cancelled'
  )[];
  secret: string;
  active: boolean;
  recentDeliveries: {
    id: string;
    event: string;
    timestamp: string;
    statusCode: number;
    success: boolean;
    retryCount: number;
  }[];
}

// 15/16. Segurança, Sessões & LGPD
export interface SecuritySession {
  id: string;
  userId: string;
  userName: string;
  device: string;
  ipAddress: string;
  location: string;
  startedAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export interface LgpdProcessingActivity {
  id: string;
  processName: string;
  purpose: string;
  legalBasis: 'Consentimento' | 'Cumprimento de Obrigação Legal' | 'Execução de Contrato' | 'Legítimo Interesse';
  dataCategories: string[];
  retentionPeriodYears: number;
  dataSubjectTypes: string[];
  securityMeasures: string;
}

// 17. Backup & DR
export interface BackupSnapshot {
  id: string;
  filename: string;
  sizeBytes: number;
  createdAt: string;
  type: 'automatic_daily' | 'manual_export' | 'manual_admin';
  encryptionStatus: 'AES-256-GCM';
  checksum: string;
  recordsCount: {
    demands: number;
    users: number;
    auditLogs: number;
  };
  verifiedInDrDrill: boolean;
}

// 1. Android Offline Sync Queue Item
export interface OfflineSyncQueueItem {
  id: string;
  timestamp?: string;
  createdAt?: string;
  entityType: 'demand' | 'comment' | 'checklist' | 'status_change' | string;
  action: 'create' | 'update' | 'delete' | 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';
  entityId: string;
  payload: any;
  retryCount?: number;
  status: 'pending' | 'syncing' | 'synced' | 'conflict';
  conflictResolution?: 'client_wins' | 'server_wins' | 'merged' | 'local_wins';
}

// 21. Matriz de Rastreabilidade & Homologação
export interface TraceabilityItem {
  id: string;
  requirementNumber: number;
  requirementName: string;
  screenModule: string;
  businessRule: string;
  authorizedRoles: UserRole[];
  testExecuted: string;
  testResult: 'pass' | 'warning' | 'fail';
  evidence: string;
  pendingItems?: string;
  homologationStatus: 'Aprovado' | 'Aprovado com ressalvas' | 'Reprovado' | 'Não implementado' | 'Não testado';
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 
    | 'assigned'
    | 'status_changed'
    | 'deadline_changed'
    | 'due_soon'
    | 'overdue'
    | 'blocked'
    | 'comment'
    | 'validation'
    | 'completed'
    | 'sla_warning'
    | 'approval_needed'
    | 'risk_escalated'
    | 'inbox_received';
  demandId?: string;
  demandCode?: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface GoogleIntegrationService {
  id: string;
  name: string;
  serviceKey: 'gmail' | 'sheets' | 'drive' | 'calendar' | 'docs' | 'slides' | 'forms' | 'meet' | 'tasks' | 'contacts' | 'chat' | 'looker';
  description: string;
  connected: boolean;
  accountEmail?: string;
  lastSync?: string;
  status: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
  features: string[];
  syncFrequency: 'manual' | 'realtime' | 'hourly' | 'daily';
}

export interface AutomationRule {
  id: string;
  title: string;
  description: string;
  active: boolean;
  triggerEvent: 
    | 'demand_created'
    | 'demand_critical_created'
    | 'status_changed_to_blocked'
    | 'status_changed_to_completed'
    | 'deadline_changed'
    | 'approval_requested'
    | 'form_response_received'
    | 'gmail_label_detected';
  actionType:
    | 'google_calendar_create_event'
    | 'google_calendar_update_event'
    | 'google_sheets_append_row'
    | 'google_sheets_update_status'
    | 'google_drive_create_folder'
    | 'google_chat_send_alert'
    | 'gmail_send_notification'
    | 'google_docs_generate_summary';
  lastRunAt?: string;
  executionCount: number;
  lastRunStatus?: 'success' | 'failed';
}

export interface FilterState {
  search: string;
  categoryIds: string[];
  statusIds: string[];
  priorityIds: string[];
  teamIds: string[];
  assigneeIds: string[];
  requesterIds: string[];
  clientIds: string[];
  tags: string[];
  onlyMyDemands: boolean;
  onlyCreatedByMe: boolean;
  onlyMyTeam: boolean;
  onlyOverdue: boolean;
  onlyBlocked: boolean;
  onlyDueSoon: boolean;
  onlyWithRisks?: boolean;
  onlyPendingApproval?: boolean;
  groupBy: 'none' | 'team' | 'assignee' | 'category' | 'priority' | 'status';
  sortBy: 'dueDate' | 'priority' | 'createdAt' | 'progress' | 'code' | 'estimatedCost' | 'estimatedHours';
  sortOrder: 'asc' | 'desc';
  dateRangeStart?: string;
  dateRangeEnd?: string;
}

export type ActiveView = 
  | 'kanban'
  | 'list'
  | 'calendar'
  | 'dashboard'
  | 'executive_report'
  | 'my_demands'
  | 'created_by_me'
  | 'team_demands'
  | 'projects'
  | 'improvements'
  | 'tasks'
  | 'teams_management'
  | 'modules_management'
  | 'categories_config'
  | 'status_config'
  | 'priorities_config'
  | 'google_integrations'
  | 'audit_logs'
  | 'user_profile'
  // Novos módulos corporativos adicionados
  | 'inbox'
  | 'inbox_triage'
  | 'templates'
  | 'templates_recurrence'
  | 'sla'
  | 'sla_management'
  | 'approvals'
  | 'approvals_governance'
  | 'capacity'
  | 'capacity_workload'
  | 'financials'
  | 'financial_budget'
  | 'risks'
  | 'risk_management'
  | 'strategic'
  | 'strategic_portfolio'
  | 'reports'
  | 'scheduled_reports'
  | 'api_webhooks'
  | 'security'
  | 'security_lgpd'
  | 'system_health'
  | 'system_health_backup'
  | 'android'
  | 'android_distribution'
  | 'homologation'
  | 'qa_homologation';

// Export type aliases for backward compatibility across components
export type BackupPoint = BackupSnapshot;
export type HomologationRequirement = TraceabilityItem;
export type InboxSourceType = InboundSource;
