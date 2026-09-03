import { z } from 'zod';
import { identifierSchema } from './common';
export const userRoleSchema=z.enum(['admin','gestor','colaborador','diretoria']);
export const customPermissionsSchema=z.object({granted:z.array(identifierSchema).max(200),revoked:z.array(identifierSchema).max(200)}).strict();
export const publicUserDtoSchema=z.object({id:identifierSchema,email:z.string().email(),name:z.string().min(2).max(160),role:userRoleSchema,roleTitle:z.string().max(120),department:z.string().max(120),branch:z.string().optional(),phone:z.string().optional(),avatar:z.string(),active:z.boolean(),mfaEnabled:z.boolean().optional(),approvalStatus:z.enum(['pending','approved','rejected']).optional(),teamIds:z.array(identifierSchema),customPermissions:customPermissionsSchema.optional()}).strict();
export const userUpdateSchema=z.object({name:z.string().min(2).max(160).optional(),email:z.string().email().optional(),role:userRoleSchema.optional(),roleTitle:z.string().max(120).optional(),department:z.string().max(120).optional(),branch:z.string().max(120).nullable().optional(),phone:z.string().max(40).nullable().optional(),avatar:z.string().max(3*1024*1024).optional(),teamIds:z.array(identifierSchema).max(100).optional(),active:z.boolean().optional(),approvalStatus:z.enum(['pending','approved','rejected']).optional(),customPermissions:customPermissionsSchema.optional()}).strict();
export const userUpdateResponseSchema=publicUserDtoSchema;
export type UserUpdateInput=z.input<typeof userUpdateSchema>;
