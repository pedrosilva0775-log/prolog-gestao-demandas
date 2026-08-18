import fs from 'node:fs'; import pg from 'pg'; import 'dotenv/config';
const url = process.env.DATABASE_URL; if (!url) throw new Error('DATABASE_URL não configurada.');
const client = new pg.Client({ connectionString: url, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined });
await client.connect(); await client.query(fs.readFileSync('db/seed.sql','utf8')); await client.end(); console.log('Seed estrutural aplicado.');
