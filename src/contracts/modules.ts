import { z } from 'zod';
import { configurationsDtoSchema } from './configurations';
import { identifierSchema, isoDateTimeSchema, optimisticVersionSchema, paginationSchema } from './common';

export const moduleSlugSchema=z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const moduleIconSchema=z.enum(['Briefcase','Code2','Workflow','FolderKanban','Warehouse','Truck','Scale','Users','Boxes']);
export const moduleRoleSchema=z.enum(['module_admin','manager','member','viewer']);
export const moduleColorSchema=z.string().regex(/^#[0-9a-f]{6}$/i);

export const moduleCreateSchema=z.object({
  name:z.string().trim().min(2).max(120),slug:moduleSlugSchema,description:z.string().trim().max(1000).default(''),
  icon:moduleIconSchema.default('FolderKanban'),color:moduleColorSchema.default('#2563eb')
}).strict();
export const moduleUpdateSchema=moduleCreateSchema.partial().extend({active:z.boolean().optional(),version:optimisticVersionSchema}).strict();
export const moduleDeleteSchema=z.object({version:z.coerce.number().int().positive()}).strict();

export const moduleCountsSchema=z.object({users:z.number().int().nonnegative(),teams:z.number().int().nonnegative(),demands:z.number().int().nonnegative()}).strict();
export const moduleDtoSchema=z.object({
  id:identifierSchema,name:z.string(),slug:moduleSlugSchema,description:z.string(),icon:moduleIconSchema,color:moduleColorSchema,
  active:z.boolean(),createdBy:identifierSchema.nullable(),version:optimisticVersionSchema,deletedAt:isoDateTimeSchema.nullable(),
  createdAt:isoDateTimeSchema,updatedAt:isoDateTimeSchema,counts:moduleCountsSchema
}).strict();

export const authorizedModuleDtoSchema=moduleDtoSchema.extend({role:moduleRoleSchema}).strict();
export const moduleMemberCreateSchema=z.object({userId:identifierSchema,role:moduleRoleSchema}).strict();
export const moduleMemberUpdateSchema=z.object({role:moduleRoleSchema.optional(),active:z.boolean().optional()}).strict().refine(value=>value.role!==undefined||value.active!==undefined,{message:'Informe ao menos uma alteração.'});
export const moduleMemberDtoSchema=z.object({moduleId:identifierSchema,userId:identifierSchema,userName:z.string(),userEmail:z.string().email(),role:moduleRoleSchema,active:z.boolean(),createdBy:identifierSchema.nullable(),createdAt:isoDateTimeSchema,updatedAt:isoDateTimeSchema}).strict();
export const moduleTeamLinkSchema=z.object({teamId:identifierSchema}).strict();
export const moduleTeamDtoSchema=z.object({moduleId:identifierSchema,teamId:identifierSchema,teamName:z.string(),createdBy:identifierSchema.nullable(),createdAt:isoDateTimeSchema}).strict();
export const moduleSelectionSchema=z.object({moduleId:identifierSchema,moduleSlug:moduleSlugSchema}).strict();
export const moduleSelectionResponseSchema=z.object({module:authorizedModuleDtoSchema,configurations:configurationsDtoSchema}).strict();
export const moduleQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().positive().max(100).default(20),search:z.string().trim().max(120).optional(),active:z.enum(['true','false']).transform(value=>value==='true').optional(),sort:z.enum(['name','createdAt','updatedAt']).default('name'),direction:z.enum(['asc','desc']).default('asc')}).strict();
export const moduleListResponseSchema=z.object({items:z.array(moduleDtoSchema),pagination:paginationSchema}).strict();
export const authorizedModuleListSchema=z.array(authorizedModuleDtoSchema);

export type ModuleCreateInput=z.input<typeof moduleCreateSchema>;
export type ModuleUpdateInput=z.input<typeof moduleUpdateSchema>;
export type ModuleDto=z.infer<typeof moduleDtoSchema>;
export type AuthorizedModuleDto=z.infer<typeof authorizedModuleDtoSchema>;
export type ModuleRole=z.infer<typeof moduleRoleSchema>;
