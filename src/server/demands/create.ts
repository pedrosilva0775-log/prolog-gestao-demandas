import crypto from 'node:crypto';
import { sql, type Kysely, type Transaction } from 'kysely';
import { demandCreateSchema, type DemandCreateInput } from '../../contracts/index.js';
import { createDefaultChecklist } from '../../data/defaultChecklist.js';
import type { Database } from '../database.js';
import { rejectCompletedStatusForGenericWrite, validateDemandReferences } from './workflow.js';

type AuditCreatedDemand = (
  transaction: Transaction<Database>,
  demandId: string,
  createdPayload: Record<string, unknown>,
) => Promise<void>;

export const createDemandTransactionally = async (options: {
  database: Kysely<Database>;
  moduleId: string;
  requesterId: string;
  input: DemandCreateInput;
  audit?: AuditCreatedDemand;
}) => {
  return options.database.transaction().execute(transaction => createDemandInTransaction({...options,transaction}));
};

export const createDemandInTransaction = async (options: {
  transaction: Transaction<Database>;
  moduleId: string;
  requesterId: string;
  input: DemandCreateInput;
  audit?: AuditCreatedDemand;
}) => {
  const input = demandCreateSchema.parse(options.input);
  await rejectCompletedStatusForGenericWrite(options.transaction, options.moduleId, input.statusId);
  await validateDemandReferences(options.transaction, options.moduleId, input);
  const id = `dem-${crypto.randomUUID()}`;
  const now = new Date();
  const year = now.getFullYear();

  const transaction=options.transaction;
    await sql`select pg_advisory_xact_lock(hashtext('prolog-demand-code'))`.execute(transaction);
    const existing = await transaction.selectFrom('demands').select('code').where('code', 'like', `DEM-${year}-%`).execute();
    const nextNumber = existing.reduce((highest, item) => {
      const parsed = Number.parseInt(item.code.slice(`DEM-${year}-`.length), 10);
      return Number.isFinite(parsed) ? Math.max(highest, parsed) : highest;
    }, 0) + 1;
    const code = `DEM-${year}-${String(nextNumber).padStart(3, '0')}`;
    const created = {
      ...input,
      id,
      code,
      requesterId: options.requesterId,
      checklist: input.checklist?.length ? input.checklist : createDefaultChecklist(),
    };
    await transaction.insertInto('demands').values({
      id,
      module_id: options.moduleId,
      code,
      title: input.title,
      description: input.description,
      status_id: input.statusId,
      priority_id: input.priorityId,
      category_id: input.categoryId,
      requester_id: options.requesterId,
      assignee_id: input.assigneeId || null,
      team_id: input.teamId || null,
      client_id: input.clientId || null,
      sprint_id: null,
      backlog_position: 0,
      due_date: input.dueDate ? new Date(`${String(input.dueDate).slice(0, 10)}T00:00:00.000Z`) : null,
      payload: created,
      version: 1,
      deleted_at: null,
      completed_at: null,
      archived_at: null,
      created_at: now,
      updated_at: now,
    }).execute();
    await options.audit?.(transaction, id, created);
  return transaction.selectFrom('demands').selectAll().where('id', '=', id).where('module_id', '=', options.moduleId).executeTakeFirstOrThrow();
};
