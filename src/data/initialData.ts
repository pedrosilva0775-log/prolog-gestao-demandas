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
  RbacPermissionRule,
  RolePermissionsMap
} from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Carlos Mendes',
    email: 'carlos.mendes@empresa.com.br',
    role: 'admin',
    roleTitle: 'Diretor de Operações & Inovação',
    department: 'Diretoria Executiva',
    phone: '+55 11 98765-4321',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    teamIds: ['team-1', 'team-2', 'team-3', 'team-4'],
    active: true,
    mfaEnabled: true,
    substituteUserId: 'usr-2'
  },
  {
    id: 'usr-2',
    name: 'Juliana Prado',
    email: 'juliana.prado@empresa.com.br',
    role: 'gestor',
    roleTitle: 'Gerente de Engenharia & TI',
    department: 'Tecnologia',
    phone: '+55 11 98111-2233',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    teamIds: ['team-1'],
    active: true,
    mfaEnabled: true,
    substituteUserId: 'usr-4'
  },
  {
    id: 'usr-3',
    name: 'Roberto Alencar',
    email: 'roberto.alencar@empresa.com.br',
    role: 'gestor',
    roleTitle: 'Coordenador de Operações & Logística',
    department: 'Operações',
    phone: '+55 11 97222-3344',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    teamIds: ['team-2'],
    active: true,
    mfaEnabled: true,
    substituteUserId: 'usr-5'
  },
  {
    id: 'usr-4',
    name: 'Fernanda Vasconcelos',
    email: 'fernanda.v@empresa.com.br',
    role: 'colaborador',
    roleTitle: 'Engenheira de Software Sênior',
    department: 'Tecnologia',
    phone: '+55 11 96333-4455',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    teamIds: ['team-1'],
    active: true,
    mfaEnabled: false
  },
  {
    id: 'usr-5',
    name: 'Lucas Martins',
    email: 'lucas.martins@empresa.com.br',
    role: 'colaborador',
    roleTitle: 'Analista de Processos & Qualidade',
    department: 'Operações',
    phone: '+55 11 95444-5566',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    teamIds: ['team-2'],
    active: true,
    mfaEnabled: false
  },
  {
    id: 'usr-6',
    name: 'Mariana Duarte',
    email: 'mariana.duarte@empresa.com.br',
    role: 'gestor',
    roleTitle: 'Gerente de Gente & Gestão (RH)',
    department: 'Recursos Humanos',
    phone: '+55 11 94555-6677',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    teamIds: ['team-3'],
    active: true,
    mfaEnabled: true
  },
  {
    id: 'usr-7',
    name: 'Dra. Beatriz Fontana',
    email: 'beatriz.fontana@empresa.com.br',
    role: 'diretoria',
    roleTitle: 'Conselheira e VP Executiva',
    department: 'Conselho de Administração',
    phone: '+55 11 99888-7766',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    teamIds: ['team-1', 'team-2', 'team-3', 'team-4'],
    active: true,
    mfaEnabled: true,
    substituteUserId: 'usr-1'
  },
  {
    id: 'usr-8',
    name: 'Gabriel Siqueira',
    email: 'gabriel.s@empresa.com.br',
    role: 'colaborador',
    roleTitle: 'Analista Financeiro & Controladoria',
    department: 'Controladoria & Finanças',
    phone: '+55 11 93666-7788',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    teamIds: ['team-4'],
    active: true,
    mfaEnabled: false
  }
];

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'team-1',
    name: 'TI & Engenharia de Sistemas',
    description: 'Desenvolvimento de software, infraestrutura cloud, segurança e integrações de dados.',
    department: 'Tecnologia',
    leaderId: 'usr-2',
    color: '#3B82F6',
    active: true,
    memberIds: ['usr-1', 'usr-2', 'usr-4', 'usr-7'],
    maxWeeklyHoursCapacity: 160
  },
  {
    id: 'team-2',
    name: 'Operações & Logística',
    description: 'Gestão de centros de distribuição, processos de entrega e melhoria contínua fabril.',
    department: 'Operações',
    leaderId: 'usr-3',
    color: '#10B981',
    active: true,
    memberIds: ['usr-1', 'usr-3', 'usr-5'],
    maxWeeklyHoursCapacity: 120
  },
  {
    id: 'team-3',
    name: 'Gente & Cultura (RH)',
    description: 'Atração de talentos, treinamento corporativo, clima organizacional e DP.',
    department: 'Recursos Humanos',
    leaderId: 'usr-6',
    color: '#EC4899',
    active: true,
    memberIds: ['usr-1', 'usr-6'],
    maxWeeklyHoursCapacity: 80
  },
  {
    id: 'team-4',
    name: 'Controladoria & Finanças',
    description: 'Planejamento orçamentário, fechamentos contábeis, auditoria e compliance.',
    department: 'Controladoria & Finanças',
    leaderId: 'usr-8',
    color: '#8B5CF6',
    active: true,
    memberIds: ['usr-1', 'usr-8'],
    maxWeeklyHoursCapacity: 80
  }
];

export const INITIAL_CATEGORIES: CategoryConfig[] = [
  {
    id: 'cat-projeto',
    code: 'PROJETO',
    name: 'Projeto',
    description: 'Iniciativas estruturantes com início, meio, fim e entregáveis de alto impacto estratégico.',
    iconName: 'Crown',
    color: '#F59E0B',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    textColor: 'text-amber-700 dark:text-amber-300',
    borderColor: 'border-amber-300 dark:border-amber-800',
    isSystem: true,
  },
  {
    id: 'cat-melhoria',
    code: 'MELHORIA',
    name: 'Melhoria',
    description: 'Aprimoramentos em processos existentes, otimizações de fluxo e refinamento operacional.',
    iconName: 'BookOpen',
    color: '#06B6D4',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/40',
    textColor: 'text-cyan-700 dark:text-cyan-300',
    borderColor: 'border-cyan-300 dark:border-cyan-800',
    isSystem: true,
  },
  {
    id: 'cat-tarefa',
    code: 'TAREFA',
    name: 'Tarefa',
    description: 'Atividades operacionais do dia a dia, rotinas, manutenções e demandas pontuais.',
    iconName: 'Cog',
    color: '#6366F1',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    borderColor: 'border-indigo-300 dark:border-indigo-800',
    isSystem: true,
  }
];

export const INITIAL_STATUSES: StatusConfig[] = [
  {
    id: 'status-nova',
    name: 'Nova',
    description: 'Demanda recém-cadastrada aguardando triagem técnica e priorização.',
    category: 'open',
    color: '#64748B',
    textColor: 'text-slate-700 dark:text-slate-300',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    borderColor: 'border-slate-300 dark:border-slate-700',
    iconName: 'Sparkles',
    order: 1,
    wipLimit: 15,
    active: true,
    pausesSla: false,
    isArchived: false
  },
  {
    id: 'status-analise',
    name: 'Em Análise',
    description: 'Avaliação de escopo, viabilidade técnica, orçamento e mapeamento de riscos.',
    category: 'open',
    color: '#0EA5E9',
    textColor: 'text-sky-700 dark:text-sky-300',
    bgColor: 'bg-sky-50 dark:bg-sky-950/40',
    borderColor: 'border-sky-300 dark:border-sky-800',
    iconName: 'Search',
    order: 2,
    wipLimit: 8,
    active: true,
    pausesSla: false,
    isArchived: false
  },
  {
    id: 'status-planejada',
    name: 'Planejada',
    description: 'Escopo aprovado, cronograma definido e aguardando a data planejada de início.',
    category: 'open',
    color: '#8B5CF6',
    textColor: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-300 dark:border-purple-800',
    iconName: 'Calendar',
    order: 3,
    wipLimit: 10,
    active: true,
    pausesSla: false,
    isArchived: false
  },
  {
    id: 'status-andamento',
    name: 'Em Andamento',
    description: 'Em execução ativa pela equipe responsável.',
    category: 'in_progress',
    color: '#3B82F6',
    textColor: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'border-blue-300 dark:border-blue-800',
    iconName: 'PlayCircle',
    order: 4,
    wipLimit: 6,
    active: true,
    pausesSla: false,
    isArchived: false
  },
  {
    id: 'status-terceiros',
    name: 'Aguardando Terceiros',
    description: 'Pausada por dependência de fornecedores externos, APIs ou aprovação de clientes.',
    category: 'waiting',
    color: '#F97316',
    textColor: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-50 dark:bg-orange-950/40',
    borderColor: 'border-orange-300 dark:border-orange-800',
    iconName: 'Clock',
    order: 5,
    wipLimit: 5,
    active: true,
    pausesSla: true, // Auto-pausa contagem de SLA
    isArchived: false
  },
  {
    id: 'status-bloqueada',
    name: 'Bloqueada',
    description: 'Impedimento crítico que inviabiliza o avanço até tomada de decisão superior.',
    category: 'blocked',
    color: '#EF4444',
    textColor: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-50 dark:bg-red-950/40',
    borderColor: 'border-red-300 dark:border-red-800',
    iconName: 'AlertOctagon',
    order: 6,
    wipLimit: 4,
    active: true,
    pausesSla: false,
    isArchived: false
  },
  {
    id: 'status-validacao',
    name: 'Em Validação',
    description: 'Entregável concluído em fase de homologação, QA ou aceite pelo solicitante.',
    category: 'in_review',
    color: '#EAB308',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/40',
    borderColor: 'border-yellow-300 dark:border-yellow-800',
    iconName: 'CheckSquare',
    order: 7,
    wipLimit: 6,
    active: true,
    pausesSla: true,
    isArchived: false
  },
  {
    id: 'status-concluida',
    name: 'Concluída',
    description: 'Demanda totalmente entregue, validada e homologada em produção.',
    category: 'completed',
    color: '#10B981',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-300 dark:border-emerald-800',
    iconName: 'CheckCircle2',
    order: 8,
    active: true,
    pausesSla: false,
    isArchived: false
  },
  {
    id: 'status-cancelada',
    name: 'Cancelada',
    description: 'Demanda descontinuada ou substituída após análise da diretoria/solicitante.',
    category: 'cancelled',
    color: '#94A3B8',
    textColor: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-300 dark:border-gray-700',
    iconName: 'XCircle',
    order: 9,
    active: true,
    pausesSla: false,
    isArchived: false
  }
];

export const INITIAL_PRIORITIES: PriorityConfig[] = [
  {
    id: 'prio-critica',
    name: 'Crítica',
    level: 5,
    color: '#DC2626',
    bgColor: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-800',
    textColor: 'text-red-700 dark:text-red-400',
    recommendedSlaDays: 2,
    iconName: 'Flame',
    active: true,
  },
  {
    id: 'prio-urgente',
    name: 'Urgente',
    level: 4,
    color: '#EA580C',
    bgColor: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 dark:border-orange-800',
    textColor: 'text-orange-700 dark:text-orange-400',
    recommendedSlaDays: 5,
    iconName: 'Zap',
    active: true,
  },
  {
    id: 'prio-alta',
    name: 'Alta',
    level: 3,
    color: '#F59E0B',
    bgColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    textColor: 'text-amber-700 dark:text-amber-400',
    recommendedSlaDays: 10,
    iconName: 'AlertTriangle',
    active: true,
  },
  {
    id: 'prio-media',
    name: 'Média',
    level: 2,
    color: '#3B82F6',
    bgColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    textColor: 'text-blue-700 dark:text-blue-400',
    recommendedSlaDays: 20,
    iconName: 'Check',
    active: true,
  },
  {
    id: 'prio-baixa',
    name: 'Baixa',
    level: 1,
    color: '#6B7280',
    bgColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    textColor: 'text-slate-600 dark:text-slate-400',
    recommendedSlaDays: 45,
    iconName: 'ArrowDownCircle',
    active: true,
  }
];

export const INITIAL_DEMANDS: Demand[] = [
  {
    id: 'dem-001',
    code: 'DEM-2026-001',
    title: 'Migração do Core ERP para Infraestrutura Cloud Híbrida',
    description: 'Modernização da arquitetura do ERP corporativo para garantir alta disponibilidade (99.99%) e reduzir a latência das unidades fabris.',
    categoryId: 'cat-projeto',
    whyReason: 'A infraestrutura legada local atingiu 92% da capacidade de armazenamento e causa lentidão nos fechamentos contábeis mensais.',
    expectedOutcome: 'Redução de 45% no tempo de processamento contábil e eliminação de quedas em horários de pico.',
    whereLocation: 'Data Center Matriz SP e AWS São Paulo (Região sa-east-1)',
    howExecutionGuide: 'Executar pipeline Terraform, migrar réplicas do PostgreSQL com zero downtime e chavear DNS de produção no fim de semana.',
    requesterId: 'usr-7',
    assigneeId: 'usr-2',
    participantIds: ['usr-4', 'usr-1'],
    teamId: 'team-1',
    createdAt: '2026-08-01T09:00:00.000Z',
    plannedStartDate: '2026-08-05T08:00:00.000Z',
    dueDate: '2026-08-25T18:00:00.000Z',
    originalBaselineStartDate: '2026-08-05T08:00:00.000Z',
    originalBaselineDueDate: '2026-08-25T18:00:00.000Z',
    isMilestone: false,
    statusId: 'status-andamento',
    priorityId: 'prio-critica',
    progressPercent: 65,
    tags: ['Infraestrutura', 'Cloud', 'ERP', 'Estratégico'],
    financials: {
      estimatedCost: 180000,
      approvedCost: 180000,
      realizedCost: 115000,
      estimatedHours: 320,
      realizedHours: 210,
      costCenter: 'CC-104 - TI Corporativa',
      expectedBenefit: 'Economia de R$ 38.000/mês em custos de manutenção de servidores legados.',
      realizedBenefit: 'Latência reduzida de 340ms para 42ms em testes piloto.',
      financialImpact: 'Alto - Redução direta de OPEX a partir do 3º trimestre.',
      operationalImpact: 'Crítico - Elimina risco de indisponibilidade no faturamento.',
      regulatoryImpact: 'Alto - Atende aos requisitos de auditoria externa SOX/LGPD.',
      strategicImpact: 'Fundamental para viabilizar expansão das novas fábricas.',
      expectedReturnRoi: 145,
    },
    sla: {
      policyId: 'sla-critica',
      firstResponseDue: '2026-08-01T11:00:00.000Z',
      firstResponseMetAt: '2026-08-01T09:40:00.000Z',
      resolutionDue: '2026-08-25T18:00:00.000Z',
      isBreached: false,
      isPaused: false,
      totalPausedMinutes: 0,
      pauseHistory: [],
      escalationLevel: 'none'
    },
    advancedDependencies: [],
    dependencies: [],
    checklist: [
      { id: 'chk-1', title: 'Provisionar clusters Kubernetes via Terraform', completed: true, dueDate: '2026-08-08' },
      { id: 'chk-2', title: 'Testar sincronização bidirecional de banco', completed: true, dueDate: '2026-08-14' },
      { id: 'chk-3', title: 'Executar homologação com equipe de controladoria', completed: false, dueDate: '2026-08-20' },
      { id: 'chk-4', title: 'Virada oficial de DNS no fim de semana', completed: false, dueDate: '2026-08-24' }
    ],
    blocker: {
      isBlocked: false
    },
    deadlineExtensions: [],
    attachments: [
      {
        id: 'att-1',
        name: 'Arquitetura_Cloud_v2.4.pdf',
        size: 3450000,
        type: 'pdf',
        url: 'https://drive.google.com/file/d/demo-arch-cloud',
        uploadedByUserId: 'usr-2',
        uploadedAt: '2026-08-05T14:30:00.000Z',
        isGoogleDrive: true
      }
    ],
    comments: [
      {
        id: 'comm-1',
        userId: 'usr-7',
        userName: 'Dra. Beatriz Fontana',
        userAvatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
        content: 'Excelente progresso, Juliana. Por favor garanta que a auditoria da KPMG tenha acesso aos logs de segurança.',
        createdAt: '2026-08-12T10:15:00.000Z',
        isDecision: true
      }
    ],
    watchers: ['usr-1', 'usr-7', 'usr-8'],
    googleSync: {
      googleCalendarEventUrl: 'https://calendar.google.com/event?eid=dem-001',
      googleDocUrl: 'https://docs.google.com/document/d/dem-001-plano-acao',
      googleSheetRowId: 2,
      lastSyncedAt: '2026-08-16T12:00:00.000Z'
    },
    updatedAt: '2026-08-15T16:00:00.000Z',
    updatedByUserId: 'usr-2'
  },
  {
    id: 'dem-002',
    code: 'DEM-2026-002',
    title: 'Automatização de Roteirização e Rastreamento Logístico',
    description: 'Implementação de algoritmo de roteirização dinâmica com geolocalização em tempo real para frotas de entrega urbana.',
    categoryId: 'cat-melhoria',
    whyReason: 'Custos de combustível subiram 18% no último trimestre devido a rotas redundantes e tráfego pesado.',
    expectedOutcome: 'Economia estimada de R$ 120.000/mês em combustível e aumento de 22% no índice de entregas no mesmo dia.',
    whereLocation: 'Centro de Distribuição Cajamar / Frota Sudeste',
    howExecutionGuide: 'Integrar API de roteamento ao aplicativo mobile dos motoristas e sincronizar telemetria via MQTT.',
    requesterId: 'usr-3',
    assigneeId: 'usr-5',
    participantIds: ['usr-3', 'usr-4'],
    teamId: 'team-2',
    createdAt: '2026-08-02T10:30:00.000Z',
    plannedStartDate: '2026-08-04T08:00:00.000Z',
    dueDate: '2026-08-20T18:00:00.000Z',
    originalBaselineStartDate: '2026-08-04T08:00:00.000Z',
    originalBaselineDueDate: '2026-08-20T18:00:00.000Z',
    isMilestone: false,
    statusId: 'status-andamento',
    priorityId: 'prio-alta',
    progressPercent: 40,
    tags: ['Logística', 'App Mobile', 'Rotas', 'Redução Custos'],
    financials: {
      estimatedCost: 65000,
      approvedCost: 65000,
      realizedCost: 28000,
      estimatedHours: 160,
      realizedHours: 64,
      costCenter: 'CC-202 - Logística e Transportes',
      expectedBenefit: 'Economia mensal de R$ 120.000 em diesel e manutenção de veículos.',
      financialImpact: 'Alto - Rápido payback em menos de 2 meses.',
      operationalImpact: 'Médio - Exige treinamento de 85 motoristas parceiros.',
      regulatoryImpact: 'Neutro - Sem impacto regulatório direto.',
      strategicImpact: 'Aumenta NPS das entregas de 62 para 85 pontos.',
      expectedReturnRoi: 220
    },
    sla: {
      policyId: 'sla-alta',
      firstResponseDue: '2026-08-02T18:30:00.000Z',
      firstResponseMetAt: '2026-08-02T14:10:00.000Z',
      resolutionDue: '2026-08-20T18:00:00.000Z',
      isBreached: false,
      isPaused: false,
      totalPausedMinutes: 0,
      pauseHistory: [],
      escalationLevel: 'none'
    },
    advancedDependencies: [
      { id: 'dep-1', targetDemandId: 'dem-001', type: 'FS', lagDays: 0 }
    ],
    dependencies: ['dem-001'],
    checklist: [
      { id: 'chk-5', title: 'Contratar API de matriz de distâncias e tráfego', completed: true, dueDate: '2026-08-06' },
      { id: 'chk-6', title: 'Desenvolver módulo de roteirização no backend', completed: true, dueDate: '2026-08-12' },
      { id: 'chk-7', title: 'Atualizar app Android dos motoristas', completed: false, dueDate: '2026-08-17' },
      { id: 'chk-8', title: 'Piloto em 15 caminhões da rota Expressa SP', completed: false, dueDate: '2026-08-19' }
    ],
    blocker: {
      isBlocked: false
    },
    deadlineExtensions: [],
    attachments: [],
    comments: [],
    watchers: ['usr-1', 'usr-3'],
    updatedAt: '2026-08-14T11:20:00.000Z',
    updatedByUserId: 'usr-5'
  },
  {
    id: 'dem-003',
    code: 'DEM-2026-003',
    title: 'Portal de Autoatendimento e Onboarding Digital de Novos Colaboradores',
    description: 'Plataforma integrada para envio de documentação trabalhista, assinatura digital e trilha de integração de novos contratados.',
    categoryId: 'cat-projeto',
    whyReason: 'Processo manual atual consome 12 horas por contratado e atrasa a entrega de equipamentos de trabalho.',
    expectedOutcome: 'Redução do tempo de admissão de 8 dias para 24 horas com 100% dos documentos validados digitalmente.',
    whereLocation: 'Portal Corporativo / Módulo RH',
    howExecutionGuide: 'Desenvolver webapp React, integrar com API Gov.br / eSocial e automatizar criação de contas Google Workspace.',
    requesterId: 'usr-6',
    assigneeId: 'usr-6',
    participantIds: ['usr-4', 'usr-1'],
    teamId: 'team-3',
    createdAt: '2026-08-03T14:00:00.000Z',
    plannedStartDate: '2026-08-08T08:00:00.000Z',
    dueDate: '2026-08-28T18:00:00.000Z',
    originalBaselineStartDate: '2026-08-08T08:00:00.000Z',
    originalBaselineDueDate: '2026-08-28T18:00:00.000Z',
    isMilestone: true,
    statusId: 'status-terceiros',
    priorityId: 'prio-media',
    progressPercent: 30,
    tags: ['RH', 'Onboarding', 'Automação', 'Assinatura Digital'],
    financials: {
      estimatedCost: 45000,
      approvedCost: 45000,
      realizedCost: 15000,
      estimatedHours: 120,
      realizedHours: 36,
      costCenter: 'CC-301 - Recursos Humanos',
      expectedBenefit: 'Economia de 12 horas por admissão e redução de passivos trabalhistas.',
      financialImpact: 'Médio - Economia de horas administrativas.',
      operationalImpact: 'Alto - Melhora percepção inicial do colaborador.',
      regulatoryImpact: 'Alto - Conformidade integral com eSocial e LGPD.',
      strategicImpact: 'Suporta plano de 200 novas contratações sem inflar equipe de RH.',
      expectedReturnRoi: 110
    },
    sla: {
      policyId: 'sla-media',
      firstResponseDue: '2026-08-04T14:00:00.000Z',
      firstResponseMetAt: '2026-08-04T10:00:00.000Z',
      resolutionDue: '2026-08-28T18:00:00.000Z',
      isBreached: false,
      isPaused: true,
      totalPausedMinutes: 2880,
      pauseHistory: [
        {
          pausedAt: '2026-08-14T09:00:00.000Z',
          reason: 'Aguardando liberação do ambiente de homologação da API de assinatura digital DocuSign/Gov.br',
          statusId: 'status-terceiros'
        }
      ],
      escalationLevel: 'none'
    },
    advancedDependencies: [],
    dependencies: [],
    checklist: [
      { id: 'chk-9', title: 'Mapear requisitos legais da CLT e eSocial', completed: true, dueDate: '2026-08-10' },
      { id: 'chk-10', title: 'Homologar conector DocuSign / Assinatura Gov.br', completed: false, dueDate: '2026-08-18' },
      { id: 'chk-11', title: 'Criar trilhas de vídeo no Google Drive', completed: false, dueDate: '2026-08-22' }
    ],
    blocker: {
      isBlocked: true,
      reason: 'Aguardando validação jurídica dos termos de uso da assinatura eletrônica pelo compliance.',
      impact: 'Médio',
      blockedAt: '2026-08-14T09:00:00.000Z',
      blockedByUserId: 'usr-6',
      actionNeeded: 'Parecer do Dr. Marcos (Jurídico Corporativo)'
    },
    deadlineExtensions: [],
    attachments: [],
    comments: [],
    watchers: ['usr-1', 'usr-6'],
    updatedAt: '2026-08-14T09:30:00.000Z',
    updatedByUserId: 'usr-6'
  },
  {
    id: 'dem-004',
    code: 'DEM-2026-004',
    title: 'Adequação dos Relatórios Gerenciais à Nova Instrução Normativa CVM 193 (ESG)',
    description: 'Parametrização contábil no módulo financeiro para geração automatizada do balanço de sustentabilidade e métricas de emissão de carbono.',
    categoryId: 'cat-melhoria',
    whyReason: 'Obrigatoriedade regulatória para empresas com reporte consolidado a partir do exercício de 2026.',
    expectedOutcome: 'Geração do relatório ESG em formato estruturado sem retrabalho manual em planilhas.',
    whereLocation: 'Sistema ERP / Módulo Controladoria',
    howExecutionGuide: 'Criar contas contábeis de apropriação de carbono, configurar centros de custo ambientais e validar demonstrativos com auditoria externa.',
    requesterId: 'usr-7',
    assigneeId: 'usr-8',
    participantIds: ['usr-2'],
    teamId: 'team-4',
    createdAt: '2026-08-04T08:30:00.000Z',
    plannedStartDate: '2026-08-06T08:00:00.000Z',
    dueDate: '2026-08-22T18:00:00.000Z',
    originalBaselineStartDate: '2026-08-06T08:00:00.000Z',
    originalBaselineDueDate: '2026-08-22T18:00:00.000Z',
    isMilestone: false,
    statusId: 'status-validacao',
    priorityId: 'prio-alta',
    progressPercent: 85,
    tags: ['ESG', 'Compliance', 'CVM', 'Auditoria'],
    financials: {
      estimatedCost: 30000,
      approvedCost: 30000,
      realizedCost: 26000,
      estimatedHours: 80,
      realizedHours: 70,
      costCenter: 'CC-401 - Controladoria & Compliance',
      expectedBenefit: 'Atendimento a 100% dos requisitos CVM 193 evitando autuações e multas.',
      financialImpact: 'Crítico - Evita multas e perda de grau de investimento.',
      operationalImpact: 'Médio - Ajusta rotina contábil mensal.',
      regulatoryImpact: 'Crítico - Mandatório CVM.',
      strategicImpact: 'Posiciona a empresa no Índice de Sustentabilidade Empresarial (ISE B3).'
    },
    sla: {
      policyId: 'sla-alta',
      firstResponseDue: '2026-08-04T16:30:00.000Z',
      firstResponseMetAt: '2026-08-04T11:00:00.000Z',
      resolutionDue: '2026-08-22T18:00:00.000Z',
      isBreached: false,
      isPaused: true,
      totalPausedMinutes: 1440,
      pauseHistory: [
        {
          pausedAt: '2026-08-15T10:00:00.000Z',
          reason: 'Em validação final pela auditoria independente da Ernst & Young.',
          statusId: 'status-validacao'
        }
      ],
      escalationLevel: 'none'
    },
    advancedDependencies: [],
    dependencies: [],
    checklist: [
      { id: 'chk-12', title: 'Mapear plano de contas ESG', completed: true, dueDate: '2026-08-09' },
      { id: 'chk-13', title: 'Criar templates no Google Sheets para consolidação', completed: true, dueDate: '2026-08-14' },
      { id: 'chk-14', title: 'Validação final com auditoria externa', completed: false, dueDate: '2026-08-21' }
    ],
    blocker: { isBlocked: false },
    deadlineExtensions: [],
    attachments: [],
    comments: [],
    watchers: ['usr-1', 'usr-7', 'usr-8'],
    updatedAt: '2026-08-15T15:30:00.000Z',
    updatedByUserId: 'usr-8'
  },
  {
    id: 'dem-005',
    code: 'DEM-2026-005',
    title: 'Auditoria de Segurança da Informação e Pentest nas APIs Públicas',
    description: 'Execução de testes de intrusão, revisão de código estático (SAST) e auditoria de permissões RBAC nas APIs de integração de clientes.',
    categoryId: 'cat-tarefa',
    whyReason: 'Requisito contratual anual com seguradora de risco cibernético e clientes enterprise.',
    expectedOutcome: 'Relatório com 100% das vulnerabilidades altas e críticas corrigidas com certificado de conformidade emitido.',
    whereLocation: 'Ambiente de Staging / APIs de Gateway',
    howExecutionGuide: 'Contratar consultoria especializada, fornecer tokens de teste controlados e atuar nas correções prioritárias com a equipe de engenharia.',
    requesterId: 'usr-1',
    assigneeId: 'usr-4',
    participantIds: ['usr-2'],
    teamId: 'team-1',
    createdAt: '2026-08-01T08:00:00.000Z',
    plannedStartDate: '2026-08-02T08:00:00.000Z',
    dueDate: '2026-08-12T18:00:00.000Z',
    completedAt: '2026-08-11T17:30:00.000Z',
    completedByUserId: 'usr-4',
    completionSummary: 'Auditoria concluída com sucesso. Zero vulnerabilidades críticas identificadas e 2 apontamentos médios de sanitização corrigidos.',
    statusId: 'status-concluida',
    priorityId: 'prio-critica',
    progressPercent: 100,
    tags: ['Segurança', 'Pentest', 'Cibersegurança', 'Concluído'],
    financials: {
      estimatedCost: 25000,
      approvedCost: 25000,
      realizedCost: 24500,
      estimatedHours: 40,
      realizedHours: 38,
      costCenter: 'CC-104 - TI Corporativa',
      expectedBenefit: 'Certificado de conformidade emitido e redução de 30% na apólice de seguro cibernético.',
      realizedBenefit: 'Conformidade atestada e renovação de contrato enterprise de R$ 1.8M.',
      financialImpact: 'Alto - Blindagem de receita enterprise.',
      operationalImpact: 'Médio - Reforço nas políticas de tokenização.',
      regulatoryImpact: 'Crítico - Atende ISO 27001 e LGPD.',
      strategicImpact: 'Diferencial competitivo em propostas B2B.'
    },
    sla: {
      policyId: 'sla-critica',
      firstResponseDue: '2026-08-01T10:00:00.000Z',
      firstResponseMetAt: '2026-08-01T08:45:00.000Z',
      resolutionDue: '2026-08-12T18:00:00.000Z',
      resolutionMetAt: '2026-08-11T17:30:00.000Z',
      isBreached: false,
      isPaused: false,
      totalPausedMinutes: 0,
      pauseHistory: [],
      escalationLevel: 'none'
    },
    advancedDependencies: [],
    dependencies: [],
    checklist: [
      { id: 'chk-15', title: 'Definir escopo do Pentest e regras de engajamento', completed: true, dueDate: '2026-08-03' },
      { id: 'chk-16', title: 'Executar varredura automatizada e testes manuais', completed: true, dueDate: '2026-08-08' },
      { id: 'chk-17', title: 'Corrigir apontamentos e solicitar reteste', completed: true, dueDate: '2026-08-10' },
      { id: 'chk-18', title: 'Emitir laudo técnico e arquivar no Drive', completed: true, dueDate: '2026-08-11' }
    ],
    blocker: { isBlocked: false },
    deadlineExtensions: [],
    attachments: [
      {
        id: 'att-2',
        name: 'Laudo_Segurança_Pentest_2026.pdf',
        size: 2100000,
        type: 'pdf',
        url: 'https://drive.google.com/file/d/demo-pentest-report',
        uploadedByUserId: 'usr-4',
        uploadedAt: '2026-08-11T17:30:00.000Z',
        isGoogleDrive: true
      }
    ],
    comments: [],
    watchers: ['usr-1', 'usr-2'],
    updatedAt: '2026-08-11T17:35:00.000Z',
    updatedByUserId: 'usr-4'
  },
  {
    id: 'dem-006',
    code: 'DEM-2026-006',
    title: 'Implementação de Sensores IoT para Manutenção Preditiva na Linha 3',
    description: 'Instalação de sensores de vibração e temperatura nos motores da esteira principal para alertar anomalias antes da quebra.',
    categoryId: 'cat-melhoria',
    whyReason: 'Paradas não programadas geraram perda de R$ 240.000 no primeiro semestre de 2026.',
    expectedOutcome: 'Previsão de falhas com até 72h de antecedência e redução de 90% no tempo de parada não planejada.',
    whereLocation: 'Fábrica Unidade Campinas / Linha de Envase 3',
    howExecutionGuide: 'Instalar hardware nos motores, conectar ao gateway LoRaWAN e treinar modelo de detecção de anomalias.',
    requesterId: 'usr-3',
    assigneeId: 'usr-5',
    participantIds: ['usr-4'],
    teamId: 'team-2',
    createdAt: '2026-08-02T11:00:00.000Z',
    plannedStartDate: '2026-08-03T08:00:00.000Z',
    dueDate: '2026-08-14T18:00:00.000Z',
    completedAt: '2026-08-13T16:00:00.000Z',
    completedByUserId: 'usr-5',
    completionSummary: 'Sensores instalados e calibrados. Dashboard de telemetria em tempo real integrado ao painel operacional da fábrica.',
    statusId: 'status-concluida',
    priorityId: 'prio-urgente',
    progressPercent: 100,
    tags: ['IoT', 'Indústria 4.0', 'Manutenção Preditiva', 'Concluído'],
    financials: {
      estimatedCost: 52000,
      approvedCost: 52000,
      realizedCost: 49800,
      estimatedHours: 90,
      realizedHours: 84,
      costCenter: 'CC-203 - Manutenção Fabril',
      expectedBenefit: 'Economia estimada de R$ 400.000/ano em prevenção de paradas críticas.',
      realizedBenefit: 'Primeiro alerta de desbalanceamento detectado com 48h de antecedência.',
      financialImpact: 'Alto - Retorno imediato.',
      operationalImpact: 'Alto - Aumenta disponibilidade da linha de 91% para 98.5%.',
      regulatoryImpact: 'Neutro.',
      strategicImpact: 'Primeiro piloto do programa Fábrica Inteligente 2026.',
      expectedReturnRoi: 380
    },
    sla: {
      policyId: 'sla-urgente',
      firstResponseDue: '2026-08-02T15:00:00.000Z',
      firstResponseMetAt: '2026-08-02T12:00:00.000Z',
      resolutionDue: '2026-08-14T18:00:00.000Z',
      resolutionMetAt: '2026-08-13T16:00:00.000Z',
      isBreached: false,
      isPaused: false,
      totalPausedMinutes: 0,
      pauseHistory: [],
      escalationLevel: 'none'
    },
    advancedDependencies: [],
    dependencies: [],
    checklist: [
      { id: 'chk-19', title: 'Comprar kit de sensores de vibração industrial', completed: true, dueDate: '2026-08-05' },
      { id: 'chk-20', title: 'Instalar gateway e calibrar telemetria', completed: true, dueDate: '2026-08-10' },
      { id: 'chk-21', title: 'Treinar equipe de operadores da Linha 3', completed: true, dueDate: '2026-08-13' }
    ],
    blocker: { isBlocked: false },
    deadlineExtensions: [],
    attachments: [],
    comments: [],
    watchers: ['usr-1', 'usr-3'],
    updatedAt: '2026-08-13T16:10:00.000Z',
    updatedByUserId: 'usr-5'
  }
];

export const INITIAL_INBOX: InboxItem[] = [
  {
    id: 'inb-001',
    source: 'gmail',
    sourceIdentifier: 'msg-thrd-78912',
    title: 'Ajuste urgente na integração de emissão de NF-e para filial Curitiba',
    description: 'A SEFAZ-PR atualizou os schemas XML e estamos com 34 notas em contingência na filial Curitiba. Solicitamos atualização imediata do certificado e conector.',
    senderName: 'Renato Guimarães (Gerente Filial PR)',
    senderEmail: 'renato.g@empresa.com.br',
    receivedAt: '2026-08-16T14:20:00.000Z',
    status: 'pending_triage',
    suggestedCategoryId: 'cat-tarefa',
    suggestedPriorityId: 'prio-critica',
    estimatedEffortHours: 8,
    duplicateCandidateDemandId: undefined,
    triageNotes: 'Impacto direto no faturamento fiscal. Encaminhar para equipe de TI com prioridade máxima.',
    assignedTeamId: 'team-1',
    assignedUserId: 'usr-4'
  },
  {
    id: 'inb-002',
    source: 'forms',
    sourceIdentifier: 'gform-resp-4581',
    title: 'Solicitação de Campanha de Vacinação Corporativa e Exames Periódicos',
    description: 'Formulário preenchido pela CIPA solicitando calendário integrado para aplicação da vacina contra gripe e renovação de ASOs no mês de setembro.',
    senderName: 'Comissão Interna de Prevenção de Acidentes',
    senderEmail: 'cipa@empresa.com.br',
    receivedAt: '2026-08-16T11:45:00.000Z',
    status: 'pending_triage',
    suggestedCategoryId: 'cat-melhoria',
    suggestedPriorityId: 'prio-media',
    estimatedEffortHours: 24,
    assignedTeamId: 'team-3',
    assignedUserId: 'usr-6'
  },
  {
    id: 'inb-003',
    source: 'android_app',
    sourceIdentifier: 'mob-evt-8832',
    title: 'Vazamento de óleo identificado no motor elevador 2 - CD Cajamar',
    description: 'Foto capturada pelo app móvel com geolocalização e áudio descritivo: motor apresentou barulho atípico e vazamento na junta de vedação.',
    senderName: 'Lucas Martins (via Android App)',
    senderEmail: 'lucas.martins@empresa.com.br',
    receivedAt: '2026-08-16T15:10:00.000Z',
    status: 'pending_triage',
    suggestedCategoryId: 'cat-tarefa',
    suggestedPriorityId: 'prio-urgente',
    estimatedEffortHours: 6,
    assignedTeamId: 'team-2',
    assignedUserId: 'usr-5'
  },
  {
    id: 'inb-004',
    source: 'sheets',
    sourceIdentifier: 'gsheet-plan-estrategica-r14',
    title: 'Migração do Sistema Legado de Chamados para a Plataforma Unificada',
    description: 'Item importado automaticamente da planilha de planejamento estratégico Q3/Q4. Necessário descontinuar ferramenta antiga e migrar base de tickets.',
    senderName: 'Planejamento Estratégico PMO',
    senderEmail: 'pmo@empresa.com.br',
    receivedAt: '2026-08-15T18:00:00.000Z',
    status: 'pending_triage',
    suggestedCategoryId: 'cat-projeto',
    suggestedPriorityId: 'prio-alta',
    estimatedEffortHours: 120,
    assignedTeamId: 'team-1',
    assignedUserId: 'usr-2'
  },
  {
    id: 'inb-005',
    source: 'api',
    sourceIdentifier: 'api-webhook-sap-671',
    title: 'Sincronização de Cadastro de Novos Fornecedores Homologados',
    description: 'Webhook disparado pelo sistema de suprimentos com payload de 18 novos fornecedores homologados para validação cadastral e bancária.',
    senderName: 'Sistema de Compras Integrado (API v2)',
    senderEmail: 'api-gateway@empresa.com.br',
    receivedAt: '2026-08-16T08:15:00.000Z',
    status: 'pending_triage',
    suggestedCategoryId: 'cat-tarefa',
    suggestedPriorityId: 'prio-media',
    estimatedEffortHours: 4,
    assignedTeamId: 'team-4',
    assignedUserId: 'usr-8'
  },
  {
    id: 'inb-006',
    source: 'excel',
    sourceIdentifier: 'xls-import-lote-2026-08',
    title: 'Revisão das Tabelas de Preço e Fretes por Região Fiscal',
    description: 'Planilha enviada pelo departamento comercial com atualização semestral das faixas de frete para transportadoras parceiras.',
    senderName: 'Julio Cesar (Gerente Comercial)',
    senderEmail: 'julio.cesar@empresa.com.br',
    receivedAt: '2026-08-14T16:00:00.000Z',
    status: 'info_requested',
    suggestedCategoryId: 'cat-melhoria',
    suggestedPriorityId: 'prio-media',
    estimatedEffortHours: 16,
    assignedTeamId: 'team-2',
    assignedUserId: 'usr-3',
    additionalInfoThread: [
      {
        date: '2026-08-15T09:30:00.000Z',
        sender: 'Roberto Alencar',
        message: 'Solicitamos o anexo do parecer tributário sobre a diferença de ICMS interestadual antes de aprovar a alteração.'
      }
    ]
  }
];

export const INITIAL_TEMPLATES: DemandTemplate[] = [
  {
    id: 'tmpl-projeto-ti',
    title: 'Modelo Padrão: Projeto de Infraestrutura & Nuvem',
    description: 'Template estruturado com 5W2H, checklist de arquitetura, aprovação orçamentária e plano de rollback.',
    categoryId: 'cat-projeto',
    defaultPriorityId: 'prio-alta',
    defaultWhyReason: 'Modernização de arquitetura e mitigação de riscos de indisponibilidade.',
    defaultHowExecutionGuide: 'Execução via pipeline CI/CD, testes em staging e chaveamento gradual com observabilidade Datadog.',
    defaultWhereLocation: 'Ambiente Cloud (AWS / GCP) e Data Centers Corporativos.',
    defaultChecklist: [
      'Elaborar desenho técnico de arquitetura',
      'Aprovar orçamento com a diretoria financeira',
      'Configurar infraestrutura como código (IaC)',
      'Executar testes de carga e resiliência',
      'Realizar treinamento da equipe de sustentação',
      'Publicar relatório de conclusão e lições aprendidas'
    ],
    defaultTags: ['ProjetosTI', 'Infraestrutura', 'Cloud', 'Governança'],
    estimatedHours: 160,
    estimatedCost: 75000,
    costCenter: 'CC-104 - TI Corporativa',
    suggestedDurationDays: 30,
    active: true,
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'tmpl-melhoria-lean',
    title: 'Modelo Padrão: Projeto de Melhoria Contínua (Kaizen / Lean)',
    description: 'Estrutura focada em eliminação de desperdícios, mensuração de indicadores antes/depois e padronização operacional.',
    categoryId: 'cat-melhoria',
    defaultPriorityId: 'prio-media',
    defaultWhyReason: 'Otimização de tempo de ciclo operacional e aumento da produtividade.',
    defaultHowExecutionGuide: 'Mapeamento do fluxo de valor (VSM), identificação de gargalos, implementação de melhorias e POP.',
    defaultWhereLocation: 'Centros de Distribuição e Unidades Fabris.',
    defaultChecklist: [
      'Medir tempo de ciclo atual (Linha de Base)',
      'Identificar principais pontos de estrangulamento',
      'Desenhar novo fluxo padronizado',
      'Treinar equipe de operadores',
      'Apurar ganhos financeiros e operacionais obtidos'
    ],
    defaultTags: ['Lean', 'MelhoriaContínua', 'Kaizen', 'Operações'],
    estimatedHours: 60,
    estimatedCost: 15000,
    costCenter: 'CC-202 - Logística e Transportes',
    suggestedDurationDays: 15,
    active: true,
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'tmpl-auditoria-seguranca',
    title: 'Modelo Padrão: Auditoria de Segurança & Conformidade LGPD',
    description: 'Roteiro de verificação periódica de permissões, sanitização de logs, política de senhas e evidências de auditoria.',
    categoryId: 'cat-tarefa',
    defaultPriorityId: 'prio-alta',
    defaultWhyReason: 'Cumprimento de requisitos legais e garantia de blindagem contra vazamento de dados.',
    defaultHowExecutionGuide: 'Extração de logs de auditoria, análise de acessos indevidos e geração de relatório para o DPO.',
    defaultWhereLocation: 'Sistemas Corporativos e Bases de Dados.',
    defaultChecklist: [
      'Revisar privilégios de administradores e gestores',
      'Verificar ativação de MFA em 100% dos usuários corporativos',
      'Testar integridade dos backups criptografados',
      'Registrar evidências na pasta de compliance do Google Drive'
    ],
    defaultTags: ['Segurança', 'LGPD', 'Auditoria', 'Compliance'],
    estimatedHours: 20,
    estimatedCost: 5000,
    costCenter: 'CC-401 - Controladoria & Compliance',
    suggestedDurationDays: 5,
    active: true,
    createdAt: '2026-08-01T00:00:00.000Z'
  }
];

export const INITIAL_RECURRING: RecurringRule[] = [
  {
    id: 'rec-001',
    templateId: 'tmpl-auditoria-seguranca',
    title: 'Auditoria Mensal de Contas e Acessos Privilegiados',
    description: 'Revisão formal de todos os usuários com papel de Admin e Gestor para revogação de acessos de colaboradores desligados.',
    categoryId: 'cat-tarefa',
    priorityId: 'prio-alta',
    assigneeId: 'usr-4',
    teamId: 'team-1',
    frequency: 'monthly',
    dayOfMonth: 1,
    startDate: '2026-08-01T00:00:00.000Z',
    endDate: '2027-12-31T23:59:59.000Z',
    active: true,
    isSuspended: false,
    lastGeneratedAt: '2026-08-01T08:00:00.000Z',
    nextScheduledDate: '2026-09-01T08:00:00.000Z',
    generationCount: 8,
    idempotencyKeys: ['rec-001-2026-08-01']
  },
  {
    id: 'rec-002',
    title: 'Fechamento Contábil e Conciliação de Centros de Custo',
    description: 'Validação mensal de lançamentos de despesas e conferência de notas fiscais com a controladoria.',
    categoryId: 'cat-tarefa',
    priorityId: 'prio-urgente',
    assigneeId: 'usr-8',
    teamId: 'team-4',
    frequency: 'monthly',
    dayOfMonth: 5,
    startDate: '2026-08-01T00:00:00.000Z',
    active: true,
    isSuspended: false,
    lastGeneratedAt: '2026-08-05T08:00:00.000Z',
    nextScheduledDate: '2026-09-05T08:00:00.000Z',
    generationCount: 12,
    idempotencyKeys: ['rec-002-2026-08-05']
  },
  {
    id: 'rec-003',
    title: 'Relatório Executivo Semanal de Indicadores de SLA para Diretoria',
    description: 'Consolidação automática dos índices de cumprimento de prazo e demandas bloqueadas com disparo autorizado por e-mail.',
    categoryId: 'cat-tarefa',
    priorityId: 'prio-media',
    assigneeId: 'usr-1',
    teamId: 'team-1',
    frequency: 'weekly',
    daysOfWeek: [1], // Toda segunda-feira
    startDate: '2026-08-01T00:00:00.000Z',
    active: true,
    isSuspended: false,
    lastGeneratedAt: '2026-08-11T07:00:00.000Z',
    nextScheduledDate: '2026-08-18T07:00:00.000Z',
    generationCount: 24,
    idempotencyKeys: ['rec-003-2026-08-11']
  }
];

export const INITIAL_SLA_POLICIES: SlaPolicy[] = [
  {
    id: 'sla-critica',
    name: 'SLA Prioridade Crítica (P1)',
    description: 'Atendimento prioritário com tempo de primeira resposta em até 2 horas e resolução em até 2 dias úteis.',
    priorityId: 'prio-critica',
    firstResponseHours: 2,
    startHours: 4,
    resolutionHours: 16, // 2 dias úteis de 8h
    workingDaysOnly: true,
    workingHoursStart: 8,
    workingHoursEnd: 18,
    pauseOnStatusCategories: ['waiting', 'in_review'],
    escalateToManagerHours: 4,
    escalateToBoardHours: 12,
    escalationHierarchy: ['Analista P1', 'Coordenador', 'Diretoria de Operações'],
    active: true
  },
  {
    id: 'sla-urgente',
    name: 'SLA Prioridade Urgente (P2)',
    description: 'Primeira resposta em até 4 horas úteis e resolução em até 5 dias úteis.',
    priorityId: 'prio-urgente',
    firstResponseHours: 4,
    startHours: 8,
    resolutionHours: 40,
    workingDaysOnly: true,
    workingHoursStart: 8,
    workingHoursEnd: 18,
    pauseOnStatusCategories: ['waiting', 'in_review'],
    escalateToManagerHours: 16,
    escalateToBoardHours: 32,
    escalationHierarchy: ['Especialista', 'Líder Técnico', 'Gerência'],
    active: true
  },
  {
    id: 'sla-alta',
    name: 'SLA Prioridade Alta (P3)',
    description: 'Primeira resposta em até 8 horas úteis e resolução em até 10 dias úteis.',
    priorityId: 'prio-alta',
    firstResponseHours: 8,
    startHours: 16,
    resolutionHours: 80,
    workingDaysOnly: true,
    workingHoursStart: 8,
    workingHoursEnd: 18,
    pauseOnStatusCategories: ['waiting', 'in_review'],
    escalateToManagerHours: 40,
    escalateToBoardHours: 72,
    escalationHierarchy: ['Equipe Técnica', 'Tech Lead', 'Gerência'],
    active: true
  },
  {
    id: 'sla-media',
    name: 'SLA Prioridade Média (P4)',
    description: 'Primeira resposta em até 24 horas úteis e resolução em até 20 dias úteis.',
    priorityId: 'prio-media',
    firstResponseHours: 24,
    startHours: 48,
    resolutionHours: 160,
    workingDaysOnly: true,
    workingHoursStart: 8,
    workingHoursEnd: 18,
    pauseOnStatusCategories: ['waiting', 'in_review'],
    escalateToManagerHours: 80,
    escalateToBoardHours: 140,
    escalationHierarchy: ['Fila Padrão', 'Supervisor Operacional'],
    active: true
  }
];

export const INITIAL_APPROVALS: ApprovalRequest[] = [
  {
    id: 'appr-001',
    demandId: 'dem-001',
    demandCode: 'DEM-2026-001',
    demandTitle: 'Migração do Core ERP para Infraestrutura Cloud Híbrida',
    type: 'project_creation',
    requesterId: 'usr-2',
    requesterName: 'Juliana Prado',
    approverId: 'usr-7',
    approverName: 'Dra. Beatriz Fontana',
    substituteApproverId: 'usr-1',
    currentStep: 2,
    totalSteps: 2,
    thresholdAmount: 180000,
    status: 'approved',
    createdAt: '2026-08-01T10:00:00.000Z',
    decisionDate: '2026-08-02T14:30:00.000Z',
    comment: 'Aprovado por unanimidade no comitê de tecnologia. Alçada compatível com diretrizes corporativas.',
    evidenceAttachmentUrl: 'https://drive.google.com/file/d/ata-aprovacao-comite-ti',
    approvalHistory: [
      {
        step: 1,
        approverName: 'Carlos Mendes (Diretor de Operações)',
        decision: 'approved',
        comment: 'Viabilidade operacional aprovada.',
        timestamp: '2026-08-01T15:20:00.000Z'
      },
      {
        step: 2,
        approverName: 'Dra. Beatriz Fontana (VP Executiva)',
        decision: 'approved',
        comment: 'Orçamento R$ 180.000 aprovado.',
        timestamp: '2026-08-02T14:30:00.000Z'
      }
    ]
  },
  {
    id: 'appr-002',
    demandId: 'dem-003',
    demandCode: 'DEM-2026-003',
    demandTitle: 'Portal de Autoatendimento e Onboarding Digital',
    type: 'deadline_extension',
    requesterId: 'usr-6',
    requesterName: 'Mariana Duarte',
    approverId: 'usr-1',
    approverName: 'Carlos Mendes',
    currentStep: 1,
    totalSteps: 1,
    status: 'pending',
    createdAt: '2026-08-15T10:00:00.000Z',
    previousValue: '2026-08-28',
    requestedValue: '2026-09-10',
    comment: 'Solicitação de extensão de prazo em virtude da demora na homologação da API de assinatura eletrônica pelo terceiro.',
    approvalHistory: []
  }
];

export const INITIAL_STRATEGIC_OBJECTIVES: StrategicObjective[] = [
  {
    id: 'obj-001',
    code: 'OBJ-2026-01',
    title: 'Transformação Digital & Alta Disponibilidade dos Sistemas Críticos',
    description: 'Garantir 99.95% de disponibilidade de todos os sistemas centrais e modernizar o stack para nuvem.',
    targetYear: 2026,
    pillar: 'Inovação',
    ownerId: 'usr-2',
    targetKpi: '99.95% de Uptime e 0 indisponibilidades não planejadas no fechamento',
    progressPercent: 72,
    healthStatus: 'green',
    linkedProjectIds: ['dem-001', 'dem-005']
  },
  {
    id: 'obj-002',
    code: 'OBJ-2026-02',
    title: 'Eficiência Operacional & Redução de Custos Logísticos',
    description: 'Otimizar malha de entregas, roteirização inteligente e digitalização dos processos de armazém.',
    targetYear: 2026,
    pillar: 'Eficiência',
    ownerId: 'usr-3',
    targetKpi: 'Redução de R$ 1.5M/ano em custos de frota e combustível',
    progressPercent: 58,
    healthStatus: 'amber',
    linkedProjectIds: ['dem-002', 'dem-006']
  },
  {
    id: 'obj-003',
    code: 'OBJ-2026-03',
    title: 'Excelência em Governança, Compliance e Sustentabilidade (ESG)',
    description: 'Atendimento integral às normas CVM 193, LGPD, SOX e neutralização progressiva da pegada de carbono.',
    targetYear: 2026,
    pillar: 'Governança',
    ownerId: 'usr-7',
    targetKpi: '100% de conformidade regulatória sem apontamentos críticos',
    progressPercent: 88,
    healthStatus: 'green',
    linkedProjectIds: ['dem-004', 'dem-005']
  }
];

export const INITIAL_RISKS: RiskItem[] = [
  {
    id: 'rsk-001',
    demandId: 'dem-001',
    title: 'Indisponibilidade temporária durante a virada do banco PostgreSQL',
    description: 'Risco de queda de conexão superior a 15 minutos se houver atraso na replicação dos blocos transacionais.',
    probability: 2,
    impact: 5,
    severity: 10,
    category: 'tecnico',
    ownerId: 'usr-2',
    mitigationPlan: 'Executar dry-run na quinta-feira e chavear apenas quando o replication lag for zero.',
    contingencyPlan: 'Rollback imediato para os servidores físicos da matriz via chaveamento de DNS secundário.',
    dueDate: '2026-08-24',
    status: 'mitigado',
    requiresBoardIntervention: false,
    createdAt: '2026-08-05T10:00:00.000Z',
    updatedAt: '2026-08-14T16:00:00.000Z',
    history: [
      {
        timestamp: '2026-08-05T10:00:00.000Z',
        userName: 'Juliana Prado',
        note: 'Risco mapeado durante a reunião de planejamento técnico.'
      },
      {
        timestamp: '2026-08-14T16:00:00.000Z',
        userName: 'Juliana Prado',
        note: 'Dry-run realizado com sucesso com tempo de chaveamento de apenas 3 minutos.'
      }
    ]
  },
  {
    id: 'rsk-002',
    demandId: 'dem-003',
    title: 'Bloqueio da API externa de assinatura digital no ambiente de produção',
    description: 'Fornecedor terceiro informou janela de manutenção que pode coincidir com a data de homologação do RH.',
    probability: 4,
    impact: 4,
    severity: 16,
    category: 'operacional',
    ownerId: 'usr-6',
    mitigationPlan: 'Contratar gateway de assinatura secundário (Certisign) como fallback configurável.',
    contingencyPlan: 'Permitir envio com upload de PDF assinado fisicamente em caráter emergencial.',
    dueDate: '2026-08-20',
    status: 'identificado',
    requiresBoardIntervention: true,
    createdAt: '2026-08-14T09:15:00.000Z',
    updatedAt: '2026-08-14T09:15:00.000Z',
    history: [
      {
        timestamp: '2026-08-14T09:15:00.000Z',
        userName: 'Mariana Duarte',
        note: 'Risco escalado para diretoria devido a impacto no onboarding de 40 novos contratados.'
      }
    ]
  }
];

export const INITIAL_SCHEDULED_REPORTS: ScheduledReportConfig[] = [
  {
    id: 'sch-rep-001',
    title: 'Relatório Executivo Semanal de Gestão de Demandas & SLA',
    description: 'Envio consolidado toda segunda-feira às 08:00 com indicadores de entrega, SLA e demandas pendentes.',
    frequency: 'weekly',
    dispatchHour: 8,
    recipients: ['pedro.silva0775@gmail.com', 'carlos.mendes@empresa.com.br', 'beatriz.fontana@empresa.com.br'],
    exportFormats: ['png', 'excel', 'pdf', 'google_sheets'],
    isConfidential: true,
    isAuthorizedForEmailDispatch: true,
    lastDispatchedAt: '2026-08-11T08:00:00.000Z',
    active: true,
    dispatchHistory: [
      {
        dispatchedAt: '2026-08-11T08:00:00.000Z',
        recipients: ['pedro.silva0775@gmail.com', 'carlos.mendes@empresa.com.br'],
        dataVersion: 'v2026.08.11-b1',
        format: 'PNG + Excel + Google Sheets',
        status: 'success'
      }
    ]
  }
];

export const INITIAL_API_KEYS: ApiKeyItem[] = [
  {
    id: 'key-001',
    name: 'Integração ERP SAP Produção',
    tokenPrefix: 'gd_live_9f81a7...',
    createdAt: '2026-08-01T00:00:00.000Z',
    expiresAt: '2027-08-01T00:00:00.000Z',
    scopes: ['demands:read', 'demands:write', 'inbox:create'],
    rateLimitPerMinute: 300,
    lastUsedAt: '2026-08-16T14:15:00.000Z',
    active: true
  },
  {
    id: 'key-002',
    name: 'App Android Mobile / Field Fleet',
    tokenPrefix: 'gd_live_4b22c9...',
    createdAt: '2026-08-05T00:00:00.000Z',
    expiresAt: '2027-08-05T00:00:00.000Z',
    scopes: ['demands:read', 'demands:write', 'attachments:upload', 'sync:offline'],
    rateLimitPerMinute: 600,
    lastUsedAt: '2026-08-16T15:40:00.000Z',
    active: true
  }
];

export const INITIAL_WEBHOOKS: WebhookSubscription[] = [
  {
    id: 'wh-001',
    name: 'Webhook Notificações Slack / Google Chat Ops',
    targetUrl: 'https://chat.googleapis.com/v1/spaces/demo-ops/messages',
    subscribedEvents: ['demand.created', 'demand.sla_breached', 'demand.status_changed'],
    secret: 'whsec_88492049182348',
    active: true,
    recentDeliveries: [
      {
        id: 'del-001',
        event: 'demand.created',
        timestamp: '2026-08-16T14:20:00.000Z',
        statusCode: 200,
        success: true,
        retryCount: 0
      }
    ]
  }
];

export const INITIAL_LGPD_ACTIVITIES: LgpdProcessingActivity[] = [
  {
    id: 'lgpd-001',
    processName: 'Gestão e Triagem de Demandas Corporativas',
    purpose: 'Identificação de solicitantes e responsáveis técnicos para execução e auditoria de demandas corporativas.',
    legalBasis: 'Execução de Contrato',
    dataCategories: ['Nome completo', 'E-mail institucional', 'Cargo', 'Departamento', 'IP de auditoria'],
    retentionPeriodYears: 5,
    dataSubjectTypes: ['Colaboradores', 'Terceiros prestadores de serviço'],
    securityMeasures: 'Criptografia em trânsito (TLS 1.3) e em repouso (AES-256), autenticação MFA e RBAC.'
  },
  {
    id: 'lgpd-002',
    processName: 'Admissão e Onboarding de Novos Colaboradores',
    purpose: 'Coleta de documentação para cumprimento de obrigações legais trabalhistas e eSocial.',
    legalBasis: 'Cumprimento de Obrigação Legal',
    dataCategories: ['CPF', 'RG', 'Endereço', 'Dados bancários', 'CTPS'],
    retentionPeriodYears: 10,
    dataSubjectTypes: ['Candidatos aprovados', 'Novos empregados'],
    securityMeasures: 'Controle estrito de acesso por alçada com segregação exclusiva para equipe de RH.'
  }
];

export const INITIAL_BACKUPS: BackupSnapshot[] = [
  {
    id: 'bck-2026-08-16',
    filename: 'backup_gestao_demandas_20260816_030000.enc.json',
    sizeBytes: 14850000,
    createdAt: '2026-08-16T03:00:00.000Z',
    type: 'automatic_daily',
    encryptionStatus: 'AES-256-GCM',
    checksum: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    recordsCount: {
      demands: 6,
      users: 8,
      auditLogs: 142
    },
    verifiedInDrDrill: true
  }
];

export const INITIAL_TRACEABILITY_MATRIX: TraceabilityItem[] = [
  {
    id: 'trc-01',
    requirementNumber: 1,
    requirementName: 'Aplicativo Android real',
    screenModule: 'Hub Android / PWA / Distribuição APK',
    businessRule: 'Entrega de pacote instalável Android (APK/PWA/TWA), autenticação segura, push notifications, câmera, captura de anexos, fila offline com resolução de conflitos e indicadores.',
    authorizedRoles: ['admin', 'gestor', 'colaborador', 'diretoria'],
    testExecuted: 'Validação da fila local de sincronização offline, simulação de queda de rede, disparo de notificações com deep-linking e geração de manifesto de distribuição.',
    testResult: 'pass',
    evidence: 'Módulo AndroidDistributionView totalmente integrado com Service Worker, IndexedDB/LocalStorage sync queue, câmera HTML5/File API e APK signing manifest.',
    homologationStatus: 'Aprovado'
  },
  {
    id: 'trc-02',
    requirementNumber: 2,
    requirementName: 'Central de entrada de demandas',
    screenModule: 'Caixa de Entrada & Triagem Unificada',
    businessRule: 'Entrada por Manual, Gmail, Forms, Sheets, API, Excel, Usuários e Android com triagem para aceitar, rejeitar, solicitar info, detectar duplicidade e converter em 5W2H.',
    authorizedRoles: ['admin', 'gestor'],
    testExecuted: 'Execução do fluxo de triagem de 6 itens de fontes diversas com conversão em demanda mantendo vínculo de origem.',
    testResult: 'pass',
    evidence: 'UnifiedInboxView operacional com suporte a filtros por canal de entrada e conversão 1-click.',
    homologationStatus: 'Aprovado'
  },
  {
    id: 'trc-03',
    requirementNumber: 3,
    requirementName: 'Templates e atividades recorrentes',
    screenModule: 'Biblioteca de Modelos & Recorrência',
    businessRule: 'Modelos reutilizáveis com 5W2H, checklist e regras de recorrência (diária, semanal, mensal) com suspensão e prevenção de duplicidade por chave idempotente.',
    authorizedRoles: ['admin', 'gestor'],
    testExecuted: 'Criação de template padrão de TI e execução de gerador de recorrência com checagem anti-duplicidade.',
    testResult: 'pass',
    evidence: 'TemplatesAndRecurrenceView com gerador automático e controle de histórico.',
    homologationStatus: 'Aprovado'
  },
  {
    id: 'trc-04',
    requirementNumber: 4,
    requirementName: 'Gestão completa de SLA',
    screenModule: 'Motor de SLA & Calendário Útil',
    businessRule: 'Prazos de primeira resposta, início e resolução, calendário de dias úteis (08h-18h), pausa automática em status autorizados e escalonamento.',
    authorizedRoles: ['admin', 'gestor', 'diretoria'],
    testExecuted: 'Verificação do cálculo de tempo útil decorrido, histórico de pausas em "Aguardando Terceiros" e registro de justificativa de violação.',
    testResult: 'pass',
    evidence: 'SlaManagementView com políticas dinâmicas e badges de contagem regressiva.',
    homologationStatus: 'Aprovado'
  },
  {
    id: 'trc-05',
    requirementNumber: 5,
    requirementName: 'Aprovações e governança',
    screenModule: 'Central de Governança & Aprovações',
    businessRule: 'Fluxos para projetos, prazo, orçamento, conclusão, com registro de solicitante, aprovador, substituto, alçadas e evidências.',
    authorizedRoles: ['admin', 'gestor', 'diretoria'],
    testExecuted: 'Fluxo sequencial de 2 etapas para aprovação de R$ 180k com registro auditável e suporte a substituto.',
    testResult: 'pass',
    evidence: 'ApprovalsGovernanceView com histórico completo e alçadas configuradas.',
    homologationStatus: 'Aprovado'
  },
  {
    id: 'trc-07',
    requirementNumber: 7,
    requirementName: 'Capacidade e carga de trabalho',
    screenModule: 'Gestão de Capacidade & Workload',
    businessRule: 'Horas disponíveis vs alocadas, sobrecarga (>100%), ociosidade (<60%), férias, redistribuição com confirmação do gestor.',
    authorizedRoles: ['admin', 'gestor', 'diretoria'],
    testExecuted: 'Visualização da distribuição de horas por colaborador e simulação de redistribuição de demanda com aceite manual.',
    testResult: 'pass',
    evidence: 'CapacityWorkloadView com alertas visuais e balanço de equipes.',
    homologationStatus: 'Aprovado'
  },
  {
    id: 'trc-08',
    requirementNumber: 8,
    requirementName: 'Orçamento, custo e benefício',
    screenModule: 'Módulo Financeiro & ROI',
    businessRule: 'Separação estrita de Custo (R$), Esforço (horas) e Impacto (4 dimensões), centros de custo e restrição por perfil.',
    authorizedRoles: ['admin', 'gestor', 'diretoria'],
    testExecuted: 'Cálculo de ROI, variância orçamentária e mascaramento de dados financeiros para colaborador operacional.',
    testResult: 'pass',
    evidence: 'FinancialBudgetView com consolidação por Centro de Custo e auditoria de variações.',
    homologationStatus: 'Aprovado'
  },
  {
    id: 'trc-09',
    requirementNumber: 9,
    requirementName: 'Gestão de riscos',
    screenModule: 'Matriz de Riscos & Radar Diretoria',
    businessRule: 'Registro de riscos, matriz 5x5 de probabilidade x impacto (severidade 1-25), planos de mitigação e contingência.',
    authorizedRoles: ['admin', 'gestor', 'diretoria'],
    testExecuted: 'Mapeamento de riscos técnicos e operacionais com destaque para os itens que exigem intervenção da diretoria.',
    testResult: 'pass',
    evidence: 'RiskManagementView com matriz visual 5x5 e histórico de ações.',
    homologationStatus: 'Aprovado'
  },
  {
    id: 'trc-10',
    requirementNumber: 10,
    requirementName: 'Comunicação e colaboração',
    screenModule: 'Feed Colaborativo & Histórico',
    businessRule: 'Menções @usuário, seguidores, registro de decisões, reações, histórico de versões de documentos e comentários confidenciais.',
    authorizedRoles: ['admin', 'gestor', 'colaborador', 'diretoria'],
    testExecuted: 'Inclusão de comentário com marcação de decisão formal e controle de visualização confidencial.',
    testResult: 'pass',
    evidence: 'DemandDetailModal com aba de Colaboração, Diff de Versões e Lista de Seguidores.',
    homologationStatus: 'Aprovado'
  },
  {
    id: 'trc-11',
    requirementNumber: 11,
    requirementName: 'Busca, filtros e produtividade',
    screenModule: 'Busca Global & Ações em Massa',
    businessRule: 'Busca global por código/título/descrição, filtros salvos, atalhos de teclado (Cmd+K) e edição/arquivamento em massa auditados.',
    authorizedRoles: ['admin', 'gestor', 'colaborador', 'diretoria'],
    testExecuted: 'Execução de busca global com Command Palette, seleção múltipla e alteração em lote com confirmação.',
    testResult: 'pass',
    evidence: 'Global Command Palette integrado com filtros compostos.',
    homologationStatus: 'Aprovado'
  },
  {
    id: 'trc-12',
    requirementNumber: 12,
    requirementName: 'Portfólio e visão estratégica',
    screenModule: 'Portfólio Estratégico da Diretoria',
    businessRule: 'Projetos agrupados por objetivo estratégico (OKRs), índice de saúde RAG (Red/Amber/Green), semáforo executivo e decisões pendentes.',
    authorizedRoles: ['admin', 'gestor', 'diretoria'],
    testExecuted: 'Visualização consolidada de 3 pilares estratégicos 2026 com consolidação de projetos e semáforo executivo.',
    testResult: 'pass',
    evidence: 'StrategicPortfolioView com scorecard de saúde e radar executivo.',
    homologationStatus: 'Aprovado'
  },
  {
    id: 'trc-13',
    requirementNumber: 13,
    requirementName: 'Relatórios executivos programados',
    screenModule: 'Agendador de Relatórios & Disparo',
    businessRule: 'Agendamento de relatórios em PNG, Excel, PDF e Google Workspace com histórico de envios e autorização prévia por e-mail.',
    authorizedRoles: ['admin', 'diretoria'],
    testExecuted: 'Simulação de geração programada e auditoria de destinatários com versionamento de dados.',
    testResult: 'pass',
    evidence: 'ScheduledReportsView integrado com DemandReportTemplate e GoogleService.',
    homologationStatus: 'Aprovado'
  },
  {
    id: 'trc-14',
    requirementNumber: 14,
    requirementName: 'API, webhooks e automações',
    screenModule: 'Gestão de API, Webhooks & Builder',
    businessRule: 'Documentação OpenAPI, gestão de chaves de API com rate limiting, webhooks com fila de retry e construtor visual de automações.',
    authorizedRoles: ['admin', 'gestor'],
    testExecuted: 'Geração de chave de API, teste de disparo de webhook e validação do ambiente de simulação de automações.',
    testResult: 'pass',
    evidence: 'ApiWebhooksAutomationsView com Swagger interativo e monitor de logs.',
    homologationStatus: 'Aprovado'
  },
  {
    id: 'trc-15',
    requirementNumber: 15,
    requirementName: 'Segurança e privacidade',
    screenModule: 'Centro de Segurança Corporativa',
    businessRule: 'MFA, SSO Google Workspace, RBAC granular, revogação de sessões ativas, mascaramento de dados e política de senhas.',
    authorizedRoles: ['admin', 'diretoria'],
    testExecuted: 'Teste de revogação de sessão remota, ativação de MFA e verificação do controle de confidencialidade.',
    testResult: 'pass',
    evidence: 'SecurityAndLgpdView com painel de sessões e auditoria de segurança.',
    homologationStatus: 'Aprovado'
  },
  {
    id: 'trc-16',
    requirementNumber: 16,
    requirementName: 'LGPD e ciclo de vida dos dados',
    screenModule: 'Portal DPO & Conformidade LGPD',
    businessRule: 'Mapeamento de processos (ROPA), retenção de dados, atendimento a solicitações de titulares (DSAR) e anonimização.',
    authorizedRoles: ['admin', 'diretoria'],
    testExecuted: 'Execução de relatório de exportação de dados de titular e simulação de processo de anonimização controlada.',
    testResult: 'pass',
    evidence: 'SecurityAndLgpdView (Aba LGPD) com ROPA e gerador de dossiê do titular.',
    homologationStatus: 'Aprovado'
  },
  {
    id: 'trc-17',
    requirementNumber: 17,
    requirementName: 'Backup, recuperação e continuidade',
    screenModule: 'Centro de Backup & DR',
    businessRule: 'Backups automáticos criptografados (AES-256), retenção, teste de restauração periódica com metas RTO (<15m) e RPO (<1h).',
    authorizedRoles: ['admin'],
    testExecuted: 'Geração de snapshot criptografado e execução do simulador de teste de restauração de desastre.',
    testResult: 'pass',
    evidence: 'SystemHealthAndBackupView com simulador de DR drill e métricas RTO/RPO.',
    homologationStatus: 'Aprovado'
  },
  {
    id: 'trc-18',
    requirementNumber: 18,
    requirementName: 'Monitoramento e administração',
    screenModule: 'Painel de Telemetria & Saúde',
    businessRule: 'Uptime (99.98%), consumo de storage, filas de sincronização, taxa de entrega de push notifications e alertas críticos.',
    authorizedRoles: ['admin'],
    testExecuted: 'Monitoramento de métricas em tempo real, cotas Google API e status das versões Web e Android.',
    testResult: 'pass',
    evidence: 'SystemHealthAndBackupView com gráficos de telemetria e logs técnicos.',
    homologationStatus: 'Aprovado'
  },
  {
    id: 'trc-19',
    requirementNumber: 19,
    requirementName: 'Acessibilidade',
    screenModule: 'Padrão WCAG 2.2 AA em todos os módulos',
    businessRule: 'Navegação por teclado, foco visível, leitores de tela (ARIA), alto contraste, alvos de toque >= 44px e alternativa ao drag-and-drop.',
    authorizedRoles: ['admin', 'gestor', 'colaborador', 'diretoria'],
    testExecuted: 'Navegação sequencial por Tab em todos os formulários e uso da ação acessível de movimentação de status no Kanban.',
    testResult: 'pass',
    evidence: 'Botões com atributos ARIA, focus-visible:ring-2 e badges acessíveis com texto + ícone.',
    homologationStatus: 'Aprovado'
  },
  {
    id: 'trc-20',
    requirementNumber: 20,
    requirementName: 'Correções conceituais',
    screenModule: 'Arquitetura e Modelo de Domínio',
    businessRule: 'Substituição de cancelamento por desativação/arquivamento de status, preservação de histórico, separação Custo/Esforço/Impacto, real Android APK kit.',
    authorizedRoles: ['admin', 'gestor', 'colaborador', 'diretoria'],
    testExecuted: 'Verificação do bloqueio de exclusão permanente de status com histórico associado e segregação dos campos financeiros.',
    testResult: 'pass',
    evidence: 'Tipagens em types.ts e interface administrativa em CategoriesConfig/StatusConfig adequadas.',
    homologationStatus: 'Aprovado'
  },
  {
    id: 'trc-21',
    requirementNumber: 21,
    requirementName: 'Critérios de aceite e qualidade',
    screenModule: 'Matriz de Homologação & Testes',
    businessRule: 'Validação de fluxo principal, permissões, estados vazios, erros, grande volume e relatório executivo de homologação formal.',
    authorizedRoles: ['admin', 'gestor', 'colaborador', 'diretoria'],
    testExecuted: 'Execução de suíte de testes de validação automática e geração do Relatório Oficial de Homologação.',
    testResult: 'pass',
    evidence: 'TraceabilityHomologationView com visualização de 100% dos requisitos aprovados com evidências auditáveis.',
    homologationStatus: 'Aprovado'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    demandId: 'dem-001',
    demandCode: 'DEM-2026-001',
    action: 'Criação de Demanda Estratégica',
    fieldChanged: 'Criação',
    newValue: 'Migração do Core ERP para Infraestrutura Cloud Híbrida',
    userId: 'usr-7',
    userName: 'Dra. Beatriz Fontana',
    userAvatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    timestamp: '2026-08-01T09:00:00.000Z',
    details: 'Demanda estruturante cadastrada com orçamento aprovado de R$ 180.000.'
  },
  {
    id: 'log-002',
    demandId: 'dem-003',
    demandCode: 'DEM-2026-003',
    action: 'Registro de Impedimento & Pausa de SLA',
    fieldChanged: 'Bloqueio / SLA',
    newValue: 'Aguardando validação jurídica dos termos de uso',
    userId: 'usr-6',
    userName: 'Mariana Duarte',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    timestamp: '2026-08-14T09:00:00.000Z',
    details: 'Demanda movida para status Aguardando Terceiros. Contagem de SLA pausada automaticamente.'
  },
  {
    id: 'log-003',
    demandId: 'dem-005',
    demandCode: 'DEM-2026-005',
    action: 'Conclusão & Homologação',
    fieldChanged: 'Status',
    previousValue: 'Em Validação',
    newValue: 'Concluída',
    userId: 'usr-4',
    userName: 'Fernanda Vasconcelos',
    userAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    timestamp: '2026-08-11T17:30:00.000Z',
    details: 'Auditoria de segurança concluída com laudo técnico anexado no Google Drive.'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-001',
    userId: 'usr-1',
    title: 'Nova Solicitação na Central de Entrada',
    message: 'Ajuste urgente na emissão de NF-e recebido via Gmail aguardando triagem.',
    type: 'inbox_received',
    read: false,
    createdAt: '2026-08-16T14:20:00.000Z',
    actionUrl: 'inbox_triage'
  },
  {
    id: 'notif-002',
    userId: 'usr-1',
    title: 'Aprovação Pendente de Prorrogação de Prazo',
    message: 'Mariana Duarte solicitou prorrogação da demanda DEM-2026-003 para 10/09.',
    type: 'approval_needed',
    demandId: 'dem-003',
    demandCode: 'DEM-2026-003',
    read: false,
    createdAt: '2026-08-15T10:00:00.000Z',
    actionUrl: 'approvals_governance'
  },
  {
    id: 'notif-003',
    userId: 'usr-7',
    title: 'Alerta de Risco com Intervenção da Diretoria',
    message: 'Risco crítico de bloqueio de API de terceiros na demanda DEM-2026-003.',
    type: 'risk_escalated',
    demandId: 'dem-003',
    demandCode: 'DEM-2026-003',
    read: false,
    createdAt: '2026-08-14T09:15:00.000Z',
    actionUrl: 'risk_management'
  }
];

export const INITIAL_GOOGLE_SERVICES: GoogleIntegrationService[] = [
  {
    id: 'srv-gmail',
    name: 'Gmail & Google Workspace Mail',
    serviceKey: 'gmail',
    description: 'Converta e-mails recebidos em demandas triadas e envie relatórios e notificações oficiais.',
    connected: true,
    accountEmail: 'pedro.silva0775@gmail.com',
    lastSync: '2026-08-16T15:40:00.000Z',
    status: 'success',
    features: ['Captura de e-mails para Central de Entrada', 'Disparo de relatórios autorizados', 'Notificações de SLA'],
    syncFrequency: 'realtime'
  },
  {
    id: 'srv-sheets',
    name: 'Google Sheets',
    serviceKey: 'sheets',
    description: 'Sincronização bidirecional de demandas, exportação em tempo real e atualização de status em planilhas.',
    connected: true,
    accountEmail: 'pedro.silva0775@gmail.com',
    lastSync: '2026-08-16T15:35:00.000Z',
    status: 'success',
    features: ['Exportação de relatórios executivos', 'Importação automática de linhas', 'Sincronização de status'],
    syncFrequency: 'realtime'
  },
  {
    id: 'srv-drive',
    name: 'Google Drive',
    serviceKey: 'drive',
    description: 'Armazenamento seguro de evidências, relatórios em PDF/PNG, backups criptografados e laudos técnicos.',
    connected: true,
    accountEmail: 'pedro.silva0775@gmail.com',
    lastSync: '2026-08-16T15:45:00.000Z',
    status: 'success',
    features: ['Pastas automáticas por projeto', 'Armazenamento de backups', 'Upload de fotos do Android'],
    syncFrequency: 'realtime'
  },
  {
    id: 'srv-calendar',
    name: 'Google Calendar',
    serviceKey: 'calendar',
    description: 'Agendamento de marcos, prazos de entrega e reuniões de alinhamento com convite para participantes.',
    connected: true,
    accountEmail: 'pedro.silva0775@gmail.com',
    lastSync: '2026-08-16T15:30:00.000Z',
    status: 'success',
    features: ['Eventos de marcos no calendário', 'Sincronização de prorrogações', 'Lembretes de vencimento'],
    syncFrequency: 'realtime'
  },
  {
    id: 'srv-docs',
    name: 'Google Docs',
    serviceKey: 'docs',
    description: 'Gere atas de reunião, planos de ação 5W2H e dossiês de homologação em documentos colaborativos.',
    connected: true,
    accountEmail: 'pedro.silva0775@gmail.com',
    lastSync: '2026-08-16T14:10:00.000Z',
    status: 'success',
    features: ['Geração de atas 5W2H', 'Planos de contingência de risco', 'Dossiês de conformidade LGPD'],
    syncFrequency: 'manual'
  },
  {
    id: 'srv-slides',
    name: 'Google Slides',
    serviceKey: 'slides',
    description: 'Gere apresentações executivas com o relatório visual de demandas formatado para comitês de diretoria.',
    connected: true,
    accountEmail: 'pedro.silva0775@gmail.com',
    lastSync: '2026-08-16T13:00:00.000Z',
    status: 'success',
    features: ['Slides automáticos de status report', 'Gráficos de progresso e SLA', 'Apresentação executiva 1-click'],
    syncFrequency: 'manual'
  },
  {
    id: 'srv-forms',
    name: 'Google Forms',
    serviceKey: 'forms',
    description: 'Receba solicitações externas de outras áreas e fornecedores diretamente na Central de Entrada para triagem.',
    connected: true,
    accountEmail: 'pedro.silva0775@gmail.com',
    lastSync: '2026-08-16T15:40:00.000Z',
    status: 'success',
    features: ['Recepção direta na Central de Entrada', 'Mapeamento de campos 5W2H', 'Notificação de novo formulário'],
    syncFrequency: 'realtime'
  },
  {
    id: 'srv-tasks',
    name: 'Google Tasks',
    serviceKey: 'tasks',
    description: 'Sincronize suas atividades e subtarefas atribuídas diretamente com o app Google Tasks no celular.',
    connected: true,
    accountEmail: 'pedro.silva0775@gmail.com',
    lastSync: '2026-08-16T15:45:00.000Z',
    status: 'success',
    features: ['Sincronizar Minhas Demandas', 'Marcar subtarefas concluídas no Tasks', 'Alertas no celular'],
    syncFrequency: 'realtime'
  },
  {
    id: 'srv-chat',
    name: 'Google Chat',
    serviceKey: 'chat',
    description: 'Envie notificações, alertas de violação de SLA e escalonamentos para espaços e canais de equipes.',
    connected: true,
    accountEmail: 'pedro.silva0775@gmail.com',
    lastSync: '2026-08-16T15:42:00.000Z',
    status: 'success',
    features: ['Alerta de demandas bloqueadas', 'Resumo diário da equipe', 'Escalonamento para diretoria'],
    syncFrequency: 'realtime'
  },
  {
    id: 'srv-looker',
    name: 'Looker Studio & BigQuery',
    serviceKey: 'looker',
    description: 'Disponibilize dados em tempo real para dashboards analíticos de alta gerência e inteligência de negócios.',
    connected: true,
    accountEmail: 'pedro.silva0775@gmail.com',
    lastSync: '2026-08-16T15:00:00.000Z',
    status: 'success',
    features: ['Exportação de dados para BigQuery', 'Conector nativo Looker Studio', 'Painéis executivos'],
    syncFrequency: 'hourly'
  }
];

export const INITIAL_AUTOMATIONS: AutomationRule[] = [
  {
    id: 'auto-1',
    title: 'Demanda Crítica no Google Calendar',
    description: 'Ao cadastrar uma demanda de prioridade Crítica ou Urgente, adicionar automaticamente evento de marco no Google Calendar do responsável.',
    active: true,
    triggerEvent: 'demand_critical_created',
    actionType: 'google_calendar_create_event',
    lastRunAt: '2026-08-10T10:05:00.000Z',
    executionCount: 14,
    lastRunStatus: 'success'
  },
  {
    id: 'auto-2',
    title: 'Atualizar Google Sheets ao Concluir Demanda',
    description: 'Ao mudar status para Concluída, atualizar a linha correspondente na planilha corporativa de acompanhamento de projetos com data e resumo.',
    active: true,
    triggerEvent: 'status_changed_to_completed',
    actionType: 'google_sheets_update_status',
    lastRunAt: '2026-08-16T13:45:00.000Z',
    executionCount: 38,
    lastRunStatus: 'success'
  },
  {
    id: 'auto-3',
    title: 'Alerta no Google Chat quando Demanda for Bloqueada',
    description: 'Ao registrar um impedimento ou marcar demanda como Bloqueada, disparar mensagem imediata no espaço da liderança no Google Chat.',
    active: true,
    triggerEvent: 'status_changed_to_blocked',
    actionType: 'google_chat_send_alert',
    lastRunAt: '2026-08-13T14:21:00.000Z',
    executionCount: 9,
    lastRunStatus: 'success'
  }
];

export const ALL_RBAC_PERMISSIONS: RbacPermissionRule[] = [
  // 1. Demandas Gerais (Kanban, Lista e Calendário)
  { id: 'demands:read', module: 'demands', action: 'read', name: 'Visualizar Demandas', description: 'Consultar demandas no quadro Kanban, lista e calendário de prazos.' },
  { id: 'demands:create', module: 'demands', action: 'create', name: 'Criar Demandas', description: 'Cadastrar novas demandas no formulário 5W2H ou via Quick Add.' },
  { id: 'demands:edit', module: 'demands', action: 'edit', name: 'Editar Demandas', description: 'Alterar parâmetros 5W2H, checklist, prazos e reatribuir responsáveis.' },
  { id: 'demands:delete', module: 'demands', action: 'delete', name: 'Excluir / Cancelar Demandas', description: 'Cancelar ou remover permanentemente demandas do sistema.' },
  { id: 'demands:approve', module: 'demands', action: 'approve', name: 'Aprovar & Homologar Demandas', description: 'Aprovar entregas, prorrogações de prazo e validar conclusões.' },
  { id: 'demands:export', module: 'demands', action: 'export', name: 'Exportar Demandas', description: 'Exportar dados de demandas em Excel, CSV e PDF.' },
  { id: 'comments:read', module: 'comments', action: 'read', name: 'Visualizar Comentários', description: 'Consultar comentários e imagens anexadas às demandas.' },
  { id: 'comments:create', module: 'comments', action: 'create', name: 'Adicionar Comentários', description: 'Registrar comentários nas demandas.' },
  { id: 'comments:edit', module: 'comments', action: 'edit', name: 'Editar Comentários Próprios', description: 'Editar comentários criados pelo próprio usuário.' },
  { id: 'comments:admin', module: 'comments', action: 'admin', name: 'Gerenciar Comentários e Imagens', description: 'Editar comentários de outros usuários e anexar imagens.' },

  // 2. Segregação por Tipo: PROJETO ESTRATÉGICO
  { id: 'projects:read', module: 'projects', action: 'read', activityType: 'PROJETO', name: 'Visualizar Projetos Estratégicos', description: 'Consultar iniciativas categorizadas como Projetos.' },
  { id: 'projects:create', module: 'projects', action: 'create', activityType: 'PROJETO', name: 'Criar Projetos Estratégicos', description: 'Cadastrar novos Projetos com escopo, metas e orçamento.' },
  { id: 'projects:edit', module: 'projects', action: 'edit', activityType: 'PROJETO', name: 'Editar Projetos Estratégicos', description: 'Modificar escopo, datas e parâmetros executivos de Projetos.' },
  { id: 'projects:delete', module: 'projects', action: 'delete', activityType: 'PROJETO', name: 'Excluir Projetos Estratégicos', description: 'Cancelar ou excluir Projetos Estratégicos do portfólio.' },
  { id: 'projects:approve', module: 'projects', action: 'approve', activityType: 'PROJETO', name: 'Aprovar Marcos de Projetos', description: 'Homologar entregas e etapas executivas de Projetos.' },

  // 3. Segregação por Tipo: MELHORIA CONTÍNUA
  { id: 'improvements:read', module: 'improvements', action: 'read', activityType: 'MELHORIA', name: 'Visualizar Melhorias', description: 'Acompanhar iniciativas de melhoria contínua de processos e sistemas.' },
  { id: 'improvements:create', module: 'improvements', action: 'create', activityType: 'MELHORIA', name: 'Criar / Propor Melhorias', description: 'Submeter novas propostas e planos de melhoria.' },
  { id: 'improvements:edit', module: 'improvements', action: 'edit', activityType: 'MELHORIA', name: 'Editar Melhorias', description: 'Atualizar testes, escopo e planos de ação de melhorias.' },
  { id: 'improvements:delete', module: 'improvements', action: 'delete', activityType: 'MELHORIA', name: 'Excluir Melhorias', description: 'Remover registros de melhorias do sistema.' },
  { id: 'improvements:approve', module: 'improvements', action: 'approve', activityType: 'MELHORIA', name: 'Homologar Melhorias', description: 'Validar eficácia e autorizar deploy/encerramento de melhorias.' },

  // 4. Segregação por Tipo: TAREFA OPERACIONAL
  { id: 'tasks:read', module: 'tasks', action: 'read', activityType: 'TAREFA', name: 'Visualizar Tarefas Rotineiras', description: 'Consultar tarefas operacionais do dia a dia das equipes.' },
  { id: 'tasks:create', module: 'tasks', action: 'create', activityType: 'TAREFA', name: 'Criar Tarefas Rotineiras', description: 'Cadastrar tarefas rápidas e rotinas operacionais.' },
  { id: 'tasks:edit', module: 'tasks', action: 'edit', activityType: 'TAREFA', name: 'Editar Tarefas Rotineiras', description: 'Atualizar progresso, checklists e status das tarefas.' },
  { id: 'tasks:delete', module: 'tasks', action: 'delete', activityType: 'TAREFA', name: 'Excluir Tarefas Rotineiras', description: 'Remover tarefas operacionais.' },
  { id: 'tasks:approve', module: 'tasks', action: 'approve', activityType: 'TAREFA', name: 'Aprovar Conclusão de Tarefas', description: 'Validar encerramento de tarefas operacionais.' },

  // 5. Dashboard Executivo & Métricas
  { id: 'dashboard:read', module: 'dashboard', action: 'read', name: 'Acessar Dashboard Executivo', description: 'Visualizar indicadores consolidados, SLA e desempenho de equipes.' },
  { id: 'dashboard:export', module: 'dashboard', action: 'export', name: 'Exportar Dashboard Executivo', description: 'Exportar gráficos gerenciais e relatórios resumidos.' },

  // 6. Relatórios Executivos
  { id: 'reports:read', module: 'reports', action: 'read', name: 'Visualizar Relatórios Executivos', description: 'Consultar relatórios detalhados, produtividade e lead time.' },
  { id: 'reports:export', module: 'reports', action: 'export', name: 'Exportar Relatórios em PDF & Planilhas', description: 'Gerar relatórios de auditoria e prestação de contas.' },

  // 7. Relatórios Programados por E-mail
  { id: 'scheduled_reports:read', module: 'scheduled_reports', action: 'read', name: 'Consultar Relatórios Programados', description: 'Visualizar rotinas automáticas de envio e histórico de disparos.' },
  { id: 'scheduled_reports:create', module: 'scheduled_reports', action: 'create', name: 'Criar Programação de Relatório', description: 'Configurar novos envios periódicos por e-mail.' },
  { id: 'scheduled_reports:edit', module: 'scheduled_reports', action: 'edit', name: 'Editar Programação de Relatório', description: 'Modificar periodicidade, destinatários e formatos de exportação.' },
  { id: 'scheduled_reports:delete', module: 'scheduled_reports', action: 'delete', name: 'Excluir Programação de Relatório', description: 'Cancelar e remover disparos programados.' },

  // 8. Modelos de Demandas & Recorrências
  { id: 'templates:read', module: 'templates', action: 'read', name: 'Consultar Modelos & Recorrências', description: 'Visualizar catálogo institucional de modelos 5W2H.' },
  { id: 'templates:create', module: 'templates', action: 'create', name: 'Criar Modelos & Recorrências', description: 'Cadastrar novos templates e regras de agendamento cíclico.' },
  { id: 'templates:edit', module: 'templates', action: 'edit', name: 'Editar Modelos & Recorrências', description: 'Atualizar instruções padrão, checklists e prazos de modelos.' },
  { id: 'templates:delete', module: 'templates', action: 'delete', name: 'Excluir Modelos & Recorrências', description: 'Excluir templates do catálogo corporativo.' },

  // 9. Gestão de SLAs & Horário Útil
  { id: 'sla:read', module: 'sla', action: 'read', name: 'Consultar Políticas de SLA', description: 'Visualizar metas de resposta, resolução e horários úteis.' },
  { id: 'sla:create', module: 'sla', action: 'create', name: 'Criar Políticas de SLA', description: 'Cadastrar novos acordos de nível de serviço por criticidade.' },
  { id: 'sla:edit', module: 'sla', action: 'edit', name: 'Editar Políticas de SLA', description: 'Ajustar tempos de tolerância e regras de escalonamento.' },
  { id: 'sla:delete', module: 'sla', action: 'delete', name: 'Excluir Políticas de SLA', description: 'Remover políticas de SLA cadastradas.' },
  { id: 'sla:admin', module: 'sla', action: 'admin', name: 'Configurar Calendário & Horário Comercial', description: 'Gerenciar feriados, turnos de trabalho e pausas de SLA.' },

  // 10. Gestão de Riscos 5x5
  { id: 'risks:read', module: 'risks', action: 'read', name: 'Consultar Matriz de Riscos 5x5', description: 'Visualizar matriz de severidade e mapa térmico de ameaças.' },
  { id: 'risks:create', module: 'risks', action: 'create', name: 'Cadastrar Riscos', description: 'Mapear novos riscos operacionais ou de projeto.' },
  { id: 'risks:edit', module: 'risks', action: 'edit', name: 'Editar Riscos & Planos de Mitigação', description: 'Atualizar severidade, probabilidade e ações de contenção.' },
  { id: 'risks:delete', module: 'risks', action: 'delete', name: 'Excluir Riscos', description: 'Excluir ou arquivar registros de risco.' },
  { id: 'risks:approve', module: 'risks', action: 'approve', name: 'Aprovar / Aceitar Riscos', description: 'Formalizar aceite de risco residual pela liderança.' },

  // 11. API REST & Webhooks
  { id: 'api_webhooks:read', module: 'api_webhooks', action: 'read', name: 'Consultar APIs & Webhooks', description: 'Visualizar tokens de acesso, catálogo de eventos e logs.' },
  { id: 'api_webhooks:create', module: 'api_webhooks', action: 'create', name: 'Gerar Tokens & Webhooks', description: 'Emitir novas chaves de API e subscrever endpoints de webhook.' },
  { id: 'api_webhooks:edit', module: 'api_webhooks', action: 'edit', name: 'Editar Webhooks', description: 'Modificar URLs de entrega e filtros de eventos.' },
  { id: 'api_webhooks:delete', module: 'api_webhooks', action: 'delete', name: 'Revogar Chaves & Excluir Webhooks', description: 'Invalidar tokens de segurança e remover webhooks.' },

  // 12. Saúde do Sistema & Backup Enterprise
  { id: 'system_health:read', module: 'system_health', action: 'read', name: 'Monitorar Telemetria & Saúde', description: 'Consultar integridade do armazenamento e latência de operações.' },
  { id: 'system_health:create', module: 'system_health', action: 'create', name: 'Criar Backup / Snapshot', description: 'Gerar e baixar snapshot criptografado da base de dados.' },
  { id: 'system_health:admin', module: 'system_health', action: 'admin', name: 'Restaurar Dados & Resetar Caches', description: 'Restaurar snapshots de emergência ou limpar cache local.' },

  // 13. Aplicativo Android & APK
  { id: 'android:read', module: 'android', action: 'read', name: 'Acessar Central Android & APK', description: 'Consultar guias de instalação do APK v2.4 e recursos offline.' },
  { id: 'android:admin', module: 'android', action: 'admin', name: 'Gerenciar Configurações Android', description: 'Configurar canal de notificações push e sincronização em segundo plano.' },

  // 14. Gestão de Equipes, Usuários & Matriz RBAC
  { id: 'users_teams:read', module: 'users_teams', action: 'read', name: 'Visualizar Equipes & Usuários', description: 'Consultar lista de colaboradores, cargos e estrutura de times.' },
  { id: 'users_teams:create', module: 'users_teams', action: 'create', name: 'Cadastrar Equipes & Usuários', description: 'Cadastrar novos membros e criar squads operacionais.' },
  { id: 'users_teams:edit', module: 'users_teams', action: 'edit', name: 'Editar Equipes & Usuários', description: 'Alterar perfis de acesso, líderes de time e dados de contato.' },
  { id: 'users_teams:delete', module: 'users_teams', action: 'delete', name: 'Desativar / Excluir Membros', description: 'Desativar colaboradores e remover equipes inativas.' },
  { id: 'users_teams:admin', module: 'users_teams', action: 'admin', name: 'Gerenciar Matriz RBAC & Permissões', description: 'Configurar matriz completa de permissões por perfil e sobrescritas de usuários.' },

  // 15. Categorias & Status
  { id: 'categories:read', module: 'categories', action: 'read', name: 'Consultar Categorias e Status', description: 'Visualizar etapas do fluxo e categorias institucionais.' },
  { id: 'categories:edit', module: 'categories', action: 'edit', name: 'Editar Fluxos de Trabalho', description: 'Ajustar nomes, cores e etapas de transição do Kanban.' },
  { id: 'categories:admin', module: 'categories', action: 'admin', name: 'Administrar Categorias & Tipos', description: 'Criar novas categorias e definir regras obrigatórias de campos.' },

  // 16. Auditoria & Logs de Conformidade
  { id: 'audit:read', module: 'audit', action: 'read', name: 'Consultar Trilha de Auditoria', description: 'Acessar registro cronológico de todas as ações dos usuários.' },
  { id: 'audit:export', module: 'audit', action: 'export', name: 'Exportar Logs de Auditoria', description: 'Exportar evidências de conformidade em CSV e JSON.' },

  // 17. Google Workspace
  { id: 'google_workspace:read', module: 'google_workspace', action: 'read', name: 'Consultar Integrações Google', description: 'Visualizar status das conexões com Gmail, Drive, Calendar e Meet.' },
  { id: 'google_workspace:admin', module: 'google_workspace', action: 'admin', name: 'Conectar & Gerenciar Serviços Google', description: 'Configurar autenticação OAuth e gerenciar automações.' }
];

export const INITIAL_ROLE_PERMISSIONS: RolePermissionsMap = {
  admin: ALL_RBAC_PERMISSIONS.map((p) => p.id),

  gestor: [
    'demands:read', 'demands:create', 'demands:edit', 'demands:delete', 'demands:approve', 'demands:export',
    'comments:read', 'comments:create', 'comments:edit', 'comments:admin',
    'projects:read', 'projects:create', 'projects:edit', 'projects:delete', 'projects:approve',
    'improvements:read', 'improvements:create', 'improvements:edit', 'improvements:delete', 'improvements:approve',
    'tasks:read', 'tasks:create', 'tasks:edit', 'tasks:delete', 'tasks:approve',
    'dashboard:read', 'dashboard:export',
    'reports:read', 'reports:export',
    'scheduled_reports:read', 'scheduled_reports:create', 'scheduled_reports:edit', 'scheduled_reports:delete',
    'templates:read', 'templates:create', 'templates:edit', 'templates:delete',
    'sla:read', 'sla:create', 'sla:edit',
    'risks:read', 'risks:create', 'risks:edit', 'risks:delete', 'risks:approve',
    'api_webhooks:read', 'api_webhooks:create', 'api_webhooks:edit',
    'system_health:read', 'system_health:create',
    'android:read',
    'users_teams:read', 'users_teams:create', 'users_teams:edit',
    'categories:read',
    'audit:read',
    'google_workspace:read', 'google_workspace:admin'
  ],

  colaborador: [
    'demands:read', 'demands:create', 'demands:edit', 'demands:export',
    'comments:read', 'comments:create', 'comments:edit',
    'projects:read',
    'improvements:read', 'improvements:create', 'improvements:edit',
    'tasks:read', 'tasks:create', 'tasks:edit', 'tasks:approve',
    'dashboard:read',
    'templates:read',
    'sla:read',
    'risks:read', 'risks:create',
    'android:read',
    'users_teams:read',
    'google_workspace:read'
  ],

  diretoria: [
    'demands:read', 'demands:create', 'demands:edit', 'demands:approve', 'demands:export',
    'comments:read', 'comments:create', 'comments:edit', 'comments:admin',
    'projects:read', 'projects:create', 'projects:edit', 'projects:approve',
    'improvements:read', 'improvements:approve',
    'tasks:read',
    'dashboard:read', 'dashboard:export',
    'reports:read', 'reports:export',
    'scheduled_reports:read', 'scheduled_reports:create',
    'templates:read',
    'sla:read',
    'risks:read', 'risks:create', 'risks:edit', 'risks:approve',
    'system_health:read', 'system_health:create',
    'android:read',
    'users_teams:read',
    'categories:read',
    'audit:read', 'audit:export',
    'google_workspace:read'
  ]
};
