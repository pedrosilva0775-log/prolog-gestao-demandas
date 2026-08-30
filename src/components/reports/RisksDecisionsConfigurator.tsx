import React, { useMemo, useState } from 'react';
import { GripVertical, Plus, Search, Trash2 } from 'lucide-react';
import { Demand, StatusConfig, Team, User } from '../../types';
import { AppSelect } from '../common/AppSelect';
import { isCalendarDateOverdue } from '../../utils/date';
import { isReportRiskValid, ReportRiskItem, ReportRiskSeverity } from './reportBuilder';

type Props = {
  enabled: boolean;
  items: ReportRiskItem[];
  demands: Demand[];
  users: User[];
  teams: Team[];
  statuses: StatusConfig[];
  onEnabledChange: (enabled: boolean) => void;
  onChange: (items: ReportRiskItem[]) => void;
};

const severityLabels: Record<ReportRiskSeverity, string> = { low: 'Baixo', medium: 'Médio', high: 'Alto', critical: 'Crítico' };
const severityFromDemand = (demand: Demand): ReportRiskSeverity => demand.blocker?.impact === 'Crítico' ? 'critical' : demand.blocker?.impact === 'Alto' ? 'high' : demand.blocker?.impact === 'Médio' ? 'medium' : 'low';
const daysOverdue = (date: string) => Math.max(0, Math.floor((Date.now() - new Date(`${date.slice(0,10)}T23:59:59`).getTime()) / 86400000));

export const RisksDecisionsConfigurator: React.FC<Props> = ({ enabled, items, demands, users, teams, statuses, onEnabledChange, onChange }) => {
  const [search, setSearch] = useState('');
  const [teamId, setTeamId] = useState('all');
  const [userId, setUserId] = useState('all');
  const [statusId, setStatusId] = useState('all');
  const [severity, setSeverity] = useState<'all'|ReportRiskSeverity>('all');
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [onlyBlocked, setOnlyBlocked] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const filtered = useMemo(() => demands.filter(demand => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    const owner = users.find(user => user.id === demand.assigneeId)?.name || '';
    if (query && !`${demand.code} ${demand.title} ${owner}`.toLocaleLowerCase('pt-BR').includes(query)) return false;
    if (teamId !== 'all' && demand.teamId !== teamId) return false;
    if (userId !== 'all' && demand.assigneeId !== userId) return false;
    if (statusId !== 'all' && demand.statusId !== statusId) return false;
    if (severity !== 'all' && severityFromDemand(demand) !== severity) return false;
    if (onlyOverdue && !isCalendarDateOverdue(demand.dueDate)) return false;
    if (onlyBlocked && !demand.blocker?.isBlocked) return false;
    return true;
  }), [demands, onlyBlocked, onlyOverdue, search, severity, statusId, teamId, userId, users]);

  const addDemand = (demand: Demand) => {
    if (items.some(item => item.sourceDemandId === demand.id)) return;
    const owner = users.find(user => user.id === demand.assigneeId)?.name || 'A definir';
    onChange([...items, {
      id: `risk-${demand.id}`, sourceDemandId: demand.id, demandName: `${demand.code} — ${demand.title}`,
      risk: demand.blocker?.reason || 'Risco a detalhar', impact: demand.blocker?.actionNeeded || demand.whyReason || 'Impacto a detalhar',
      responsible: owner, resolutionDueDate: demand.dueDate, decision: 'Definir decisão ou apoio necessário',
      severity: severityFromDemand(demand), executiveNote: '', order: items.length,
    }]);
  };
  const addManual = () => onChange([...items, { id:`manual-${crypto.randomUUID()}`, demandName:'', risk:'', impact:'', responsible:'', decision:'', severity:'medium', executiveNote:'', order:items.length }]);
  const update = (id:string, patch:Partial<ReportRiskItem>) => onChange(items.map(item => item.id === id ? {...item,...patch} : item));
  const remove = (id:string) => onChange(items.filter(item => item.id !== id).map((item,index)=>({...item,order:index})));
  const moveBefore = (targetId:string) => {
    if (!draggedId || draggedId === targetId) return;
    const next = items.filter(item => item.id !== draggedId);
    const source = items.find(item => item.id === draggedId);
    const targetIndex = next.findIndex(item => item.id === targetId);
    if (source) next.splice(targetIndex,0,source);
    onChange(next.map((item,index)=>({...item,order:index})));
  };

  return <div className="space-y-3">
    <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={enabled} onChange={event=>onEnabledChange(event.target.checked)} />Exibir “Riscos e decisões necessárias” no relatório</label>
    {enabled && <>
      <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400"/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Pesquisar por código, título ou responsável" className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-xs dark:border-slate-700 dark:bg-slate-800"/></div>
        <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4"><AppSelect value={teamId} onChange={event=>setTeamId(event.target.value)}><option value="all">Todas as equipes</option>{teams.map(team=><option key={team.id} value={team.id}>{team.name}</option>)}</AppSelect><AppSelect value={userId} onChange={event=>setUserId(event.target.value)}><option value="all">Todos os responsáveis</option>{users.map(user=><option key={user.id} value={user.id}>{user.name}</option>)}</AppSelect><AppSelect value={statusId} onChange={event=>setStatusId(event.target.value)}><option value="all">Todos os status</option>{statuses.map(status=><option key={status.id} value={status.id}>{status.name}</option>)}</AppSelect><AppSelect value={severity} onChange={event=>setSeverity(event.target.value as typeof severity)}><option value="all">Todos os riscos</option>{Object.entries(severityLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</AppSelect></div>
        <div className="mt-2 flex flex-wrap gap-4 text-[11px]"><label><input className="mr-1" type="checkbox" checked={onlyOverdue} onChange={event=>setOnlyOverdue(event.target.checked)}/>Somente vencidas</label><label><input className="mr-1" type="checkbox" checked={onlyBlocked} onChange={event=>setOnlyBlocked(event.target.checked)}/>Somente impedidas</label><button type="button" className="font-bold text-blue-600" onClick={()=>filtered.forEach(addDemand)}>Selecionar todos os resultados ({filtered.length})</button></div>
        <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">{filtered.map(demand=>{const selected=items.some(item=>item.sourceDemandId===demand.id);const owner=users.find(user=>user.id===demand.assigneeId)?.name||'Sem responsável';return <label key={demand.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-2 text-[11px] dark:border-slate-700"><input type="checkbox" checked={selected} onChange={()=>selected?remove(`risk-${demand.id}`):addDemand(demand)}/><span className="min-w-0 flex-1"><b>{demand.code} — {demand.title}</b><span className="block text-slate-500">{statuses.find(status=>status.id===demand.statusId)?.name} · {owner} · prazo {demand.dueDate}{isCalendarDateOverdue(demand.dueDate)?` · ${daysOverdue(demand.dueDate)} dias em atraso`:''}{demand.blocker?.isBlocked?' · IMPEDIDA':''}</span></span><span className="rounded border px-1.5 py-0.5 font-bold">{severityLabels[severityFromDemand(demand)]}</span></label>;})}</div>
      </div>
      <div className="flex items-center justify-between"><b className="text-xs">{items.length} item(ns) selecionado(s)</b><button type="button" onClick={addManual} className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"><Plus className="h-3.5 w-3.5"/>Adicionar risco manual</button></div>
      {!items.length && <p className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs font-bold text-amber-700">Selecione pelo menos um risco ou desative esta seção para continuar.</p>}
      <div className="space-y-2">{items.map(item=><div key={item.id} draggable onDragStart={()=>setDraggedId(item.id)} onDragOver={event=>{event.preventDefault();moveBefore(item.id);}} onDragEnd={()=>setDraggedId(null)} className={`rounded-xl border p-3 ${isReportRiskValid(item)?'border-slate-200 dark:border-slate-700':'border-red-400'}`}><div className="mb-2 flex items-center gap-2"><GripVertical className="h-4 w-4 cursor-grab text-slate-400"/><b className="flex-1 text-xs">Prévia do item</b><button type="button" onClick={()=>remove(item.id)}><Trash2 className="h-4 w-4 text-red-500"/></button></div><div className="grid grid-cols-1 gap-2 md:grid-cols-2">{([['demandName','Demanda *'],['risk','Risco ou impedimento *'],['impact','Impacto para a operação *'],['responsible','Responsável pela resolução *'],['decision','Decisão ou apoio necessário *'],['executiveNote','Observação executiva']] as const).map(([field,label])=><label key={field} className="text-[10px] font-bold">{label}<textarea rows={2} value={item[field]} onChange={event=>update(item.id,{[field]:event.target.value})} className="mt-1 w-full rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-800"/></label>)}<label className="text-[10px] font-bold">Prazo para resolução<input type="date" value={item.resolutionDueDate||''} onChange={event=>update(item.id,{resolutionDueDate:event.target.value})} className="mt-1 w-full rounded-lg border p-2 text-xs dark:border-slate-700 dark:bg-slate-800"/></label><label className="text-[10px] font-bold">Criticidade<AppSelect value={item.severity} onChange={event=>update(item.id,{severity:event.target.value as ReportRiskSeverity})}>{Object.entries(severityLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</AppSelect></label></div></div>)}</div>
    </>}
  </div>;
};
