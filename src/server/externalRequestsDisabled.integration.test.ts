import crypto from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { closeDatabase, getDatabase } from './database.js';
import { hashPassword } from './password.js';

const run=process.env.RUN_DB_TESTS==='true';
describe.skipIf(!run)('solicitações externas desabilitadas por padrão',()=>{
  const userId=`disabled-external-${crypto.randomUUID()}`;
  const email=`${userId}@test.local`;
  const previousFlag=process.env.EXTERNAL_REQUESTS_ENABLED;
  let app:Awaited<ReturnType<typeof createApp>>;
  beforeAll(async()=>{
    delete process.env.EXTERNAL_REQUESTS_ENABLED;
    const now=new Date();
    await getDatabase().insertInto('users').values({id:userId,email,name:'Admin sintético flag',password_hash:hashPassword('Disabled123'),role:'admin',role_title:'Admin',department:'Teste',branch:null,phone:null,avatar:null,active:true,force_password_change:false,deleted_at:null,password_changed_at:null,mfa_enabled:false,mfa_secret_encrypted:null,failed_mfa_attempts:0,locked_until:null,created_at:now,updated_at:now}).execute();
    await getDatabase().insertInto('module_members').values({module_id:'mod-default',user_id:userId,role:'module_admin',active:true,created_by:userId,created_at:now,updated_at:now}).execute();
    app=await createApp();
  });
  afterAll(async()=>{await getDatabase().deleteFrom('auth_sessions').where('user_id','=',userId).execute();await getDatabase().deleteFrom('module_members').where('user_id','=',userId).execute();await getDatabase().deleteFrom('users').where('id','=',userId).execute();await closeDatabase();if(previousFlag===undefined)delete process.env.EXTERNAL_REQUESTS_ENABLED;else process.env.EXTERNAL_REQUESTS_ENABLED=previousFlag;});
  it('não expõe rotas públicas nem internas quando a flag está fechada',async()=>{
    const publicGet=await request(app).get('/api/public/request-links/token-inexistente').expect(404);expect(publicGet.body).toMatchObject({code:'NOT_FOUND'});
    const publicPost=await request(app).post('/api/public/request-links/token-inexistente').send({}).expect(404);expect(publicPost.body).toMatchObject({code:'NOT_FOUND'});
    const agent=request.agent(app);const config=await agent.get('/api/auth/config').expect(200);const cookie=String(config.headers['set-cookie']?.[0]??config.headers['set-cookie']??'');const csrf=decodeURIComponent(cookie.match(/prolog_csrf=([^;]+)/)?.[1]??'');
    await agent.post('/api/auth/login').set('X-CSRF-Token',csrf).send({email,password:'Disabled123'}).expect(200);
    await agent.get('/api/v1/modules/mod-default/external-requests').expect(404);
    await agent.post('/api/v1/modules/mod-default/external-request-links').set('X-CSRF-Token',csrf).send({}).expect(404);
  });
});
