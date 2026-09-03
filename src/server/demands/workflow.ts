import type { Kysely, Selectable, Transaction } from 'kysely';
import { statusConfigDtoSchema, workflowPolicySchema } from '../../contracts/index.js';
import type { Database } from '../database.js';

type DemandRow=Selectable<Database['demands']>;
type DatabaseExecutor=Kysely<Database>|Transaction<Database>;
type Override={justification:string}|undefined;

const conflict=(message:string)=>{throw Object.assign(new Error(message),{status:409,code:'CONFLICT'});};
const invalid=(field:string,message:string)=>{throw Object.assign(new Error(message),{status:422,code:'VALIDATION_ERROR',fieldErrors:{[field]:[message]}});};

export const validateDemandReferences=async(db:DatabaseExecutor,moduleId:string,input:Record<string,unknown>)=>{
  if(typeof input.assigneeId==='string'&&input.assigneeId){const member=await db.selectFrom('module_members').innerJoin('users','users.id','module_members.user_id').select('users.id').where('module_members.module_id','=',moduleId).where('module_members.user_id','=',input.assigneeId).where('module_members.active','=',true).where('users.active','=',true).where('users.deleted_at','is',null).executeTakeFirst();if(!member)invalid('assigneeId','O responsável não pertence ao módulo ou está inativo.');}
  if(typeof input.teamId==='string'&&input.teamId){const team=await db.selectFrom('team_modules').innerJoin('teams','teams.id','team_modules.team_id').select('teams.id').where('team_modules.module_id','=',moduleId).where('team_modules.team_id','=',input.teamId).where('teams.active','=',true).where('teams.deleted_at','is',null).executeTakeFirst();if(!team)invalid('teamId','A equipe não pertence ao módulo ou está inativa.');}
  if(typeof input.clientId==='string'&&input.clientId){const client=await db.selectFrom('clients').select('id').where('id','=',input.clientId).where('active','=',true).where('deleted_at','is',null).executeTakeFirst();if(!client)invalid('clientId','O cliente não existe ou está inativo.');}
  const ids=[...new Set([...(Array.isArray(input.dependencies)?input.dependencies:[]),...(Array.isArray(input.advancedDependencies)?input.advancedDependencies.map(item=>(item as {targetDemandId?:unknown}).targetDemandId):[])].filter((id):id is string=>typeof id==='string'))];
  if(ids.length){const found=await db.selectFrom('demands').select('id').where('module_id','=',moduleId).where('id','in',ids).where('deleted_at','is',null).execute();if(found.length!==ids.length)invalid('dependencies','Uma ou mais dependências não existem neste módulo.');}
};

const dependencyIds=(payload:Record<string,unknown>)=>[...new Set([...(Array.isArray(payload.dependencies)?payload.dependencies:[]),...(Array.isArray(payload.advancedDependencies)?payload.advancedDependencies.map(item=>(item as {targetDemandId?:unknown}).targetDemandId):[])].filter((id):id is string=>typeof id==='string'))];

export const validateDemandDependencyGraph=async(db:DatabaseExecutor,moduleId:string,demandId:string,input:Record<string,unknown>)=>{
  const requested=dependencyIds(input);
  if(requested.includes(demandId))invalid('dependencies','Uma demanda não pode depender de si mesma.');
  if(!requested.length)return;
  const rows=await db.selectFrom('demands').select(['id','payload']).where('module_id','=',moduleId).where('deleted_at','is',null).execute();
  const graph=new Map(rows.map(row=>[row.id,dependencyIds(typeof row.payload==='object'&&row.payload!==null?row.payload as Record<string,unknown>: {})]));
  graph.set(demandId,requested);
  const reachesOrigin=(current:string,visited:Set<string>):boolean=>{if(current===demandId)return true;if(visited.has(current))return false;visited.add(current);return (graph.get(current)??[]).some(next=>reachesOrigin(next,visited));};
  if(requested.some(id=>reachesOrigin(id,new Set())))invalid('dependencies','As dependências informadas criam um ciclo entre demandas.');
};

export const rejectCompletedStatusForGenericWrite=async(db:DatabaseExecutor,moduleId:string,statusId:string)=>{
  const configuration=await db.selectFrom('module_configurations').select('value').where('module_id','=',moduleId).where('key','=','statuses').executeTakeFirst();
  const statuses=statusConfigDtoSchema.array().parse(configuration?.value);
  const status=statuses.find(item=>item.id===statusId&&item.active);
  if(status?.category==='completed')invalid('statusId','Use a operação específica de conclusão para concluir a demanda.');
};

export const validateDemandTransition=async(db:DatabaseExecutor,moduleId:string,row:DemandRow,targetStatusId:string,moduleRole:string,override:Override)=>{
  const configs=await db.selectFrom('module_configurations').select(['key','value']).where('module_id','=',moduleId).where('key','in',['statuses','workflow']).execute();
  const statuses=statusConfigDtoSchema.array().parse(configs.find(item=>item.key==='statuses')?.value);
  const policy=workflowPolicySchema.parse(configs.find(item=>item.key==='workflow')?.value);
  const current=statuses.find(item=>item.id===row.status_id&&item.active);
  const target=statuses.find(item=>item.id===targetStatusId&&item.active);
  if(!current||!target)throw Object.assign(new Error('Status atual ou de destino não existe ou está inativo neste módulo.'),{status:422,code:'VALIDATION_ERROR',fieldErrors:{statusId:['Selecione um status ativo do módulo.']}});
  if(current.id===target.id)return {current,target,overridden:false};
  const overrideAllowed=Boolean(override&&policy.overrideRoles.some(role=>role===moduleRole)&&override.justification.length>=policy.minimumOverrideJustificationLength);
  if(!policy.transitions[current.category]?.includes(target.category)&&!overrideAllowed)conflict(`A transição de ${current.name} para ${target.name} não é permitida.`);
  const payload=typeof row.payload==='object'&&row.payload!==null?row.payload as Record<string,unknown>:{};
  const blocker=payload.blocker as {isBlocked?:boolean;kind?:string}|undefined;
  if(blocker?.isBlocked&&blocker.kind!=='impediment')conflict('Atividade bloqueada. Resolva o bloqueio antes de alterar o status.');
  if(target.category==='completed'){
    const checklist=Array.isArray(payload.checklist)?payload.checklist as Array<{completed?:boolean}>:[];
    if(policy.requireCompletedChecklist&&checklist.some(item=>item.completed!==true)&&!overrideAllowed)conflict('Conclua todos os itens do checklist antes de finalizar a demanda.');
    const dependencyIds=[...new Set([...(Array.isArray(payload.dependencies)?payload.dependencies:[]),...(Array.isArray(payload.advancedDependencies)?payload.advancedDependencies.map(item=>(item as {targetDemandId?:unknown}).targetDemandId):[])].filter((id):id is string=>typeof id==='string'))];
    if(policy.requireCompletedDependencies&&dependencyIds.length){
      const dependencies=await db.selectFrom('demands').select(['id','status_id']).where('module_id','=',moduleId).where('id','in',dependencyIds).where('deleted_at','is',null).execute();
      const completedIds=new Set(dependencies.filter(item=>statuses.find(status=>status.id===item.status_id)?.category==='completed').map(item=>item.id));
      if(dependencyIds.some(id=>!completedIds.has(id))&&!overrideAllowed)conflict('Conclua todas as dependências antes de finalizar a demanda.');
    }
  }
  return {current,target,overridden:overrideAllowed};
};
