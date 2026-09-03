import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { authorizedModuleListSchema, moduleDeleteSchema, moduleDtoSchema, moduleListResponseSchema, moduleMemberDtoSchema, moduleTeamDtoSchema, moduleTeamLinkSchema } from '../../contracts/index.js';
import { handleApiError } from '../apiErrors.js';
import { modulesService, type ModuleSession } from './service.js';

const session=(res:Response)=>res.locals.session as ModuleSession;
const route=(handler:(req:Request,res:Response)=>Promise<unknown>)=>async(req:Request,res:Response)=>{try{await handler(req,res);}catch(error){return handleApiError(error,req,res);}};
const json=<T>(res:Response,schema:z.ZodType<T>,value:unknown,status=200)=>res.status(status).json(schema.parse(value));

export const createModulesRouter=()=>{
  const router=Router();
  router.get('/me/modules',route(async(_req,res)=>json(res,authorizedModuleListSchema,await modulesService.listAuthorized(session(res)))));
  router.get('/modules',route(async(req,res)=>json(res,moduleListResponseSchema,await modulesService.listAdmin(session(res),req.query))));
  router.post('/modules',route(async(req,res)=>json(res,moduleDtoSchema,await modulesService.create(session(res),req.body),201)));
  router.get('/modules/:moduleId',route(async(req,res)=>json(res,moduleDtoSchema,await modulesService.get(session(res),req.params.moduleId))));
  router.patch('/modules/:moduleId',route(async(req,res)=>json(res,moduleDtoSchema,await modulesService.update(session(res),req.params.moduleId,req.body))));
  router.delete('/modules/:moduleId',route(async(req,res)=>{const {version}=moduleDeleteSchema.parse(req.query);await modulesService.remove(session(res),req.params.moduleId,version);res.status(204).end();}));
  router.get('/modules/:moduleId/members',route(async(req,res)=>json(res,z.array(moduleMemberDtoSchema),await modulesService.members(session(res),req.params.moduleId))));
  router.post('/modules/:moduleId/members',route(async(req,res)=>json(res,moduleMemberDtoSchema,await modulesService.addMember(session(res),req.params.moduleId,req.body),201)));
  router.patch('/modules/:moduleId/members/:userId',route(async(req,res)=>json(res,moduleMemberDtoSchema,await modulesService.updateMember(session(res),req.params.moduleId,req.params.userId,req.body))));
  router.delete('/modules/:moduleId/members/:userId',route(async(req,res)=>{await modulesService.removeMember(session(res),req.params.moduleId,req.params.userId);res.status(204).end();}));
  router.get('/modules/:moduleId/teams',route(async(req,res)=>json(res,z.array(moduleTeamDtoSchema),await modulesService.teams(session(res),req.params.moduleId))));
  router.post('/modules/:moduleId/teams',route(async(req,res)=>{const {teamId}=moduleTeamLinkSchema.parse(req.body);json(res,moduleTeamDtoSchema,await modulesService.addTeam(session(res),req.params.moduleId,teamId),201);}));
  router.delete('/modules/:moduleId/teams/:teamId',route(async(req,res)=>{await modulesService.removeTeam(session(res),req.params.moduleId,req.params.teamId);res.status(204).end();}));
  return router;
};
