import fs from 'node:fs'; import path from 'node:path'; import pg from 'pg'; import 'dotenv/config';
const url = process.env.DATABASE_URL; if (!url) throw new Error('DATABASE_URL não configurada.');
const client = new pg.Client({ connectionString: url, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined });
await client.connect();
for (const file of fs.readdirSync(path.resolve('db/migrations')).filter(file => file.endsWith('.sql')).sort()) await client.query(fs.readFileSync(path.resolve('db/migrations', file), 'utf8'));
await client.end(); console.log('Migrations aplicadas.');
