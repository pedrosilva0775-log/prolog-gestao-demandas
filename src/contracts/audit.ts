import { z } from 'zod'; import { identifierSchema,isoDateTimeSchema } from './common';
export const auditQuerySchema=z.object({limit:z.coerce.number().int().min(1).max(500).default(100)});
export const auditLogDtoSchema=z.object({id:identifierSchema,action:z.string(),actor:z.object({id:z.string().nullable(),name:z.string().nullable()}),entity:z.object({type:z.string(),id:z.string().nullable()}),timestamp:isoDateTimeSchema}).strict();
export const auditListResponseSchema=z.array(auditLogDtoSchema);
