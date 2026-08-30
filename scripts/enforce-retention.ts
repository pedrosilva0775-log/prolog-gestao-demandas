import 'dotenv/config';
import { sql } from 'kysely';
import { closeDatabase, getDatabase } from '../src/server/database.js';
import { logger } from '../src/server/logger.js';

const db=getDatabase();
const policies=await db.selectFrom('retention_policies').selectAll().execute();
const policy=(entity:string)=>policies.find(item=>item.entity_type===entity);

try{
  const result=await db.transaction().execute(async trx=>{
    const counts:Record<string,number>={};
    const users=policy('users');
    if(users?.anonymize_after_expiry){const changed=await sql<{count:bigint}>`WITH changed AS (UPDATE users SET email=('deleted+' || id || '@invalid.local')::citext,name='Titular anonimizado',phone=NULL,avatar=NULL,branch=NULL,active=false,mfa_enabled=false,mfa_secret_encrypted=NULL,updated_at=now() WHERE deleted_at IS NOT NULL AND deleted_at < now() - (${users.retention_days} * interval '1 day') RETURNING 1) SELECT count(*)::bigint AS count FROM changed`.execute(trx);counts.users=Number(changed.rows[0]?.count||0);}
    const clients=policy('clients');
    if(clients?.anonymize_after_expiry){const changed=await sql<{count:bigint}>`WITH changed AS (UPDATE clients SET name='Titular anonimizado',company='Organização anonimizada',email=('deleted+' || id || '@invalid.local')::citext,phone=NULL,active=false,deleted_at=coalesce(deleted_at,now()),version=version+1,updated_at=now() WHERE (retention_until IS NOT NULL AND retention_until < now()) OR (deleted_at IS NOT NULL AND deleted_at < now() - (${clients.retention_days} * interval '1 day')) RETURNING 1) SELECT count(*)::bigint AS count FROM changed`.execute(trx);counts.clients=Number(changed.rows[0]?.count||0);}
    const demands=policy('demands');
    if(demands?.anonymize_after_expiry){const changed=await sql<{count:bigint}>`WITH changed AS (UPDATE demands SET title='Demanda anonimizada',description='',payload='{}'::jsonb,assignee_id=NULL,client_id=NULL,version=version+1,updated_at=now() WHERE deleted_at IS NOT NULL AND deleted_at < now() - (${demands.retention_days} * interval '1 day') RETURNING 1) SELECT count(*)::bigint AS count FROM changed`.execute(trx);counts.demands=Number(changed.rows[0]?.count||0);}
    const sessions=policy('auth_sessions');
    if(sessions){const deleted=await sql<{count:bigint}>`WITH changed AS (DELETE FROM auth_sessions WHERE coalesce(revoked_at,expires_at) < now() - (${sessions.retention_days} * interval '1 day') RETURNING 1) SELECT count(*)::bigint AS count FROM changed`.execute(trx);counts.auth_sessions=Number(deleted.rows[0]?.count||0);}
    const tokens=await sql<{count:bigint}>`WITH changed AS (DELETE FROM password_reset_tokens WHERE expires_at < now() - interval '7 days' RETURNING 1) SELECT count(*)::bigint AS count FROM changed`.execute(trx);counts.password_reset_tokens=Number(tokens.rows[0]?.count||0);
    return counts;
  });
  logger.info('retention_enforcement_completed',{counts:result});
}catch(error){logger.error('retention_enforcement_failed',{errorName:error instanceof Error?error.name:'UnknownError'});process.exitCode=1;}finally{await closeDatabase();}
