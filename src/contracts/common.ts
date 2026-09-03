import { z } from 'zod';

export const identifierSchema = z.string().trim().min(1).max(200);
export const isoDateTimeSchema = z.string().datetime({ offset: true });
export const calendarDateSchema = z.string().date();
export const serializedDateSchema = z.union([isoDateTimeSchema, calendarDateSchema]);
export const optimisticVersionSchema = z.number().int().positive();
export const noContentSchema = z.undefined();

export const paginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive().max(200),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative()
});

export const apiErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'AUTHENTICATION_REQUIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'UNSUPPORTED_MEDIA_TYPE',
  'PAYLOAD_TOO_LARGE',
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR'
]);

export const apiErrorResponseSchema = z.object({
  message: z.string().min(1),
  code: apiErrorCodeSchema,
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  requestId: z.string().min(1),
  issues: z.array(z.object({ path: z.string(), message: z.string() })).optional()
}).strict();

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export type Pagination = z.infer<typeof paginationSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
export type NoContent = z.infer<typeof noContentSchema>;
