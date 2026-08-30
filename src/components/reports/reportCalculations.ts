import { Demand, StatusConfig } from '../../types';
import { isCalendarDateOverdue } from '../../utils/date';

export type ProjectionLevel='on_track'|'attention'|'high_risk'|'critical';
export const projectionLevel=(rate:number):ProjectionLevel=>rate>=95?'on_track':rate>=80?'attention':rate>=60?'high_risk':'critical';
export const daysLate=(dueDate:string,reference=new Date())=>Math.max(0,Math.floor((reference.getTime()-new Date(`${dueDate.slice(0,10)}T23:59:59`).getTime())/86400000));

export const calculateExecutiveMetrics=(demands:Demand[],statuses:StatusConfig[],referenceDate:Date,quarter:number,year:number)=>{
 const statusMap=new Map(statuses.map(item=>[item.id,item]));
 const completed=demands.filter(item=>statusMap.get(item.statusId)?.category==='completed');
 const cancelled=demands.filter(item=>statusMap.get(item.statusId)?.category==='cancelled');
 const active=demands.filter(item=>!['completed','cancelled'].includes(statusMap.get(item.statusId)?.category||''));
 const overdue=active.filter(item=>item.dueDate&&isCalendarDateOverdue(item.dueDate,referenceDate));
 const blocked=active.filter(item=>item.blocker?.isBlocked);
 const committed=demands.filter(item=>{if(!item.dueDate)return false;const due=new Date(`${item.dueDate}T12:00:00`);return due.getFullYear()===year&&Math.floor(due.getMonth()/3)+1===quarter;});
 const commitment=Math.max(completed.length,committed.length);
 const actualRate=commitment?Math.round(completed.length/commitment*100):0;
 const projectionAvailable=commitment>0;
 const elapsedMonths=Math.max(1,Math.min(3,referenceDate.getMonth()-(quarter-1)*3+1));
 const monthlyPace=completed.length/elapsedMonths;
 const projected=projectionAvailable?Math.min(commitment,Math.round(completed.length+monthlyPace*Math.max(0,3-elapsedMonths))):0;
 const projectionRate=commitment?Math.round(projected/commitment*100):0;
 const gap=Math.max(0,commitment-projected),surplus=Math.max(0,projected-commitment);
 const withDueDate=active.filter(item=>Boolean(item.dueDate));
 const withinDueDate=withDueDate.filter(item=>!isCalendarDateOverdue(item.dueDate,referenceDate));
 const onTimeRate=withDueDate.length?Math.round(withinDueDate.length/withDueDate.length*100):null;
 let plannedCumulative=0,actualCumulative=0;
 const months=Array.from({length:3},(_,index)=>{const start=new Date(year,(quarter-1)*3+index,1),end=new Date(year,start.getMonth()+1,1);const planned=demands.filter(item=>{if(!item.dueDate)return false;const date=new Date(`${item.dueDate}T12:00:00`);return date>=start&&date<end;}).length;const actual=completed.filter(item=>{const date=new Date(item.completedAt||item.dueDate);return date>=start&&date<end;}).length;plannedCumulative+=planned;actualCumulative+=actual;const future=start>referenceDate,current=referenceDate>=start&&referenceDate<end;return{mes:start.toLocaleDateString('pt-BR',{month:'short'}).replace('.',''),planejado:planned,realizado:future?0:actual,planejadoAcumulado:plannedCumulative,realizadoAcumulado:actualCumulative,projecao:future||current?projected:null,periodStatus:future?'Projeção':current?'Mês em andamento':'Encerrado'};});
 return{completed,cancelled,active,overdue,blocked,commitment,actualRate,projected,projectionRate,projectionAvailable,gap,surplus,monthlyPace:Math.round(monthlyPace),onTimeRate,onTimeNumerator:withinDueDate.length,onTimeDenominator:withDueDate.length,months};
};
