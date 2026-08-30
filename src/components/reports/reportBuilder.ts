import { CategoryConfig, StatusConfig } from '../../types';

export type ReportBlockKey = 'indicators'|'statusFlow'|'demandTypes'|'ongoing'|'blocked'|'validation'|'categoryDistribution'|'evolution'|'portfolioHealth'|'performance'|'attention'|'executiveSummary';
export type ReportKpiKey = 'total'|'open'|'completed'|'ongoing'|'blocked'|'completionRate'|'validation'|'cancelled'|'leadTime'|'onTime';
export type EvolutionSeriesKey = 'created'|'completed'|'ongoing'|'validation'|'blocked'|'cancelled';
export type ReportRiskSeverity = 'low'|'medium'|'high'|'critical';
export type ReportRiskItem = {
  id:string; sourceDemandId?:string; demandName:string; risk:string; impact:string; responsible:string;
  resolutionDueDate?:string; decision:string; severity:ReportRiskSeverity; executiveNote:string; order:number;
};
export type ReportImpactItem = { id:string; sourceDemandId?:string; title:string; outcome:string; order:number };
export type ReportMilestoneRisk = 'low'|'medium'|'high';
export type ReportMilestoneItem = { id:string; sourceDemandId?:string; title:string; dueDate:string; progress:number; risk:ReportMilestoneRisk; order:number };
export type ReportConfiguration = {
  statusIds:string[]; categoryIds:string[]; blocks:ReportBlockKey[]; kpis:ReportKpiKey[];
  impedimentStatusIds:string[]; userIds:string[]; clientIds:string[]; teamIds:string[]; priorityIds:string[];
  startDate:string; endDate:string; evolutionSeries:EvolutionSeriesKey[]; evolutionMonths:3|6|12;
  autoSummary:boolean; includeRecommendation:boolean;
  showRisksAndDecisions:boolean; riskItems:ReportRiskItem[];
  showImpactDeliveries:boolean; impactItems:ReportImpactItem[];
  showMilestones:boolean; milestoneItems:ReportMilestoneItem[];
};
export type ReportPreset = {id:string;name:string;configuration:ReportConfiguration;updatedAt?:string};

export const REPORT_BLOCKS:Array<{key:ReportBlockKey;label:string}>=[
  {key:'indicators',label:'Indicadores principais'},{key:'statusFlow',label:'Status do fluxo'},{key:'demandTypes',label:'Tipos de demandas'},
  {key:'ongoing',label:'Demandas em andamento'},{key:'blocked',label:'Demandas impedidas'},{key:'validation',label:'Demandas em validação'},
  {key:'categoryDistribution',label:'Distribuição por categoria'},{key:'evolution',label:'Evolução das demandas'},
  {key:'portfolioHealth',label:'Saúde do portfólio'},{key:'performance',label:'Performance'},{key:'attention',label:'Pontos de atenção'},
  {key:'executiveSummary',label:'Resumo executivo'}
];
export const REPORT_KPIS:Array<{key:ReportKpiKey;label:string}>=[
  {key:'total',label:'Total de demandas'},{key:'open',label:'Demandas abertas'},{key:'completed',label:'Demandas concluídas'},
  {key:'ongoing',label:'Demandas em andamento'},{key:'blocked',label:'Demandas impedidas'},{key:'completionRate',label:'Taxa de conclusão'},
  {key:'validation',label:'Demandas em validação'},{key:'cancelled',label:'Demandas canceladas'},{key:'leadTime',label:'Lead time médio'},
  {key:'onTime',label:'Conclusão dentro do prazo'}
];
export const EVOLUTION_SERIES:Array<{key:EvolutionSeriesKey;label:string}>=[{key:'created',label:'Criadas'},{key:'completed',label:'Concluídas'},{key:'ongoing',label:'Em andamento'},{key:'validation',label:'Em validação'},{key:'blocked',label:'Impedidas'},{key:'cancelled',label:'Canceladas'}];
const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const statusMatches=(status:StatusConfig|undefined,term:string)=>normalize(status?.name||'').includes(normalize(term));
export const createDefaultReportConfiguration=(statuses:StatusConfig[],categories:CategoryConfig[]):ReportConfiguration=>({
  statusIds:statuses.filter(item=>item.active!==false).map(item=>item.id),categoryIds:categories.map(item=>item.id),
  blocks:REPORT_BLOCKS.map(item=>item.key),kpis:['total','open','completed','ongoing','blocked','completionRate'],
  impedimentStatusIds:statuses.filter(item=>statusMatches(item,'bloqueada')||statusMatches(item,'aguardando terceiros')).map(item=>item.id),
  userIds:[],clientIds:[],teamIds:[],priorityIds:[],startDate:'',endDate:'',evolutionSeries:['created','completed'],evolutionMonths:6,
  autoSummary:true,includeRecommendation:true,showRisksAndDecisions:false,riskItems:[],
  showImpactDeliveries:true,impactItems:[],showMilestones:true,milestoneItems:[]
});
export const isReportRiskValid=(item:ReportRiskItem)=>Boolean(item.demandName.trim()&&item.risk.trim()&&item.impact.trim()&&item.responsible.trim()&&item.decision.trim());
export const isReportImpactValid=(item:ReportImpactItem)=>Boolean(item.title.trim()&&item.outcome.trim());
export const isReportMilestoneValid=(item:ReportMilestoneItem)=>Boolean(item.title.trim()&&item.dueDate&&item.progress>=0&&item.progress<=100);
export const createNativePreset=(name:'Executivo'|'Gerencial'|'Completo',statuses:StatusConfig[],categories:CategoryConfig[]):ReportConfiguration=>{
  const base=createDefaultReportConfiguration(statuses,categories);
  if(name==='Executivo')return {...base,blocks:['indicators','statusFlow','blocked','ongoing','evolution','portfolioHealth','executiveSummary']};
  if(name==='Gerencial')return {...base,blocks:['indicators','statusFlow','demandTypes','ongoing','blocked','validation','categoryDistribution','evolution','performance','attention','executiveSummary'],kpis:[...base.kpis,'validation','leadTime','onTime']};
  return base;
};
