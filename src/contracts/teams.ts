import { z } from 'zod';
import { identifierSchema, isoDateTimeSchema, optimisticVersionSchema } from './common';

export const teamCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().max(500).default(''),
  department: z.string().max(120).default(''),
  leaderId: identifierSchema.nullable().optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).default('#2563eb'),
  active: z.boolean().default(true),
  memberIds: z.array(identifierSchema).default([])
});
export const teamUpdateSchema = teamCreateSchema.partial().extend({ description: z.string().max(500).optional(), department: z.string().max(120).optional(), color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(), active: z.boolean().optional(), memberIds: z.array(identifierSchema).optional() });
export const teamDtoSchema = z.object({
  id: identifierSchema, name: z.string(), description: z.string(), department: z.string(),
  leaderId: z.string(), color: z.string(), active: z.boolean(), memberIds: z.array(z.string()),
  version: optimisticVersionSchema, createdAt: isoDateTimeSchema, updatedAt: isoDateTimeSchema
}).strip();
export const teamListItemDtoSchema = teamDtoSchema;

export type TeamCreateInput = z.input<typeof teamCreateSchema>;
export type TeamUpdateInput = z.input<typeof teamUpdateSchema>;
export type TeamDto = z.infer<typeof teamDtoSchema>;
export type TeamListItemDto = z.infer<typeof teamListItemDtoSchema>;
