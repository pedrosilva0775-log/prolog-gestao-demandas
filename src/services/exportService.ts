import { toPng } from 'html-to-image';
import { CategoryConfig, Demand, PriorityConfig, StatusConfig, Team, User } from '../types';
import { toLocalDateInput } from '../utils/date';

export interface CsvExportOptions { fileName?:string; demands:Demand[]; users:User[]; teams:Team[]; categories:CategoryConfig[]; statuses:StatusConfig[]; priorities:PriorityConfig[]; currentUser:User; selectedColumns?:string[]; }
export const ALL_COLUMNS=[{key:'code',label:'Código'},{key:'title',label:'Título'},{key:'category',label:'Categoria'},{key:'status',label:'Status'},{key:'priority',label:'Prioridade'},{key:'team',label:'Equipe'},{key:'assignee',label:'Responsável'},{key:'requester',label:'Solicitante'},{key:'progress',label:'Progresso (%)'},{key:'dueDate',label:'Prazo final'},{key:'plannedStartDate',label:'Início planejado'},{key:'createdAt',label:'Data de cadastro'}];
const csvCell=(value:unknown)=>{const text=String(value??'');const safe=/^[=+\-@]/.test(text)?`'${text}`:text;return `"${safe.replaceAll('"','""')}"`;};
export const getPngExportDimensions=(node:{scrollWidth:number;scrollHeight:number;getBoundingClientRect:()=>Pick<DOMRect,'width'|'height'>})=>{const bounds=node.getBoundingClientRect();return {width:Math.ceil(Math.max(bounds.width,node.scrollWidth)),height:Math.ceil(Math.max(bounds.height,node.scrollHeight))};};

export const ExportService={
  exportToCsv:async(options:CsvExportOptions):Promise<void>=>{
    const {demands,users,teams,categories,statuses,priorities,selectedColumns=ALL_COLUMNS.map(column=>column.key)}=options;
    const maps={users:new Map(users.map(item=>[item.id,item.name])),teams:new Map(teams.map(item=>[item.id,item.name])),categories:new Map(categories.map(item=>[item.id,item.name])),statuses:new Map(statuses.map(item=>[item.id,item.name])),priorities:new Map(priorities.map(item=>[item.id,item.name]))};
    const columns=ALL_COLUMNS.filter(column=>selectedColumns.includes(column.key));
    const values=(demand:Demand):Record<string,unknown>=>({code:demand.code,title:demand.title,category:maps.categories.get(demand.categoryId),status:maps.statuses.get(demand.statusId),priority:maps.priorities.get(demand.priorityId),team:maps.teams.get(demand.teamId),assignee:maps.users.get(demand.assigneeId),requester:maps.users.get(demand.requesterId),progress:demand.progressPercent,dueDate:demand.dueDate,plannedStartDate:demand.plannedStartDate,createdAt:demand.createdAt});
    const csv=[columns.map(column=>csvCell(column.label)).join(','),...demands.map(demand=>{const row=values(demand);return columns.map(column=>csvCell(row[column.key])).join(',');})].join('\r\n');
    const blob=new Blob([`\uFEFF${csv}`],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=(options.fileName||`Gestao_Demandas_${toLocalDateInput()}.csv`).replace(/\.xlsx$/i,'.csv');document.body.appendChild(link);link.click();document.body.removeChild(link);URL.revokeObjectURL(url);
  },
  exportToPng:async(elementId:string,fileName:string):Promise<void>=>{
    const node=document.getElementById(elementId);
    if(!node)throw new Error(`Elemento "${elementId}" não encontrado.`);

    await document.fonts?.ready;
    const {width:exportWidth,height:exportHeight}=getPngExportDimensions(node);
    const computedBackground=window.getComputedStyle(node).backgroundColor;
    const exportBackground=computedBackground&&computedBackground!=='rgba(0, 0, 0, 0)'&&computedBackground!=='transparent'
      ? computedBackground
      : '#07111f';
    const dataUrl=await toPng(node,{
      quality:0.98,
      pixelRatio:2,
      backgroundColor:exportBackground,
      width:exportWidth,
      height:exportHeight,
      style:{
        width:`${exportWidth}px`,
        minWidth:`${exportWidth}px`,
        maxWidth:`${exportWidth}px`,
        height:'auto',
        margin:'0',
        overflow:'visible',
        maxHeight:'none',
        boxSizing:'border-box'
      },
      filter:child=>!(child instanceof HTMLElement&&child.classList.contains('no-export'))
    });
    const link=document.createElement('a');
    link.download=`${fileName.replace(/\.png$/i,'')}.png`;
    link.href=dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
