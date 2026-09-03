import crypto from 'node:crypto';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'kysely';
import { categoryConfigDtoSchema, priorityConfigDtoSchema, statusConfigDtoSchema } from '../contracts/index.js';
import { createApp } from './app.js';
import { closeDatabase, getDatabase } from './database.js';
import { hashPassword } from './password.js';
import { INITIAL_CATEGORIES, INITIAL_PRIORITIES, INITIAL_STATUSES } from '../data/initialData.js';

const run=process.env.RUN_DB_TESTS==='true';
const suffix=crypto.randomUUID();
const adminId=`external-admin-${suffix}`;
const clientId=`external-client-${suffix}`;
const teamId=`external-team-${suffix}`;
const email=`${adminId}@test.local`;
const csrf=async(agent:ReturnType<typeof request.agent>)=>{const response=await agent.get('/api/auth/config').expect(200);const cookie=String(response.headers['set-cookie']?.[0]??response.headers['set-cookie']??'');return decodeURIComponent(cookie.match(/prolog_csrf=([^;]+)/)?.[1]??'');};

describe.skipIf(!run)('solicitações externas PostgreSQL',()=>{
  let app:Express;
  const previousFlag=process.env.EXTERNAL_REQUESTS_ENABLED;
  beforeAll(async()=>{
    process.env.EXTERNAL_REQUESTS_ENABLED='true';
    const db=getDatabase();const now=new Date();
    await db.insertInto('users').values({id:adminId,email,name:'Administrador externo sintético',password_hash:hashPassword('External123'),role:'admin',role_title:'Admin',department:'Teste',branch:null,phone:null,avatar:null,active:true,force_password_change:false,deleted_at:null,password_changed_at:null,mfa_enabled:false,mfa_secret_encrypted:null,failed_mfa_attempts:0,locked_until:null,created_at:now,updated_at:now}).execute();
    await db.insertInto('module_members').values({module_id:'mod-default',user_id:adminId,role:'module_admin',active:true,created_by:adminId,created_at:now,updated_at:now}).execute();
    await db.insertInto('clients').values({id:clientId,name:'Contato sintético',company:'Cliente sintético',email:`client-${suffix}@test.local`,phone:null,active:true,deleted_at:null,version:1,legal_basis:'Teste isolado',retention_until:new Date('2099-12-31'),created_at:now,updated_at:now}).execute();
    await db.insertInto('teams').values({id:teamId,name:`Equipe externa ${suffix}`,description:'Teste',department:'Teste',leader_id:adminId,color:'#2563eb',active:true,deleted_at:null,version:1,created_at:now,updated_at:now}).execute();
    await db.insertInto('team_modules').values({module_id:'mod-default',team_id:teamId,created_by:adminId,created_at:now}).execute();
    await db.insertInto('module_configurations').values([
      {module_id:'mod-default',key:'categories',value:sql<unknown>`${JSON.stringify(INITIAL_CATEGORIES)}::jsonb`,updated_by:adminId,updated_at:now},
      {module_id:'mod-default',key:'priorities',value:sql<unknown>`${JSON.stringify(INITIAL_PRIORITIES)}::jsonb`,updated_by:adminId,updated_at:now},
      {module_id:'mod-default',key:'statuses',value:sql<unknown>`${JSON.stringify(INITIAL_STATUSES)}::jsonb`,updated_by:adminId,updated_at:now},
    ]).onConflict(conflict=>conflict.columns(['module_id','key']).doNothing()).execute();
    app=await createApp();
  });
  afterAll(async()=>{
    await closeDatabase();
    if(previousFlag===undefined)delete process.env.EXTERNAL_REQUESTS_ENABLED;else process.env.EXTERNAL_REQUESTS_ENABLED=previousFlag;
  });

  it('protege destino, idempotência, quota e conversão atômica',async()=>{
    const agent=request.agent(app);const token=await csrf(agent);
    await agent.post('/api/auth/login').set('X-CSRF-Token',token).send({email,password:'External123'}).expect(200);
    const created=await agent.post('/api/v1/modules/mod-default/external-request-links').set('X-CSRF-Token',token).send({moduleId:'mod-default',clientId,recipientUserId:adminId,allowedTypes:['task'],maxSubmissions:1}).expect(201);
    expect(created.body.token).toBeTruthy();
    const publicInfo=await request(app).get(`/api/public/request-links/${created.body.token}`).expect(200);
    expect(publicInfo.body).toMatchObject({clientName:'Cliente sintético',remainingSubmissions:1});
    const idempotencyKey=crypto.randomUUID();
    const submission={idempotencyKey,name:'Solicitante sintético',email:`sender-${suffix}@test.local`,type:'task',title:'Solicitação externa válida',description:'Descrição sintética suficientemente detalhada.',expectedOutcome:'Resultado esperado'};
    const first=await request(app).post(`/api/public/request-links/${created.body.token}`).send(submission).expect(201);
    const repeated=await request(app).post(`/api/public/request-links/${created.body.token}`).send(submission).expect(201);
    expect(repeated.body.protocol).toBe(first.body.protocol);
    await request(app).post(`/api/public/request-links/${created.body.token}`).send({...submission,idempotencyKey:crypto.randomUUID()}).expect(409);
    const rows=await getDatabase().selectFrom('external_requests').selectAll().where('protocol','=',first.body.protocol).execute();expect(rows).toHaveLength(1);
    const link=await getDatabase().selectFrom('external_request_links').select('submission_count').where('id','=',created.body.link.id).executeTakeFirstOrThrow();expect(link.submission_count).toBe(1);
    const listed=await agent.get('/api/v1/modules/mod-default/external-requests').expect(200);const external=listed.body.items.find((item:{protocol:string})=>item.protocol===first.body.protocol);expect(external).toBeTruthy();
    const configs=await getDatabase().selectFrom('module_configurations').select(['key','value']).where('module_id','=','mod-default').where('key','in',['categories','priorities','statuses']).execute();
    const category=categoryConfigDtoSchema.array().parse(configs.find(row=>row.key==='categories')?.value)[0]!;
    const priority=priorityConfigDtoSchema.array().parse(configs.find(row=>row.key==='priorities')?.value).find(item=>item.active)!;
    expect(statusConfigDtoSchema.array().parse(configs.find(row=>row.key==='statuses')?.value).some(item=>item.active&&item.category==='open')).toBe(true);
    const converted=await agent.post(`/api/v1/modules/mod-default/external-requests/${external.id}/convert`).set('X-CSRF-Token',token).send({version:external.version,categoryId:category.id,priorityId:priority.id,assigneeId:adminId,teamId,dueDate:'2099-12-30'}).expect(200);
    expect(converted.body.status).toBe('converted');expect(converted.body.convertedDemandId).toBeTruthy();
    await agent.post(`/api/v1/modules/mod-default/external-requests/${external.id}/convert`).set('X-CSRF-Token',token).send({version:external.version,categoryId:category.id,priorityId:priority.id,assigneeId:adminId,teamId,dueDate:'2099-12-30'}).expect(409);
    expect(await getDatabase().selectFrom('demands').select('id').where('id','=',converted.body.convertedDemandId).where('module_id','=','mod-default').where('client_id','=',clientId).executeTakeFirst()).toBeTruthy();
  });

  it('serializa envios concorrentes quando a quota é um',async()=>{
    const agent=request.agent(app);const token=await csrf(agent);await agent.post('/api/auth/login').set('X-CSRF-Token',token).send({email,password:'External123'}).expect(200);
    const created=await agent.post('/api/v1/modules/mod-default/external-request-links').set('X-CSRF-Token',token).send({moduleId:'mod-default',clientId,recipientUserId:adminId,allowedTypes:['project'],maxSubmissions:1}).expect(201);
    const payload=(key:string)=>({idempotencyKey:key,name:'Concorrente sintético',email:`race-${suffix}@test.local`,type:'project',title:'Envio concorrente válido',description:'Descrição sintética suficientemente detalhada.'});
    const responses=await Promise.all([request(app).post(`/api/public/request-links/${created.body.token}`).send(payload(crypto.randomUUID())),request(app).post(`/api/public/request-links/${created.body.token}`).send(payload(crypto.randomUUID()))]);
    expect(responses.map(item=>item.status).sort()).toEqual([201,409]);
    const persisted=await getDatabase().selectFrom('external_request_links').select('version').where('id','=',created.body.link.id).executeTakeFirstOrThrow();
    await agent.patch(`/api/v1/modules/mod-default/external-request-links/${created.body.link.id}/revoke`).set('X-CSRF-Token',token).send({version:persisted.version}).expect(200);
    await request(app).get(`/api/public/request-links/${created.body.token}`).expect(404);
    const denied=await request(app).post(`/api/public/request-links/${created.body.token}`).send(payload(crypto.randomUUID())).expect(404);
    expect(JSON.stringify(denied.body)).not.toContain(created.body.token);
    await request(app).get(`/api/public/request-links/${crypto.randomBytes(32).toString('base64url')}`).expect(404);
  });
});
