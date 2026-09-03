import crypto from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import {
  externalLinkCreatedSchema,
  externalLinkDtoSchema,
  externalRequestDtoSchema,
  externalRequestListSchema,
  externalRequestReceiptSchema,
  publicExternalLinkSchema,
} from '../../contracts/index.js';
import { handleApiError, sendApiError } from '../apiErrors.js';
import { externalRequestsService, type ExternalSession } from './service.js';

const safe=(handler:(req:Request,res:Response)=>Promise<unknown>)=>async(req:Request,res:Response)=>{try{await handler(req,res);}catch(error){handleApiError(error,req,res);}};
const json=(res:Response,schema:{parse(value:unknown):unknown},value:unknown,status=200)=>res.status(status).json(schema.parse(value));

export const createExternalRequestsRouter=(can:(res:Response,permission:string)=>Promise<boolean>)=>{
  const router=Router();
  const requirePermission=(permission:string)=>async(req:Request,res:Response,next:()=>void)=>{try{if(!await can(res,permission))return sendApiError(res,403,'FORBIDDEN','Permissão insuficiente.');next();}catch{return sendApiError(res,503,'SERVICE_UNAVAILABLE','Não foi possível validar a autorização.');}};
  const session=(res:Response)=>res.locals.session as ExternalSession;
  const moduleId=(res:Response)=>String(res.locals.moduleId);
  router.post('/external-request-links',requirePermission('external_requests:manage'),safe(async(req,res)=>json(res,externalLinkCreatedSchema,await externalRequestsService.createLink(session(res),moduleId(res),req.body),201)));
  router.patch('/external-request-links/:linkId/revoke',requirePermission('external_requests:manage'),safe(async(req,res)=>json(res,externalLinkDtoSchema,await externalRequestsService.revokeLink(session(res),moduleId(res),req.params.linkId,req.body))));
  router.get('/external-requests',requirePermission('external_requests:read'),safe(async(req,res)=>json(res,externalRequestListSchema,await externalRequestsService.list(moduleId(res),req.query))));
  router.patch('/external-requests/:requestId',requirePermission('external_requests:manage'),safe(async(req,res)=>json(res,externalRequestDtoSchema,await externalRequestsService.review(session(res),moduleId(res),req.params.requestId,req.body))));
  router.post('/external-requests/:requestId/convert',requirePermission('external_requests:manage'),safe(async(req,res)=>json(res,externalRequestDtoSchema,await externalRequestsService.convert(session(res),moduleId(res),req.params.requestId,req.body))));
  return router;
};

const publicLimiter=rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:true,legacyHeaders:false,keyGenerator:req=>crypto.createHash('sha256').update(`${ipKeyGenerator(req.ip??'')}|${req.params.token??''}`).digest('hex'),handler:(_req,res)=>sendApiError(res,429,'FORBIDDEN','Muitas tentativas. Aguarde antes de tentar novamente.')});
export const createPublicExternalRequestsRouter=()=>{
  const router=Router();
  router.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');next();});
  router.get('/request-links/:token',publicLimiter,safe(async(req,res)=>json(res,publicExternalLinkSchema,await externalRequestsService.publicInfo(req.params.token))));
  router.post('/request-links/:token',publicLimiter,safe(async(req,res)=>json(res,externalRequestReceiptSchema,await externalRequestsService.submit(req.params.token,req.body),201)));
  return router;
};
