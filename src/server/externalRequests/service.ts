import crypto from 'node:crypto';
import { sql, type Selectable, type Transaction } from 'kysely';
import {
  externalLinkCreateSchema,
  externalLinkRevokeSchema,
  externalRequestConvertSchema,
  externalRequestQuerySchema,
  externalRequestReviewSchema,
  externalRequestSubmitSchema,
  statusConfigDtoSchema,
} from '../../contracts/index.js';
import type { Database } from '../database.js';
import { getDatabase } from '../database.js';
import { createDemandInTransaction } from '../demands/create.js';

type LinkRow=Selectable<Database['external_request_links']>;
type RequestRow=Selectable<Database['external_requests']>;
export type ExternalSession={id:string;sid?:string};
const database=()=>getDatabase();
const failure=(status:number,message:string):never=>{throw Object.assign(new Error(message),{status});};
const tokenHash=(token:string)=>crypto.createHash('sha256').update(token).digest('hex');
const linkDto=(row:LinkRow)=>({id:row.id,clientId:row.client_id,moduleId:row.module_id,recipientUserId:row.recipient_user_id,allowedTypes:row.allowed_types,expiresAt:row.expires_at.toISOString(),maxSubmissions:row.max_submissions,submissionCount:row.submission_count,revokedAt:row.revoked_at?.toISOString()??null,createdAt:row.created_at.toISOString(),version:row.version});
const requestDto=(row:RequestRow)=>({id:row.id,protocol:row.protocol,moduleId:row.module_id,clientId:row.client_id,recipientUserId:row.recipient_user_id,declaredName:row.declared_name,declaredEmail:row.declared_email,type:row.request_type,title:row.title,description:row.description,expectedOutcome:row.expected_outcome,desiredDueDate:row.desired_due_date?.toISOString().slice(0,10)??null,perceivedImpact:row.perceived_impact,status:row.status,convertedDemandId:row.converted_demand_id,reviewedBy:row.reviewed_by,reviewedAt:row.reviewed_at?.toISOString()??null,refusalReason:row.refusal_reason,version:row.version,createdAt:row.created_at.toISOString(),updatedAt:row.updated_at.toISOString()});
const audit=async(trx:Transaction<Database>,session:ExternalSession|null,moduleId:string,action:string,entityType:string,entityId:string,after:unknown)=>trx.insertInto('audit_logs').values({id:crypto.randomUUID(),module_id:moduleId,actor_id:session?.id??null,session_id:session?.sid??null,ip_address:null,action,entity_type:entityType,entity_id:entityId,before_data:null,after_data:after,created_at:new Date()}).execute();

const validateDestination=async(trx:Transaction<Database>,moduleId:string,clientId:string,recipientId:string)=>{
  const module=await trx.selectFrom('operational_modules').select('id').where('id','=',moduleId).where('active','=',true).where('deleted_at','is',null).executeTakeFirst();
  const client=await trx.selectFrom('clients').select('id').where('id','=',clientId).where('active','=',true).where('deleted_at','is',null).executeTakeFirst();
  const recipient=await trx.selectFrom('module_members').innerJoin('users','users.id','module_members.user_id').select('users.id').where('module_members.module_id','=',moduleId).where('module_members.user_id','=',recipientId).where('module_members.active','=',true).where('users.active','=',true).where('users.deleted_at','is',null).executeTakeFirst();
  if(!module||!client||!recipient)failure(422,'Módulo, cliente ou destinatário não está disponível.');
};

export const externalRequestsService={
  async createLink(session:ExternalSession,moduleId:string,raw:unknown){
    const input=externalLinkCreateSchema.parse(raw);
    if(input.moduleId!==moduleId)failure(422,'O módulo informado não corresponde à rota.');
    const token=crypto.randomBytes(32).toString('base64url');
    const now=new Date();
    const expiresAt=input.expiresAt?new Date(input.expiresAt):new Date(now.getTime()+7*86400000);
    if(expiresAt<=now)failure(422,'A expiração deve estar no futuro.');
    return database().transaction().execute(async trx=>{
      await validateDestination(trx,moduleId,input.clientId,input.recipientUserId);
      const row=await trx.insertInto('external_request_links').values({id:`erl-${crypto.randomUUID()}`,token_hash:tokenHash(token),client_id:input.clientId,module_id:moduleId,recipient_user_id:input.recipientUserId,allowed_types:[...new Set(input.allowedTypes)],expires_at:expiresAt,max_submissions:input.maxSubmissions,submission_count:0,revoked_at:null,replaced_by_id:null,created_by:session.id,version:1,created_at:now,updated_at:now}).returningAll().executeTakeFirstOrThrow();
      await audit(trx,session,moduleId,'EXTERNAL_REQUEST_LINK_CREATED','external_request_link',row.id,{clientId:row.client_id,recipientUserId:row.recipient_user_id,expiresAt:row.expires_at.toISOString(),maxSubmissions:row.max_submissions});
      return {link:linkDto(row),token,path:`/request/${token}`};
    });
  },
  async revokeLink(session:ExternalSession,moduleId:string,linkId:string,raw:unknown){
    const {version}=externalLinkRevokeSchema.parse(raw);
    const now=new Date();
    const result=await database().transaction().execute(async trx=>{
      const row=await trx.updateTable('external_request_links').set({revoked_at:now,updated_at:now,version:sql`version + 1`}).where('id','=',linkId).where('module_id','=',moduleId).where('version','=',version).where('revoked_at','is',null).returningAll().executeTakeFirst();
      if(!row)failure(409,'O link foi alterado, revogado ou não existe neste módulo.');
      await audit(trx,session,moduleId,'EXTERNAL_REQUEST_LINK_REVOKED','external_request_link',linkId,{version:row.version});
      return linkDto(row);
    });
    return result;
  },
  async publicInfo(token:string){
    const row=await database().selectFrom('external_request_links').innerJoin('clients','clients.id','external_request_links.client_id').innerJoin('operational_modules','operational_modules.id','external_request_links.module_id').select(['external_request_links.allowed_types','external_request_links.expires_at','external_request_links.max_submissions','external_request_links.submission_count','external_request_links.revoked_at','clients.name','clients.company']).where('external_request_links.token_hash','=',tokenHash(token)).where('clients.active','=',true).where('clients.deleted_at','is',null).where('operational_modules.active','=',true).where('operational_modules.deleted_at','is',null).executeTakeFirst();
    if(!row||row.revoked_at||row.expires_at<=new Date()||row.submission_count>=row.max_submissions)failure(404,'Link inválido ou indisponível.');
    return {clientName:row.company||row.name,allowedTypes:row.allowed_types,expiresAt:row.expires_at.toISOString(),remainingSubmissions:row.max_submissions-row.submission_count};
  },
  async submit(token:string,raw:unknown){
    const input=externalRequestSubmitSchema.parse(raw);
    return database().transaction().execute(async trx=>{
      const link=await trx.selectFrom('external_request_links').selectAll().where('token_hash','=',tokenHash(token)).forUpdate().executeTakeFirst();
      if(!link||link.revoked_at||link.expires_at<=new Date())failure(404,'Link inválido ou indisponível.');
      const prior=await trx.selectFrom('external_requests').selectAll().where('link_id','=',link.id).where('idempotency_key','=',input.idempotencyKey).executeTakeFirst();
      if(prior)return {protocol:prior.protocol,receivedAt:prior.created_at.toISOString(),message:'Solicitação recebida.'};
      if(link.submission_count>=link.max_submissions)failure(409,'O limite de envios deste link foi atingido.');
      if(!link.allowed_types.includes(input.type))failure(422,'O tipo de solicitação não é permitido por este link.');
      await validateDestination(trx,link.module_id,link.client_id,link.recipient_user_id);
      const now=new Date();
      const id=`erq-${crypto.randomUUID()}`;
      const protocol=`EXT-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
      await trx.insertInto('external_requests').values({id,protocol,link_id:link.id,module_id:link.module_id,client_id:link.client_id,recipient_user_id:link.recipient_user_id,declared_name:input.name,declared_email:input.email.toLowerCase(),request_type:input.type,title:input.title,description:input.description,expected_outcome:input.expectedOutcome,desired_due_date:input.desiredDueDate?new Date(`${input.desiredDueDate}T00:00:00.000Z`):null,perceived_impact:input.perceivedImpact??null,status:'received',idempotency_key:input.idempotencyKey,converted_demand_id:null,reviewed_by:null,reviewed_at:null,refusal_reason:null,version:1,created_at:now,updated_at:now}).execute();
      await trx.updateTable('external_request_links').set({submission_count:sql`submission_count + 1`,updated_at:now,version:sql`version + 1`}).where('id','=',link.id).execute();
      await audit(trx,null,link.module_id,'EXTERNAL_REQUEST_RECEIVED','external_request',id,{protocol,type:input.type});
      return {protocol,receivedAt:now.toISOString(),message:'Solicitação recebida.'};
    });
  },
  async list(moduleId:string,raw:unknown){
    const query=externalRequestQuerySchema.parse(raw);
    const db=database();
    let rows=db.selectFrom('external_requests').selectAll().where('module_id','=',moduleId);
    if(query.status)rows=rows.where('status','=',query.status);
    const [{count}]=await rows.clearSelect().select(db.fn.countAll<number>().as('count')).execute();
    const items=await rows.orderBy('created_at','desc').limit(query.pageSize).offset((query.page-1)*query.pageSize).execute();
    const total=Number(count);
    return {items:items.map(requestDto),pagination:{page:query.page,pageSize:query.pageSize,total,totalPages:Math.ceil(total/query.pageSize)}};
  },
  async review(session:ExternalSession,moduleId:string,id:string,raw:unknown){
    const input=externalRequestReviewSchema.parse(raw);const now=new Date();
    return database().transaction().execute(async trx=>{
      const row=await trx.updateTable('external_requests').set({status:input.status,refusal_reason:input.status==='refused'?input.reason!:null,reviewed_by:session.id,reviewed_at:now,updated_at:now,version:sql`version + 1`}).where('id','=',id).where('module_id','=',moduleId).where('version','=',input.version).where('status','in',['received','in_review']).returningAll().executeTakeFirst();
      if(!row)failure(409,'A solicitação foi alterada ou não está disponível neste módulo.');
      await audit(trx,session,moduleId,'EXTERNAL_REQUEST_REVIEWED','external_request',id,{status:row.status,version:row.version});return requestDto(row);
    });
  },
  async convert(session:ExternalSession,moduleId:string,id:string,raw:unknown){
    const input=externalRequestConvertSchema.parse(raw);
    return database().transaction().execute(async trx=>{
      const request=await trx.selectFrom('external_requests').selectAll().where('id','=',id).where('module_id','=',moduleId).forUpdate().executeTakeFirst();
      if(!request)failure(404,'Solicitação não encontrada.');
      if(request.version!==input.version||request.status==='converted'||request.status==='refused')failure(409,'A solicitação foi alterada ou já foi finalizada.');
      const config=await trx.selectFrom('module_configurations').select('value').where('module_id','=',moduleId).where('key','=','statuses').executeTakeFirst();
      const initial=statusConfigDtoSchema.array().parse(config?.value).find(status=>status.active&&status.category==='open');
      if(!initial)failure(422,'O módulo não possui status inicial ativo.');
      const demand=await createDemandInTransaction({transaction:trx,moduleId,requesterId:session.id,input:{title:request.title,description:request.description,statusId:initial.id,priorityId:input.priorityId,categoryId:input.categoryId,assigneeId:input.assigneeId,teamId:input.teamId,clientId:request.client_id,dueDate:input.dueDate,whyReason:request.description,expectedOutcome:request.expected_outcome},audit:async(transaction,demandId)=>{await audit(transaction,session,moduleId,'DEMAND_CREATED_FROM_EXTERNAL_REQUEST','demand',demandId,{externalRequestId:id});}});
      const now=new Date();
      const updated=await trx.updateTable('external_requests').set({status:'converted',converted_demand_id:demand.id,reviewed_by:session.id,reviewed_at:now,updated_at:now,version:sql`version + 1`}).where('id','=',id).where('version','=',input.version).returningAll().executeTakeFirstOrThrow();
      await audit(trx,session,moduleId,'EXTERNAL_REQUEST_CONVERTED','external_request',id,{demandId:demand.id,version:updated.version});
      return requestDto(updated);
    });
  },
};
