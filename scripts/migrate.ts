import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import 'dotenv/config';

const url=process.env.DATABASE_URL;if(!url)throw new Error('DATABASE_URL não configurada.');
const client=new pg.Client({connectionString:url,ssl:process.env.DB_SSL==='true'?{rejectUnauthorized:true}:undefined});
await client.connect();
try{
  await client.query('SELECT pg_advisory_lock($1)',[742019]);
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
  const directory=path.resolve('db/migrations');
  for(const file of fs.readdirSync(directory).filter(item=>item.endsWith('.sql')).sort()){
    const sql=fs.readFileSync(path.join(directory,file),'utf8');
    const checksum=crypto.createHash('sha256').update(sql).digest('hex');
    const applied=await client.query<{checksum:string}>('SELECT checksum FROM schema_migrations WHERE version=$1',[file]);
    if(applied.rowCount){if(applied.rows[0].checksum!==checksum)throw new Error(`Migration já aplicada foi alterada: ${file}`);continue;}
    await client.query('BEGIN');
    try{await client.query(sql);await client.query('INSERT INTO schema_migrations(version,checksum) VALUES($1,$2)',[file,checksum]);await client.query('COMMIT');}
    catch(error){await client.query('ROLLBACK');throw error;}
  }
}finally{
  await client.query('SELECT pg_advisory_unlock($1)',[742019]).catch(()=>undefined);
  await client.end();
}
process.stdout.write('Migrations aplicadas.\n');
