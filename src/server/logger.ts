import crypto from 'node:crypto';
import { RequestHandler } from 'express';
import { recordHttpMetric } from './metrics.js';

type Level = 'debug' | 'info' | 'warn' | 'error';
const sensitive = /password|authorization|cookie|token|credential|secret|phone|email/i;

export const redact = (value: unknown, depth = 0): unknown => {
  if (depth > 6) return '[MAX_DEPTH]';
  if (Array.isArray(value)) return value.map(item => redact(item, depth + 1));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,item]) => [key, sensitive.test(key) ? '[REDACTED]' : redact(item, depth + 1)]));
  return value;
};

const write = (level: Level, event: string, attributes: Record<string, unknown> = {}) => {
  const line = JSON.stringify({timestamp:new Date().toISOString(),level,service:'prolog',environment:process.env.NODE_ENV || 'development',event,...redact(attributes) as object});
  (level === 'error' ? process.stderr : process.stdout).write(`${line}\n`);
};

export const logger = {
  info:(event:string,attributes?:Record<string,unknown>)=>write('info',event,attributes),
  warn:(event:string,attributes?:Record<string,unknown>)=>write('warn',event,attributes),
  error:(event:string,attributes?:Record<string,unknown>)=>write('error',event,attributes),
};

export const requestLogger: RequestHandler = (req,res,next) => {
  const requestId=req.get('x-request-id')||crypto.randomUUID();
  const started=performance.now();
  res.setHeader('X-Request-Id',requestId);
  res.on('finish',()=>{const durationMs=Math.round(performance.now()-started);recordHttpMetric(req.method,res.statusCode,durationMs);logger.info('http_request_completed',{requestId,method:req.method,path:req.path,statusCode:res.statusCode,durationMs,actorId:res.locals.session?.id});});
  next();
};
