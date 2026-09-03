import { z } from 'zod';
import { identifierSchema, isoDateTimeSchema, optimisticVersionSchema, paginationSchema } from './common';

export const externalRequestTypeSchema=z.enum(['task','project','improvement']);
export const externalRequestStatusSchema=z.enum(['received','in_review','converted','refused']);
export const externalLinkCreateSchema=z.object({clientId:identifierSchema,moduleId:identifierSchema,recipientUserId:identifierSchema,allowedTypes:z.array(externalRequestTypeSchema).min(1).max(3),expiresAt:isoDateTimeSchema.optional(),maxSubmissions:z.number().int().min(1).max(100).default(1)}).strict();
export const externalLinkDtoSchema=z.object({id:identifierSchema,clientId:identifierSchema,moduleId:identifierSchema,recipientUserId:identifierSchema,allowedTypes:z.array(externalRequestTypeSchema),expiresAt:isoDateTimeSchema,maxSubmissions:z.number().int().positive(),submissionCount:z.number().int().nonnegative(),revokedAt:isoDateTimeSchema.nullable(),createdAt:isoDateTimeSchema,version:optimisticVersionSchema}).strict();
export const externalLinkCreatedSchema=z.object({link:externalLinkDtoSchema,token:z.string().min(32),path:z.string().startsWith('/request/')}).strict();
export const externalLinkRevokeSchema=z.object({version:optimisticVersionSchema}).strict();
export const publicExternalLinkSchema=z.object({clientName:z.string().min(1),allowedTypes:z.array(externalRequestTypeSchema),expiresAt:isoDateTimeSchema,remainingSubmissions:z.number().int().nonnegative()}).strict();
export const externalRequestSubmitSchema=z.object({idempotencyKey:z.string().uuid(),name:z.string().trim().min(2).max(160),email:z.string().trim().email().max(254),type:externalRequestTypeSchema,title:z.string().trim().min(3).max(240),description:z.string().trim().min(10).max(10000),expectedOutcome:z.string().trim().max(5000).default(''),desiredDueDate:z.string().date().nullable().optional(),perceivedImpact:z.string().trim().max(2000).nullable().optional()}).strict();
export const externalRequestReceiptSchema=z.object({protocol:z.string().regex(/^EXT-[A-Z0-9]{12}$/),receivedAt:isoDateTimeSchema,message:z.string()}).strict();
export const externalRequestDtoSchema=z.object({id:identifierSchema,protocol:z.string(),moduleId:identifierSchema,clientId:identifierSchema,recipientUserId:identifierSchema,declaredName:z.string(),declaredEmail:z.string().email(),type:externalRequestTypeSchema,title:z.string(),description:z.string(),expectedOutcome:z.string(),desiredDueDate:z.string().date().nullable(),perceivedImpact:z.string().nullable(),status:externalRequestStatusSchema,convertedDemandId:identifierSchema.nullable(),reviewedBy:identifierSchema.nullable(),reviewedAt:isoDateTimeSchema.nullable(),refusalReason:z.string().nullable(),version:optimisticVersionSchema,createdAt:isoDateTimeSchema,updatedAt:isoDateTimeSchema}).strict();
export const externalRequestQuerySchema=z.object({status:externalRequestStatusSchema.optional(),page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25)}).strict();
export const externalRequestListSchema=z.object({items:z.array(externalRequestDtoSchema),pagination:paginationSchema}).strict();
export const externalRequestReviewSchema=z.object({version:optimisticVersionSchema,status:z.enum(['in_review','refused']),reason:z.string().trim().min(10).max(2000).optional()}).strict().superRefine((v,c)=>{if(v.status==='refused'&&!v.reason)c.addIssue({code:'custom',path:['reason'],message:'Informe o motivo da recusa.'});});
export const externalRequestConvertSchema=z.object({version:optimisticVersionSchema,categoryId:identifierSchema,assigneeId:identifierSchema,teamId:identifierSchema,priorityId:identifierSchema,dueDate:z.string().date()}).strict();

export type ExternalLinkCreate=z.input<typeof externalLinkCreateSchema>;
export type ExternalRequestSubmit=z.input<typeof externalRequestSubmitSchema>;
