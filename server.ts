import 'dotenv/config';
import { createServer } from 'node:http';
import { createApp } from './src/server/app.js';
import { getDatabase } from './src/server/database.js';
import { logger } from './src/server/logger.js';

const port = Number(process.env.PORT || 3000);
try {
  await getDatabase().selectFrom('configurations').select('key').limit(1).execute();
  const server = createServer(await createApp());
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '0.0.0.0', () => {
      server.off('error', reject);
      logger.info('server_started', { port });
      resolve();
    });
  });
} catch (error) {
  const causes = error instanceof AggregateError
    ? error.errors.map(item => ({
        name: item instanceof Error ? item.name : 'UnknownError',
        code: typeof item === 'object' && item && 'code' in item ? String(item.code) : undefined,
        reason: item instanceof Error ? item.message : 'unknown',
      }))
    : undefined;
  logger.error('server_start_failed', {
    errorName: error instanceof Error ? error.name : 'UnknownError',
    errorCode: typeof error === 'object' && error && 'code' in error ? String(error.code) : undefined,
    reason: error instanceof Error ? error.message || error.name : 'unknown',
    causes,
  });
  process.exitCode = 1;
}
