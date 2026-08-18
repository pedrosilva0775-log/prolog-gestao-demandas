import 'dotenv/config';
import { createServer } from 'node:http';
import { createApp } from './src/server/app.js';
import { getDatabase } from './src/server/database.js';

const port = Number(process.env.PORT || 3000);
try {
  await getDatabase().selectFrom('configurations').select('key').limit(1).execute();
  createServer(await createApp()).listen(port, '0.0.0.0', () => console.log(`PROLOG disponível em http://localhost:${port}`));
} catch (error) {
  console.error('PROLOG não iniciou: PostgreSQL indisponível ou migrations pendentes.', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
