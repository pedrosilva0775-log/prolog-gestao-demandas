import { z } from 'zod';
import { demandListQuerySchema } from './demands';

export const demandMetricsQuerySchema=demandListQuerySchema;
const countByIdSchema=z.object({id:z.string(),count:z.number().int().nonnegative()}).strict();
export const demandMetricsSchema=z.object({total:z.number().int().nonnegative(),completed:z.number().int().nonnegative(),inProgress:z.number().int().nonnegative(),blocked:z.number().int().nonnegative(),overdue:z.number().int().nonnegative(),onTimeCompleted:z.number().int().nonnegative(),onTimeRate:z.number().int().min(0).max(100),averageCompletionDays:z.number().nonnegative(),byStatus:z.array(countByIdSchema),byPriority:z.array(countByIdSchema),byCategory:z.array(countByIdSchema),byTeam:z.array(z.object({id:z.string().nullable(),count:z.number().int().nonnegative(),blocked:z.number().int().nonnegative()}).strict())}).strict();
export type DemandMetrics=z.infer<typeof demandMetricsSchema>;
