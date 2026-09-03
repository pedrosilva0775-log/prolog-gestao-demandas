import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { apiErrorResponseSchema, type ApiErrorCode } from '../contracts/common.js';
import { logger } from './logger.js';

type ApiErrorOptions = {
  fieldErrors?: Record<string, string[]>;
  issues?: Array<{ path: string; message: string }>;
};

export const apiErrorCodeForStatus = (status: number): ApiErrorCode => {
  if (status === 401) return 'AUTHENTICATION_REQUIRED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 413) return 'PAYLOAD_TOO_LARGE';
  if (status === 415) return 'UNSUPPORTED_MEDIA_TYPE';
  if (status === 422 || status === 400) return 'VALIDATION_ERROR';
  if (status === 503) return 'SERVICE_UNAVAILABLE';
  return 'INTERNAL_ERROR';
};

export const sendApiError = (
  res: Response,
  status: number,
  code: ApiErrorCode,
  message: string,
  options: ApiErrorOptions = {}
) => {
  let requestId = String(res.getHeader('X-Request-Id') || '');
  if (!requestId) {
    requestId = crypto.randomUUID();
    res.setHeader('X-Request-Id', requestId);
  }
  const payload = apiErrorResponseSchema.parse({ message, code, requestId, ...options });
  return res.status(status).json(payload);
};

export const handleApiError = (error: unknown, req: Request, res: Response) => {
  if (error instanceof z.ZodError) {
    const fieldErrors=error.issues.reduce<Record<string,string[]>>((all,issue)=>{const field=issue.path.join('.')||'_root';(all[field]??=[]).push(issue.message);return all;},{});
    return sendApiError(res,422,'VALIDATION_ERROR','Dados inválidos.',{fieldErrors,issues:error.issues.map(issue=>({path:issue.path.join('.'),message:issue.message}))});
  }
  if (typeof error==='object'&&error&&'code' in error&&(error.code==='23505'||error.code==='23503')) return sendApiError(res,409,'CONFLICT',error.code==='23505'?'Registro duplicado.':'O registro referencia dados inexistentes ou ainda utilizados.');
  if (typeof error==='object'&&error&&'status' in error&&typeof error.status==='number') return sendApiError(res,error.status,apiErrorCodeForStatus(error.status),error instanceof Error?error.message:'Operação inválida.');
  logger.error('api_operation_failed',{requestId:res.getHeader('X-Request-Id'),route:req.path,errorName:error instanceof Error?error.name:'UnknownError',errorMessage:error instanceof Error?error.message:'Unknown failure'});
  if (!res.headersSent) return sendApiError(res,500,'INTERNAL_ERROR','Falha interna ao processar a operação.');
};
