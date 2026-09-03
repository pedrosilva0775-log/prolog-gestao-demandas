import { z } from 'zod'; import { identifierSchema,isoDateTimeSchema } from './common';
export const sessionDtoSchema=z.object({id:identifierSchema,device:z.string(),startedAt:isoDateTimeSchema,lastActiveAt:isoDateTimeSchema,expiresAt:isoDateTimeSchema,isCurrent:z.boolean()}).strict();
export const sessionListResponseSchema=z.array(sessionDtoSchema);
