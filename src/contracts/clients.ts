import { z } from 'zod';
import { calendarDateSchema, identifierSchema, isoDateTimeSchema, optimisticVersionSchema } from './common';

export const clientCreateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  company: z.string().trim().min(2).max(160),
  email: z.string().trim().email(),
  phone: z.string().max(40).optional().default(''),
  active: z.boolean().optional().default(true),
  legalBasis: z.string().trim().min(3).max(500).optional(),
  retentionUntil: calendarDateSchema.refine(value => new Date(`${value}T23:59:59.999Z`) > new Date(), { message: 'A retenção deve terminar no futuro.' }).optional()
});
export const clientUpdateSchema = clientCreateSchema.partial().extend({ phone: z.string().max(40).optional(), active: z.boolean().optional() });

export const clientDtoSchema = z.object({
  id: identifierSchema,
  name: z.string(), company: z.string(), email: z.string().email(),
  phone: z.string().nullable(), active: z.boolean(),
  legal_basis: z.string().nullable().optional(),
  retention_until: isoDateTimeSchema.nullable().optional(),
  created_at: isoDateTimeSchema.optional(), updated_at: isoDateTimeSchema.optional(),
  version: optimisticVersionSchema.optional()
}).strip();

export type ClientCreateInput = z.input<typeof clientCreateSchema>;
export type ClientUpdateInput = z.input<typeof clientUpdateSchema>;
export type ClientDto = z.infer<typeof clientDtoSchema>;
