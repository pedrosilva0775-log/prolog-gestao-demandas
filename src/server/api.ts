import crypto from "node:crypto";
import path from "node:path";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Selectable, sql, type Kysely, type Transaction } from "kysely";
import { getDatabase, type Database } from "./database.js";
import { handleApiError, sendApiError } from "./apiErrors.js";
import { createModulesRouter } from "./modules/router.js";
import { createExternalRequestsRouter } from "./externalRequests/router.js";
import { createDemandTransactionally } from "./demands/create.js";
import {
  validateDemandReferences,
  validateDemandDependencyGraph,
  rejectCompletedStatusForGenericWrite,
  validateDemandTransition,
} from "./demands/workflow.js";
import { createDefaultChecklist } from "../data/defaultChecklist.js";
import {
  effectivePermissions,
  isAuthorized,
  type AuthorizationInput,
  type ModuleRole,
} from "./authorization/policy.js";
import {
  addCommentInputSchema,
  auditListResponseSchema,
  auditQuerySchema,
  blockerInputSchema,
  blockerResponseSchema,
  bootstrapResponseSchema,
  clientCreateSchema,
  clientDtoSchema,
  clientUpdateSchema,
  commentDtoSchema,
  commentMutationResponseSchema,
  completeDemandInputSchema,
  completeDemandResponseSchema,
  configurationKeySchema,
  configurationUpdateSchemas,
  demandBlockerSchema,
  demandCommentSchema,
  demandCreateSchema,
  demandDeleteQuerySchema,
  demandDtoSchema,
  demandListQuerySchema,
  demandListResponseSchema,
  demandMetricsQuerySchema,
  demandMetricsSchema,
  demandUpdateSchema,
  editCommentInputSchema,
  privacyExportSchema,
  privacyRequestCreateSchema,
  privacyRequestDtoSchema,
  privacyRequestListSchema,
  privacyRequestUpdateSchema,
  publicUserDtoSchema,
  reportPresetCreateSchema,
  reportDemandListResponseSchema,
  reportDemandQuerySchema,
  reportPresetDtoSchema,
  reportPresetListSchema,
  retentionEntitySchema,
  retentionPolicyInputSchema,
  retentionPolicyListSchema,
  sessionListResponseSchema,
  statusConfigDtoSchema,
  teamCreateSchema,
  teamDtoSchema,
  teamUpdateSchema,
  userUpdateSchema,
} from "../contracts/index.js";

type Session = { id: string; role?: string; sid?: string };
type SessionReader = (request: Request) => Session | null;
type AuthorizationOverride = { permission: string; effect: "allow" | "deny" };
type AuthorizationOverrideReader = (userId: string) => Promise<AuthorizationOverride[]>;
export const hasRolePermission = (role: string, permission: string) =>
  isAuthorized({
    permission,
    scope: "global",
    globalRole: role,
    grants: [],
    revocations: [],
  });

const dateOnly = (value: unknown) =>
  value instanceof Date
    ? value.toISOString().slice(0, 10)
    : String(value).slice(0, 10);
type DemandRow = Selectable<Database["demands"]>;
type ClientRow = Selectable<Database["clients"]>;
type TeamRow = Selectable<Database["teams"]>;
type UserRow = Selectable<Database["users"]>;
const demandJson = (row: DemandRow) => ({
  ...(typeof row.payload === "object" && row.payload !== null
    ? row.payload
    : {}),
  id: row.id,
  moduleId: row.module_id,
  code: row.code,
  title: row.title,
  description: row.description,
  statusId: row.status_id,
  priorityId: row.priority_id,
  categoryId: row.category_id,
  requesterId: row.requester_id,
  assigneeId: row.assignee_id || "",
  teamId: row.team_id || "",
  clientId: row.client_id,
  dueDate: row.due_date ? dateOnly(row.due_date) : null,
  version: row.version,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});
const clientJson = (row: ClientRow) => ({
  id: row.id,
  name: row.name,
  company: row.company,
  email: row.email,
  phone: row.phone,
  active: row.active,
  legal_basis: row.legal_basis,
  retention_until: row.retention_until?.toISOString() || null,
  version: row.version,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
});
const teamJson = (row: TeamRow, memberIds: string[]) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  department: row.department,
  leaderId: row.leader_id || "",
  color: row.color,
  active: row.active,
  memberIds,
  version: row.version,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});
const userJson = (
  row: UserRow,
  teamIds: string[],
  customPermissions?: { granted: string[]; revoked: string[] },
) => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role,
  roleTitle: row.role_title,
  department: row.department,
  branch: row.branch || undefined,
  phone: row.phone || undefined,
  avatar: row.avatar || "",
  active: row.active,
  mfaEnabled: row.mfa_enabled,
  approvalStatus: "approved",
  teamIds,
  ...(customPermissions ? { customPermissions } : {}),
});
const demandPayload = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? { ...value }
    : {};

const validatedJson = <T>(
  res: Response,
  schema: z.ZodType<T>,
  value: unknown,
  status = 200,
) => {
  const parsed = schema.safeParse(value);
  if (!parsed.success)
    throw Object.assign(
      new Error("A resposta da API não corresponde ao contrato."),
      { name: "ApiResponseValidationError" },
    );
  return res.status(status).json(parsed.data);
};

const persistCommentAttachments = async (
  attachments: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    [key: string]: unknown;
  }>,
  owner: { demandId: string; commentId: string; userId: string },
) => {
  const uploadDir = path.resolve(process.env.UPLOAD_DIR || "uploads");
  await mkdir(uploadDir, { recursive: true });
  const extensions: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const created: string[] = [];
  const cleanCreatedFile = async (filename: string) => {
    await getDatabase().deleteFrom("attachment_files").where("storage_key", "=", filename).execute().catch(() => undefined);
    try {
      await rm(path.join(uploadDir, filename), { force: true });
    } catch {
      await getDatabase().insertInto("attachment_backfill_issues").values({ storage_key: filename, reason: "CLEANUP_REQUIRED", reference_count: 1, detected_at: new Date() }).onConflict((conflict) => conflict.column("storage_key").doUpdateSet({ reason: "CLEANUP_REQUIRED", reference_count: 1, detected_at: new Date() })).execute().catch(() => undefined);
    }
  };
  try { return await Promise.all(
    attachments.map(async (attachment) => {
      if (!attachment.url.startsWith("data:")) {
        if (/^https:\/\//i.test(attachment.url)) return attachment;
        throw Object.assign(new Error("Referência de anexo local inválida."), { status: 400 });
      }
      const match = attachment.url.match(
        /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/,
      );
      if (!match || match[1] !== attachment.type)
        throw Object.assign(
          new Error("Imagem inválida ou formato não permitido."),
          { status: 400 },
        );
      const bytes = Buffer.from(match[2], "base64");
      if (bytes.length > 2 * 1024 * 1024)
        throw Object.assign(
          new Error("Cada imagem deve possuir no máximo 2 MB."),
          { status: 400 },
        );
      const signatures: Record<string, (value: Buffer) => boolean> = {
        "image/png": value => value.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
        "image/jpeg": value => value[0] === 0xff && value[1] === 0xd8 && value.at(-2) === 0xff && value.at(-1) === 0xd9,
        "image/gif": value => ["GIF87a", "GIF89a"].includes(value.subarray(0, 6).toString("ascii")),
        "image/webp": value => value.subarray(0, 4).toString("ascii") === "RIFF" && value.subarray(8, 12).toString("ascii") === "WEBP",
      };
      if (!signatures[attachment.type]?.(bytes)) throw Object.assign(new Error("O conteúdo da imagem não corresponde ao formato informado."), { status: 400 });
      const filename = `${crypto.randomUUID()}.${extensions[attachment.type]}`;
      await writeFile(path.join(uploadDir, filename), bytes, {
        flag: "wx",
        mode: 0o640,
      });
      created.push(filename);
      try {
        await getDatabase().insertInto("attachment_files").values({ id: `attf-${crypto.randomUUID()}`, demand_id: owner.demandId, comment_id: owner.commentId, storage_key: filename, original_name: attachment.name, mime_type: attachment.type, size_bytes: bytes.length, uploaded_by: owner.userId, created_at: new Date() }).execute();
      } catch (error) {
        await cleanCreatedFile(filename);
        throw error;
      }
      return { ...attachment, size: bytes.length, url: `/uploads/${filename}` };
    }),
  ); } catch (error) {
    await Promise.all(created.map(cleanCreatedFile));
    throw error;
  }
};

export const createApiRouter = (
  readSession: SessionReader,
  readAuthorizationOverrides: AuthorizationOverrideReader = (userId) =>
    getDatabase().selectFrom("user_permissions").select(["permission", "effect"]).where("user_id", "=", userId).execute(),
  options:{externalRequestsEnabled?:boolean}={},
) => {
  const router = Router();
  const authenticated = (req: Request, res: Response, next: NextFunction) => {
    const session =
      (res.locals.session as Session | undefined) || readSession(req);
    if (!session)
      return sendApiError(
        res,
        401,
        "AUTHENTICATION_REQUIRED",
        "Sessão inválida.",
      );
    res.locals.session = session;
    next();
  };
  const authorizationInput = async (
    res: Response,
  ): Promise<Omit<AuthorizationInput, "permission">> => {
    const session = res.locals.session as Session;
    const overrides = await readAuthorizationOverrides(session.id);
    return {
      scope: res.locals.moduleId ? "module" : "global",
      globalRole: session.role || "colaborador",
      moduleRole: res.locals.moduleRole as ModuleRole | undefined,
      moduleActive: Boolean(res.locals.moduleId),
      membershipActive: Boolean(res.locals.moduleRole),
      grants: overrides
        .filter((item) => item.effect === "allow")
        .map((item) => item.permission),
      revocations: overrides
        .filter((item) => item.effect === "deny")
        .map((item) => item.permission),
    };
  };
  const can = async (res: Response, permission: string) =>
    isAuthorized({ ...(await authorizationInput(res)), permission });
  const authorize =
    (permission: string) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!(await can(res, permission)))
          return sendApiError(res, 403, "FORBIDDEN", "Permissão insuficiente.");
        next();
      } catch (error) {
        handleApiError(
          Object.assign(new Error("Não foi possível validar a autorização."), {
            status: 503,
            cause: error,
          }),
          req,
          res,
        );
      }
    };
  const authorizeAny =
    (permissions: string[]) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const input = await authorizationInput(res);
        if (!permissions.some(permission => isAuthorized({ ...input, permission })))
          return sendApiError(res, 403, "FORBIDDEN", "PermissÃ£o insuficiente.");
        next();
      } catch (error) {
        handleApiError(
          Object.assign(new Error("NÃ£o foi possÃ­vel validar a autorizaÃ§Ã£o."), {
            status: 503,
            cause: error,
          }),
          req,
          res,
        );
      }
    };
  const moduleId = (res: Response) =>
    String(res.locals.moduleId || "mod-default");
  const audit = async (
    req: Request,
    action: string,
    entityType: string,
    entityId: string | null,
    before: unknown,
    after: unknown,
    executor: Kysely<Database>|Transaction<Database> = getDatabase(),
  ) => {
    const session = req.res?.locals.session as Session;
    await executor
      .insertInto("audit_logs")
      .values({
        id: crypto.randomUUID(),
        module_id: moduleId(req.res!),
        actor_id: session.id,
        session_id: session.sid || null,
        ip_address: req.ip || null,
        action,
        entity_type: entityType,
        entity_id: entityId,
        before_data: before ?? null,
        after_data: after ?? null,
        created_at: new Date(),
      })
      .execute();
  };
  const safe =
    (handler: (req: Request, res: Response) => Promise<unknown>) =>
    async (req: Request, res: Response) => {
      try {
        await handler(req, res);
      } catch (error) {
        return handleApiError(error, req, res);
      }
    };

  router.use(authenticated);
  router.use(createModulesRouter());
  router.use(async (req, res, next) => {
    try {
      const scoped = req.url.match(
        /^\/modules\/([^/]+)(\/(?:bootstrap|demands|demand-metrics|report-demands|configurations|external-request-links|external-requests)(?:\/.*)?)(\?.*)?$/,
      );
      const legacy = req.url.match(
        /^\/(?:bootstrap|demands|demand-metrics|report-demands|configurations)(?:\/|\?|$)/,
      );
      if (!scoped && !legacy) return next();
      const selectedModuleId = scoped
        ? decodeURIComponent(scoped[1])
        : "mod-default";
      const db = getDatabase();
      const module = await db
        .selectFrom("operational_modules")
        .select(["id", "active", "deleted_at"])
        .where("id", "=", selectedModuleId)
        .executeTakeFirst();
      if (!module?.active || module.deleted_at)
        throw Object.assign(new Error("Módulo não encontrado."), {
          status: 404,
        });
      const session = res.locals.session as Session;
      const membership = await db
        .selectFrom("module_members")
        .select(["role", "active"])
        .where("module_id", "=", selectedModuleId)
        .where("user_id", "=", session.id)
        .executeTakeFirst();
      if (!membership?.active && session.role !== "admin")
        throw Object.assign(new Error("Módulo não encontrado."), {
          status: 404,
        });
      res.locals.moduleId = selectedModuleId;
      res.locals.moduleRole = membership?.role ?? "module_admin";
      if (scoped) req.url = `${scoped[2]}${scoped[3] ?? ""}`;
      next();
    } catch (error) {
      handleApiError(error, req, res);
    }
  });
  if(options.externalRequestsEnabled)router.use(createExternalRequestsRouter(can));
  else router.use((req,res,next)=>req.path.startsWith('/external-request')?sendApiError(res,404,'NOT_FOUND','Recurso não encontrado.'):next());
  router.use(async (req, res, next) => {
    try {
      const scoped = req.url.match(
        /^\/modules\/([^/]+)(\/(?:audit-logs|report-presets)(?:\/.*)?)(\?.*)?$/,
      );
      if (!scoped) return next();
      const selectedModuleId = decodeURIComponent(scoped[1]);
      const db = getDatabase();
      const module = await db
        .selectFrom("operational_modules")
        .select(["active", "deleted_at"])
        .where("id", "=", selectedModuleId)
        .executeTakeFirst();
      if (!module?.active || module.deleted_at)
        throw Object.assign(new Error("Módulo não encontrado."), {
          status: 404,
        });
      const session = res.locals.session as Session;
      const membership = await db
        .selectFrom("module_members")
        .select(["role", "active"])
        .where("module_id", "=", selectedModuleId)
        .where("user_id", "=", session.id)
        .executeTakeFirst();
      if (!membership?.active && session.role !== "admin")
        throw Object.assign(new Error("Módulo não encontrado."), {
          status: 404,
        });
      res.locals.moduleId = selectedModuleId;
      res.locals.moduleRole = membership?.role ?? "module_admin";
      req.url = `${scoped[2]}${scoped[3] ?? ""}`;
      next();
    } catch (error) {
      handleApiError(error, req, res);
    }
  });
  router.get(
    "/bootstrap",
    safe(async (_req, res) => {
      const db = getDatabase();
      const mayReadAudit = await can(res, "audit:read");
      const selectedModuleId = moduleId(res);
      const [
        users,
        teams,
        members,
        permissions,
        clients,
        demands,
        configurations,
        audits,
      ] = await Promise.all([
        db
          .selectFrom("users")
          .innerJoin("module_members", "module_members.user_id", "users.id")
          .selectAll("users")
          .where("module_members.module_id", "=", selectedModuleId)
          .where("module_members.active", "=", true)
          .where("users.deleted_at", "is", null)
          .execute(),
        db
          .selectFrom("teams")
          .innerJoin("team_modules", "team_modules.team_id", "teams.id")
          .selectAll("teams")
          .where("team_modules.module_id", "=", selectedModuleId)
          .where("teams.deleted_at", "is", null)
          .execute(),
        db
          .selectFrom("team_members")
          .innerJoin(
            "team_modules",
            "team_modules.team_id",
            "team_members.team_id",
          )
          .selectAll("team_members")
          .where("team_modules.module_id", "=", selectedModuleId)
          .execute(),
        db
          .selectFrom("user_permissions")
          .innerJoin(
            "module_members",
            "module_members.user_id",
            "user_permissions.user_id",
          )
          .select([
            "user_permissions.user_id",
            "user_permissions.permission",
            "user_permissions.effect",
          ])
          .where("module_members.module_id", "=", selectedModuleId)
          .where("module_members.active", "=", true)
          .execute(),
        db
          .selectFrom("clients")
          .selectAll()
          .where("deleted_at", "is", null)
          .execute(),
        db
          .selectFrom("demands")
          .selectAll()
          .where("module_id", "=", selectedModuleId)
          .where("deleted_at", "is", null)
          .execute(),
        db
          .selectFrom("module_configurations")
          .select(["key", "value"])
          .where("module_id", "=", selectedModuleId)
          .execute(),
        mayReadAudit
          ? db
              .selectFrom("audit_logs")
              .selectAll()
              .where("module_id", "=", selectedModuleId)
              .orderBy("created_at", "desc")
              .limit(200)
              .execute()
          : Promise.resolve([]),
      ]);
      validatedJson(res, bootstrapResponseSchema, {
        currentUserId: (res.locals.session as Session).id,
        effectivePermissions: effectivePermissions(
          await authorizationInput(res),
        ),
        users: users.map((user) => {
          const own = permissions.filter((item) => item.user_id === user.id);
          return userJson(
            user,
            members.filter((m) => m.user_id === user.id).map((m) => m.team_id),
            {
              granted: own
                .filter((item) => item.effect === "allow")
                .map((item) => item.permission),
              revoked: own
                .filter((item) => item.effect === "deny")
                .map((item) => item.permission),
            },
          );
        }),
        teams: teams.map((team) =>
          teamJson(
            team,
            members.filter((m) => m.team_id === team.id).map((m) => m.user_id),
          ),
        ),
        clients: clients.map(clientJson),
        demands: demands.map(demandJson),
        auditLogs: audits.map((item) => ({
          id: item.id,
          action: item.action,
          userId: item.actor_id || "",
          userName: "",
          timestamp: item.created_at.toISOString(),
          details: `${item.entity_type}${item.entity_id ? ` ${item.entity_id}` : ""}`,
          demandId:
            item.entity_type === "demand"
              ? item.entity_id || undefined
              : undefined,
        })),
        configurations: Object.fromEntries(
          configurations.map((item) => [item.key, item.value]),
        ),
      });
    }),
  );

  const clientSchema = {
    parse: (value: unknown) => clientCreateSchema.parse(value),
    partial: () => clientUpdateSchema,
  };
  router.get(
    "/clients",
    authorize("clients:read"),
    safe(async (_req, res) =>
      validatedJson(
        res,
        z.array(clientDtoSchema),
        (
          await getDatabase()
            .selectFrom("clients")
            .selectAll()
            .where("deleted_at", "is", null)
            .orderBy("company")
            .execute()
        ).map(clientJson),
      ),
    ),
  );
  router.post(
    "/clients",
    authorize("clients:create"),
    safe(async (req, res) => {
      const input = clientSchema.parse(req.body);
      const now = new Date();
      const defaultRetention = new Date(now);
      defaultRetention.setUTCFullYear(defaultRetention.getUTCFullYear() + 5);
      const record = {
        id: `cli-${crypto.randomUUID()}`,
        name: input.name,
        company: input.company,
        email: input.email,
        phone: input.phone,
        active: input.active,
        deleted_at: null,
        version: 1,
        legal_basis:
          input.legalBasis ||
          "Execução de contrato ou procedimentos preliminares",
        retention_until: input.retentionUntil
          ? new Date(`${input.retentionUntil}T23:59:59.999Z`)
          : defaultRetention,
        created_at: now,
        updated_at: now,
      };
      await getDatabase().insertInto("clients").values(record).execute();
      await audit(req, "CREATE", "client", record.id, null, {
        id: record.id,
        retentionPolicy: "default-5-years",
      });
      validatedJson(res, clientDtoSchema, clientJson(record), 201);
    }),
  );
  router.patch(
    "/clients/:id",
    authorize("clients:update"),
    safe(async (req, res) => {
      const input = clientSchema.partial().parse(req.body);
      const db = getDatabase();
      const before = await db
        .selectFrom("clients")
        .selectAll()
        .where("id", "=", req.params.id)
        .where("deleted_at", "is", null)
        .executeTakeFirst();
      if (!before)
        throw Object.assign(new Error("Cliente não encontrado."), {
          status: 404,
        });
      await db
        .updateTable("clients")
        .set({
          name: input.name ?? before.name,
          company: input.company ?? before.company,
          email: input.email ?? before.email,
          phone: input.phone ?? before.phone,
          active: input.active ?? before.active,
          legal_basis: input.legalBasis ?? before.legal_basis,
          retention_until: input.retentionUntil
            ? new Date(`${input.retentionUntil}T23:59:59.999Z`)
            : before.retention_until,
          version: before.version + 1,
          updated_at: new Date(),
        })
        .where("id", "=", req.params.id)
        .execute();
      await audit(
        req,
        "UPDATE",
        "client",
        req.params.id,
        { id: before.id, version: before.version },
        { fields: Object.keys(input), version: before.version + 1 },
      );
      const persisted = await db
        .selectFrom("clients")
        .selectAll()
        .where("id", "=", req.params.id)
        .executeTakeFirstOrThrow();
      validatedJson(res, clientDtoSchema, clientJson(persisted));
    }),
  );
  router.delete(
    "/clients/:id",
    authorize("clients:update"),
    safe(async (req, res) => {
      const db = getDatabase();
      const before = await db
        .selectFrom("clients")
        .selectAll()
        .where("id", "=", req.params.id)
        .where("deleted_at", "is", null)
        .executeTakeFirst();
      if (!before)
        throw Object.assign(new Error("Cliente não encontrado."), {
          status: 404,
        });
      const now = new Date();
      await db
        .updateTable("clients")
        .set({
          active: false,
          deleted_at: now,
          version: before.version + 1,
          updated_at: now,
        })
        .where("id", "=", req.params.id)
        .execute();
      await audit(
        req,
        "DELETE",
        "client",
        req.params.id,
        { id: before.id, active: before.active },
        { deletedAt: now },
      );
      res.status(204).end();
    }),
  );

  const teamSchema = {
    parse: (value: unknown) => teamCreateSchema.parse(value),
    partial: () => teamUpdateSchema,
  };
  router.get(
    "/teams",
    authorize("teams:read"),
    safe(async (_req, res) => {
      const db = getDatabase();
      const [teams, members] = await Promise.all([
        db
          .selectFrom("teams")
          .selectAll()
          .where("deleted_at", "is", null)
          .orderBy("name")
          .execute(),
        db.selectFrom("team_members").selectAll().execute(),
      ]);
      validatedJson(
        res,
        z.array(teamDtoSchema),
        teams.map((team) =>
          teamJson(
            team,
            members
              .filter((member) => member.team_id === team.id)
              .map((member) => member.user_id),
          ),
        ),
      );
    }),
  );
  router.post(
    "/teams",
    authorize("teams:create"),
    safe(async (req, res) => {
      const input = teamSchema.parse(req.body);
      const db = getDatabase();
      const userIds = [
        ...new Set([
          ...input.memberIds,
          ...(input.leaderId ? [input.leaderId] : []),
        ]),
      ];
      if (userIds.length) {
        const valid = await db
          .selectFrom("users")
          .select("id")
          .where("id", "in", userIds)
          .where("active", "=", true)
          .where("deleted_at", "is", null)
          .execute();
        if (valid.length !== userIds.length)
          throw Object.assign(
            new Error(
              "Um ou mais membros selecionados não existem ou estão inativos.",
            ),
            {
              status: 422,
              code: "VALIDATION_ERROR",
              fieldErrors: {
                memberIds: ["Um ou mais usuários são inválidos ou inativos."],
              },
            },
          );
      }
      const id = `team-${crypto.randomUUID()}`;
      const now = new Date();
      const memberIds = [...new Set(input.memberIds)];
      await db.transaction().execute(async (trx) => {
        await trx
          .insertInto("teams")
          .values({
            id,
            name: input.name,
            description: input.description,
            department: input.department,
            leader_id: input.leaderId || null,
            color: input.color,
            active: input.active,
            deleted_at: null,
            version: 1,
            created_at: now,
            updated_at: now,
          })
          .execute();
        await trx
          .insertInto("team_modules")
          .values({
            team_id: id,
            module_id: moduleId(res),
            created_by: (res.locals.session as Session).id,
            created_at: now,
          })
          .execute();
        if (memberIds.length)
          await trx
            .insertInto("team_members")
            .values(
              memberIds.map((user_id) => ({
                team_id: id,
                user_id,
                created_at: now,
              })),
            )
            .execute();
      });
      await audit(req, "CREATE", "team", id, null, { ...input, memberIds });
      const [persisted, persistedMembers] = await Promise.all([
        db
          .selectFrom("teams")
          .selectAll()
          .where("id", "=", id)
          .executeTakeFirstOrThrow(),
        db
          .selectFrom("team_members")
          .select("user_id")
          .where("team_id", "=", id)
          .orderBy("user_id")
          .execute(),
      ]);
      validatedJson(
        res,
        teamDtoSchema,
        teamJson(
          persisted,
          persistedMembers.map((member) => member.user_id),
        ),
        201,
      );
    }),
  );
  router.patch(
    "/teams/:id",
    authorize("teams:update"),
    safe(async (req, res) => {
      const input = teamSchema.partial().parse(req.body);
      const db = getDatabase();
      const before = await db
        .selectFrom("teams")
        .selectAll()
        .where("id", "=", req.params.id)
        .where("deleted_at", "is", null)
        .executeTakeFirst();
      if (!before)
        throw Object.assign(new Error("Equipe não encontrada."), {
          status: 404,
        });
      const replacementMemberIds =
        input.memberIds === undefined
          ? undefined
          : [...new Set(input.memberIds)];
      const referencedUsers = [
        ...new Set([
          ...(replacementMemberIds ?? []),
          ...(input.leaderId ? [input.leaderId] : []),
        ]),
      ];
      if (referencedUsers.length) {
        const valid = await db
          .selectFrom("users")
          .select("id")
          .where("id", "in", referencedUsers)
          .where("active", "=", true)
          .where("deleted_at", "is", null)
          .execute();
        if (valid.length !== referencedUsers.length)
          throw Object.assign(
            new Error(
              "Um ou mais membros selecionados não existem ou estão inativos.",
            ),
            {
              status: 422,
              code: "VALIDATION_ERROR",
              fieldErrors: {
                memberIds: ["Um ou mais usuários são inválidos ou inativos."],
              },
            },
          );
      }
      const updatedAt = new Date();
      await db.transaction().execute(async (trx) => {
        await trx
          .updateTable("teams")
          .set({
            name: input.name ?? before.name,
            description: input.description ?? before.description,
            department: input.department ?? before.department,
            leader_id:
              input.leaderId === undefined ? before.leader_id : input.leaderId,
            color: input.color ?? before.color,
            active: input.active ?? before.active,
            version: before.version + 1,
            updated_at: updatedAt,
          })
          .where("id", "=", req.params.id)
          .execute();
        if (replacementMemberIds !== undefined) {
          await trx
            .deleteFrom("team_members")
            .where("team_id", "=", req.params.id)
            .execute();
          if (replacementMemberIds.length)
            await trx
              .insertInto("team_members")
              .values(
                replacementMemberIds.map((user_id) => ({
                  team_id: req.params.id,
                  user_id,
                  created_at: updatedAt,
                })),
              )
              .execute();
        }
      });
      await audit(
        req,
        "UPDATE",
        "team",
        req.params.id,
        { id: before.id, version: before.version },
        { fields: Object.keys(input), version: before.version + 1 },
      );
      const [persisted, persistedMembers] = await Promise.all([
        db
          .selectFrom("teams")
          .selectAll()
          .where("id", "=", req.params.id)
          .executeTakeFirstOrThrow(),
        db
          .selectFrom("team_members")
          .select("user_id")
          .where("team_id", "=", req.params.id)
          .orderBy("user_id")
          .execute(),
      ]);
      validatedJson(
        res,
        teamDtoSchema,
        teamJson(
          persisted,
          persistedMembers.map((member) => member.user_id),
        ),
      );
    }),
  );
  router.delete(
    "/teams/:id",
    authorize("teams:update"),
    safe(async (req, res) => {
      const db = getDatabase();
      const before = await db
        .selectFrom("teams")
        .selectAll()
        .where("id", "=", req.params.id)
        .where("deleted_at", "is", null)
        .executeTakeFirst();
      if (!before)
        throw Object.assign(new Error("Equipe não encontrada."), {
          status: 404,
        });
      const now = new Date();
      await db
        .updateTable("teams")
        .set({
          active: false,
          deleted_at: now,
          version: before.version + 1,
          updated_at: now,
        })
        .where("id", "=", req.params.id)
        .execute();
      await audit(
        req,
        "DELETE",
        "team",
        req.params.id,
        { id: before.id, active: before.active },
        { deletedAt: now },
      );
      res.status(204).end();
    }),
  );

  const demandSchema = {
    parse: (value: unknown) => demandCreateSchema.parse(value),
    partial: () => demandUpdateSchema,
  };
  router.get(
    "/demands",
    authorize("demands:read"),
    safe(async (req, res) => {
      const input = demandListQuerySchema.parse(req.query);
      const db = getDatabase();
      let filtered = db
        .selectFrom("demands")
        .where("module_id", "=", moduleId(res))
        .where("deleted_at", "is", null);
      if (input.q)
        filtered = filtered.where((eb) =>
          eb.or([
            eb("title", "ilike", `%${input.q}%`),
            eb("description", "ilike", `%${input.q}%`),
            eb("code", "ilike", `%${input.q}%`),
          ]),
        );
      if (input.statusId)
        filtered = filtered.where("status_id", "=", input.statusId);
      if (input.statusIds?.length)
        filtered = filtered.where("status_id", "in", input.statusIds);
      if (input.priorityId)
        filtered = filtered.where("priority_id", "=", input.priorityId);
      if (input.priorityIds?.length)
        filtered = filtered.where("priority_id", "in", input.priorityIds);
      if (input.categoryId)
        filtered = filtered.where("category_id", "=", input.categoryId);
      if (input.categoryIds?.length)
        filtered = filtered.where("category_id", "in", input.categoryIds);
      if (input.assigneeId)
        filtered = filtered.where("assignee_id", "=", input.assigneeId);
      if (input.assigneeIds?.length)
        filtered = filtered.where("assignee_id", "in", input.assigneeIds);
      if (input.teamId) filtered = filtered.where("team_id", "=", input.teamId);
      if (input.teamIds?.length)
        filtered = filtered.where("team_id", "in", input.teamIds);
      if (input.clientId)
        filtered = filtered.where("client_id", "=", input.clientId);
      if (input.clientIds?.length) {
        const includesInternal=input.clientIds.includes('__internal__');
        const clientIds=input.clientIds.filter(id=>id!=='__internal__');
        filtered=filtered.where(eb=>includesInternal?clientIds.length?eb.or([eb('client_id','is',null),eb('client_id','in',clientIds)]):eb('client_id','is',null):eb('client_id','in',clientIds));
      }
      const sortColumns = {
        updatedAt: "updated_at",
        createdAt: "created_at",
        dueDate: "due_date",
        title: "title",
        code: "code",
      } as const;
      const [{ count }, rows] = await Promise.all([
        filtered
          .select(({ fn }) => fn.countAll<number>().as("count"))
          .executeTakeFirstOrThrow(),
        filtered
          .selectAll()
          .orderBy(sortColumns[input.sort], input.direction)
          .orderBy("id", input.direction)
          .limit(input.pageSize)
          .offset((input.page - 1) * input.pageSize)
          .execute(),
      ]);
      const total = Number(count);
      validatedJson(res, demandListResponseSchema, {
        items: rows.map(demandJson),
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total,
          totalPages: total === 0 ? 0 : Math.ceil(total / input.pageSize),
        },
      });
    }),
  );
  router.get(
    "/demand-metrics",
    authorize("demands:read"),
    safe(async(req,res)=>{
      const input=demandMetricsQuerySchema.parse(req.query);const db=getDatabase();
      let filtered=db.selectFrom("demands").where("module_id","=",moduleId(res)).where("deleted_at","is",null);
      if(input.q)filtered=filtered.where(eb=>eb.or([eb("title","ilike",`%${input.q}%`),eb("description","ilike",`%${input.q}%`),eb("code","ilike",`%${input.q}%`)]));
      if(input.statusId)filtered=filtered.where("status_id","=",input.statusId);if(input.statusIds?.length)filtered=filtered.where("status_id","in",input.statusIds);if(input.priorityId)filtered=filtered.where("priority_id","=",input.priorityId);if(input.priorityIds?.length)filtered=filtered.where("priority_id","in",input.priorityIds);if(input.categoryId)filtered=filtered.where("category_id","=",input.categoryId);if(input.categoryIds?.length)filtered=filtered.where("category_id","in",input.categoryIds);if(input.assigneeId)filtered=filtered.where("assignee_id","=",input.assigneeId);if(input.assigneeIds?.length)filtered=filtered.where("assignee_id","in",input.assigneeIds);if(input.teamId)filtered=filtered.where("team_id","=",input.teamId);if(input.teamIds?.length)filtered=filtered.where("team_id","in",input.teamIds);if(input.clientId)filtered=filtered.where("client_id","=",input.clientId);if(input.clientIds?.length){const includesInternal=input.clientIds.includes('__internal__');const clientIds=input.clientIds.filter(value=>value!=='__internal__');filtered=filtered.where(eb=>includesInternal?clientIds.length?eb.or([eb('client_id','is',null),eb('client_id','in',clientIds)]):eb('client_id','is',null):eb('client_id','in',clientIds));}
      const config=await db.selectFrom("module_configurations").select("value").where("module_id","=",moduleId(res)).where("key","=","statuses").executeTakeFirst();const statuses=statusConfigDtoSchema.array().parse(config?.value);const ids=(category:string)=>statuses.filter(item=>item.active&&item.category===category).map(item=>item.id);const completedIds=ids('completed'),progressIds=ids('in_progress'),blockedIds=ids('blocked'),closedIds=statuses.filter(item=>item.active&&(item.category==='completed'||item.category==='cancelled')).map(item=>item.id);const inIds=(values:string[])=>values.length?sql<boolean>`status_id in (${sql.join(values.map(value=>sql`${value}`))})`:sql<boolean>`false`;const blockedExpression=sql<boolean>`(${inIds(blockedIds)} or coalesce(payload->'blocker'->>'isBlocked','false')='true')`;
      const [summary,byStatus,byPriority,byCategory,byTeam]=await Promise.all([filtered.select(({fn})=>[fn.countAll<number>().as('total'),sql<number>`count(*) filter (where ${inIds(completedIds)})`.as('completed'),sql<number>`count(*) filter (where ${inIds(progressIds)})`.as('in_progress'),sql<number>`count(*) filter (where ${blockedExpression})`.as('blocked'),sql<number>`count(*) filter (where due_date < current_date and not ${inIds(closedIds)})`.as('overdue'),sql<number>`count(*) filter (where ${inIds(completedIds)} and (due_date is null or completed_at is null or completed_at < due_date + interval '1 day'))`.as('on_time'),sql<number>`coalesce(avg(extract(epoch from (completed_at-created_at))/86400) filter (where ${inIds(completedIds)} and completed_at is not null),0)`.as('average_days')]).executeTakeFirstOrThrow(),filtered.select(eb=>['status_id as id',eb.fn.countAll<number>().as('count')]).groupBy('status_id').execute(),filtered.select(eb=>['priority_id as id',eb.fn.countAll<number>().as('count')]).groupBy('priority_id').execute(),filtered.select(eb=>['category_id as id',eb.fn.countAll<number>().as('count')]).groupBy('category_id').execute(),filtered.select(eb=>['team_id as id',eb.fn.countAll<number>().as('count'),sql<number>`count(*) filter (where ${blockedExpression})`.as('blocked')]).groupBy('team_id').execute()]);
      const total=Number(summary.total),completed=Number(summary.completed),onTimeCompleted=Number(summary.on_time);validatedJson(res,demandMetricsSchema,{total,completed,inProgress:Number(summary.in_progress),blocked:Number(summary.blocked),overdue:Number(summary.overdue),onTimeCompleted,onTimeRate:completed?Math.round(onTimeCompleted/completed*100):100,averageCompletionDays:Math.round(Number(summary.average_days)*10)/10,byStatus:byStatus.map(item=>({id:item.id,count:Number(item.count)})),byPriority:byPriority.map(item=>({id:item.id,count:Number(item.count)})),byCategory:byCategory.map(item=>({id:item.id,count:Number(item.count)})),byTeam:byTeam.map(item=>({id:item.id,count:Number(item.count),blocked:Number(item.blocked)}))});
    }),
  );
  router.get(
    "/report-demands",
    authorizeAny(["reports:read", "demands:export"]),
    safe(async (req, res) => {
      const input = reportDemandQuerySchema.parse(req.query);
      const db = getDatabase();
      let filtered = db.selectFrom("demands")
        .where("module_id", "=", moduleId(res))
        .where("deleted_at", "is", null);
      if (input.statusIds?.length) filtered = filtered.where("status_id", "in", input.statusIds);
      if (input.categoryIds?.length) filtered = filtered.where("category_id", "in", input.categoryIds);
      if (input.priorityIds?.length) filtered = filtered.where("priority_id", "in", input.priorityIds);
      if (input.userIds?.length) filtered = filtered.where(eb => eb.or([eb("assignee_id", "in", input.userIds!), eb("requester_id", "in", input.userIds!)]));
      if (input.teamIds?.length) filtered = filtered.where("team_id", "in", input.teamIds);
      if (input.clientIds?.length) {
        const includesInternal = input.clientIds.includes("__internal__");
        const clientIds = input.clientIds.filter(id => id !== "__internal__");
        filtered = filtered.where(eb => includesInternal
          ? clientIds.length ? eb.or([eb("client_id", "is", null), eb("client_id", "in", clientIds)]) : eb("client_id", "is", null)
          : eb("client_id", "in", clientIds));
      }
      if (input.startDate && input.endDate) {
        const start = new Date(input.startDate);
        const end = new Date(input.endDate);
        filtered = filtered.where(eb => eb.or([
          eb.and([eb("created_at", ">=", start), eb("created_at", "<", end)]),
          eb.and([eb("due_date", ">=", start), eb("due_date", "<", end)]),
          eb.and([eb("completed_at", ">=", start), eb("completed_at", "<", end)]),
        ]));
      }
      const [{ count }, rows] = await Promise.all([
        filtered.select(({ fn }) => fn.countAll<number>().as("count")).executeTakeFirstOrThrow(),
        filtered.selectAll().orderBy("created_at", "desc").orderBy("id", "desc")
          .limit(input.pageSize).offset((input.page - 1) * input.pageSize).execute(),
      ]);
      const total = Number(count);
      validatedJson(res, reportDemandListResponseSchema, {
        items: rows.map(demandJson),
        pagination: { page: input.page, pageSize: input.pageSize, total, totalPages: total ? Math.ceil(total / input.pageSize) : 0 },
      });
    }),
  );
  router.post(
    "/demands/:id/comments",
    authorize("comments:create"),
    safe(async (req, res) => {
      const input = addCommentInputSchema.parse(req.body);
      const session = res.locals.session as Session;
      if (
        input.attachments.length &&
        !(await can(res, "comments:admin"))
      )
        throw Object.assign(new Error("Sem permissão para anexar imagens."), {
          status: 403,
        });
      const db = getDatabase();
      const before = await db
        .selectFrom("demands")
        .selectAll()
        .where("id", "=", req.params.id)
        .where("module_id", "=", moduleId(res))
        .where("deleted_at", "is", null)
        .executeTakeFirst();
      if (!before)
        throw Object.assign(new Error("Demanda não encontrada."), {
          status: 404,
        });
      if (input.version !== before.version)
        throw Object.assign(
          new Error(
            "A demanda foi alterada por outra operação. Recarregue os dados.",
          ),
          { status: 409 },
        );
      const payload = demandPayload(before.payload);
      const existing = demandCommentSchema
        .array()
        .safeParse(payload.comments ?? []);
      if (!existing.success)
        throw Object.assign(
          new Error("Os comentários armazenados estão inconsistentes."),
          { status: 409 },
        );
      const user = await db
        .selectFrom("users")
        .select(["name", "avatar"])
        .where("id", "=", session.id)
        .executeTakeFirstOrThrow();
      const now = new Date().toISOString();
      const commentId = `comm-${crypto.randomUUID()}`;
      const persistedAttachments = await persistCommentAttachments(
        input.attachments,
        { demandId: req.params.id, commentId, userId: session.id },
      );
      const comment = commentDtoSchema.parse({
        id: commentId,
        userId: session.id,
        userName: user.name,
        userAvatar: user.avatar || "",
        content: input.content,
        createdAt: now,
        attachments: persistedAttachments.map((item) => ({
          ...item,
          uploadedByUserId: session.id,
          uploadedAt: now,
        })),
      });
      const updated = await db
        .updateTable("demands")
        .set({
          payload: { ...payload, comments: [...existing.data, comment] },
          version: before.version + 1,
          updated_at: new Date(),
        })
        .where("id", "=", req.params.id)
        .where("module_id", "=", moduleId(res))
        .where("version", "=", input.version)
        .returning("version")
        .executeTakeFirst();
      if (!updated) {
        const localKeys=persistedAttachments.map(item=>item.url.match(/^\/uploads\/([^/]+)$/)?.[1]).filter((value):value is string=>Boolean(value));
        await Promise.all(localKeys.map(async key=>{await db.deleteFrom("attachment_files").where("storage_key","=",key).execute();await rm(path.join(path.resolve(process.env.UPLOAD_DIR||"uploads"),key),{force:true});}));
        throw Object.assign(
          new Error(
            "A demanda foi alterada por outra operação. Recarregue os dados.",
          ),
          { status: 409 },
        );
      }
      await audit(req, "CREATE", "comment", comment.id, null, {
        demandId: req.params.id,
        attachments: comment.attachments?.length ?? 0,
      });
      validatedJson(
        res,
        commentMutationResponseSchema,
        { comment, demandVersion: updated.version },
        201,
      );
    }),
  );
  router.patch(
    "/demands/:id/comments/:commentId",
    authorize("comments:edit"),
    safe(async (req, res) => {
      const input = editCommentInputSchema.parse(req.body);
      const session = res.locals.session as Session;
      const db = getDatabase();
      const before = await db
        .selectFrom("demands")
        .selectAll()
        .where("id", "=", req.params.id)
        .where("module_id", "=", moduleId(res))
        .where("deleted_at", "is", null)
        .executeTakeFirst();
      if (!before)
        throw Object.assign(new Error("Demanda não encontrada."), {
          status: 404,
        });
      if (input.version !== before.version)
        throw Object.assign(
          new Error(
            "A demanda foi alterada por outra operação. Recarregue os dados.",
          ),
          { status: 409 },
        );
      const payload = demandPayload(before.payload);
      const parsed = demandCommentSchema
        .array()
        .safeParse(payload.comments ?? []);
      if (!parsed.success)
        throw Object.assign(
          new Error("Os comentários armazenados estão inconsistentes."),
          { status: 409 },
        );
      const comments = [...parsed.data];
      const index = comments.findIndex(
        (item) => item.id === req.params.commentId,
      );
      if (index < 0)
        throw Object.assign(new Error("Comentário não encontrado."), {
          status: 404,
        });
      if (
        comments[index].userId !== session.id &&
        !(await can(res, "comments:admin"))
      )
        throw Object.assign(
          new Error("Sem permissão para editar este comentário."),
          { status: 403 },
        );
      const edited = commentDtoSchema.parse({
        ...comments[index],
        content: input.content,
        editedAt: new Date().toISOString(),
        editedByUserId: session.id,
      });
      comments[index] = edited;
      const updated = await db
        .updateTable("demands")
        .set({
          payload: { ...payload, comments },
          version: before.version + 1,
          updated_at: new Date(),
        })
        .where("id", "=", req.params.id)
        .where("module_id", "=", moduleId(res))
        .where("version", "=", input.version)
        .returning("version")
        .executeTakeFirst();
      if (!updated)
        throw Object.assign(
          new Error(
            "A demanda foi alterada por outra operação. Recarregue os dados.",
          ),
          { status: 409 },
        );
      await audit(
        req,
        "UPDATE",
        "comment",
        req.params.commentId,
        { demandId: req.params.id },
        { edited: true },
      );
      validatedJson(res, commentMutationResponseSchema, {
        comment: edited,
        demandVersion: updated.version,
      });
    }),
  );
  router.post(
    "/demands",
    authorize("demands:create"),
    safe(async (req, res) => {
      const input = demandCreateSchema.parse(req.body);
      const session = res.locals.session as Session;
      const db = getDatabase();
      const persisted = await createDemandTransactionally({
        database: db,
        moduleId: moduleId(res),
        requesterId: session.id,
        input,
        audit: (transaction, id, created) =>
          audit(req, "CREATE", "demand", id, null, created, transaction),
      });
      validatedJson(res, demandDtoSchema, demandJson(persisted), 201);
    }),
  );
  router.put(
    "/demands/:id/blocker",
    authorize("demands:update"),
    safe(async (req, res) => {
      const input = blockerInputSchema.parse(req.body);
      const db = getDatabase();
      const session = res.locals.session as Session;
      const now = new Date();
      const transactionResult = await db.transaction().execute(async (trx) => {
        const source = await trx
          .selectFrom("demands")
          .selectAll()
          .where("id", "=", req.params.id)
          .where("module_id", "=", moduleId(res))
          .where("deleted_at", "is", null)
          .executeTakeFirst();
        if (!source)
          throw Object.assign(new Error("Demanda não encontrada."), {
            status: 404,
          });
        const current = demandPayload(source.payload);
        const storedBlocker = demandBlockerSchema.safeParse(current.blocker);
        const previousBlocker = storedBlocker.success
          ? storedBlocker.data
          : { isBlocked: false };
        let linkedDemandId = previousBlocker.linkedDemandId;
        let createdDemandId: string | null = null;
        if (input.isBlocked && input.createRelatedTask && !linkedDemandId) {
          const responsibleTeamId = input.responsibleTeamId;
          if (!responsibleTeamId)
            throw Object.assign(
              new Error(
                "Selecione a equipe responsável pela atividade relacionada.",
              ),
              {
                status: 422,
                code: "VALIDATION_ERROR",
                fieldErrors: {
                  responsibleTeamId: ["Selecione a equipe responsável."],
                },
              },
            );
          const team = await trx
            .selectFrom("teams")
            .selectAll("teams")
            .innerJoin("team_modules", "team_modules.team_id", "teams.id")
            .where("teams.id", "=", responsibleTeamId)
            .where("team_modules.module_id", "=", moduleId(res))
            .where("teams.active", "=", true)
            .where("teams.deleted_at", "is", null)
            .executeTakeFirst();
          if (!team)
            throw Object.assign(
              new Error("Equipe responsável não encontrada ou inativa."),
              {
                status: 422,
                code: "VALIDATION_ERROR",
                fieldErrors: {
                  responsibleTeamId: ["Equipe inexistente ou inativa."],
                },
              },
            );
          const member = team.leader_id
            ? { user_id: team.leader_id }
            : await trx
                .selectFrom("team_members")
                .select("user_id")
                .where("team_id", "=", team.id)
                .executeTakeFirst();
          createdDemandId = `dem-${crypto.randomUUID()}`;
          linkedDemandId = createdDemandId;
          const childCode = `IMP-${now.getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
          const reason = input.reason?.trim() ?? "";
          const description = input.actionNeeded?.trim() || reason;
          const childPayload = {
            ...current,
            id: createdDemandId,
            code: childCode,
            title: `[Impedimento ${source.code}] ${reason}`,
            description,
            requesterId: session.id,
            assigneeId: member?.user_id || "",
            teamId: team.id,
            clientId: null,
            sprintId: null,
            categoryId: input.taskCategoryId || source.category_id,
            statusId: input.initialStatusId || source.status_id,
            progressPercent: 0,
            createdAt: now.toISOString(),
            plannedStartDate: dateOnly(now),
            dueDate: dateOnly(source.due_date || now),
            originalBaselineStartDate: dateOnly(now),
            originalBaselineDueDate: dateOnly(source.due_date || now),
            checklist: createDefaultChecklist(),
            dependencies: [],
            advancedDependencies: [],
            blocker: { isBlocked: false },
            comments: [],
            attachments: [],
            completedAt: undefined,
            completedByUserId: undefined,
            completionSummary: undefined,
            updatedAt: now.toISOString(),
            updatedByUserId: session.id,
            sourceBlockerDemandId: source.id,
          };
          await trx
            .insertInto("demands")
            .values({
              id: createdDemandId,
              module_id: source.module_id,
              code: childCode,
              title: childPayload.title,
              description,
              status_id: childPayload.statusId,
              priority_id: source.priority_id,
              category_id: childPayload.categoryId,
              requester_id: session.id,
              assignee_id: member?.user_id || null,
              team_id: team.id,
              client_id: null,
              sprint_id: null,
              backlog_position: 0,
              due_date: source.due_date,
              payload: childPayload,
              version: 1,
              deleted_at: null,
              completed_at: null,
              archived_at: null,
              created_at: now,
              updated_at: now,
            })
            .execute();
        }
        const blocker: z.infer<typeof demandBlockerSchema> = input.isBlocked
          ? {
              isBlocked: true,
              kind: input.kind,
              reason: input.reason?.trim(),
              impact: input.impact || "Alto",
              actionNeeded: input.actionNeeded?.trim() || "",
              createRelatedTask: input.createRelatedTask,
              responsibleTeamId: input.createRelatedTask
                ? input.responsibleTeamId
                : undefined,
              linkedDemandId: input.createRelatedTask
                ? linkedDemandId
                : undefined,
              previousStatusId:
                previousBlocker.previousStatusId || source.status_id,
              blockedAt: previousBlocker.blockedAt || now.toISOString(),
              blockedByUserId: session.id,
            }
          : {
              ...previousBlocker,
              isBlocked: false,
              resolvedAt: now.toISOString(),
              resolvedByDemandId: undefined,
            };
        const previousWasHardBlock = previousBlocker.kind !== "impediment";
        const statusId = input.isBlocked
          ? input.kind === "blocker"
            ? input.blockedStatusId || source.status_id
            : source.status_id
          : previousWasHardBlock
            ? previousBlocker.previousStatusId || source.status_id
            : source.status_id;
        const sourcePayload = {
          ...current,
          statusId,
          blocker,
          updatedAt: now.toISOString(),
          updatedByUserId: session.id,
        };
        const updated = await trx
          .updateTable("demands")
          .set({
            status_id: statusId,
            payload: sourcePayload,
            version: source.version + 1,
            updated_at: now,
          })
          .where("id", "=", source.id)
          .where("module_id", "=", moduleId(res))
          .where("version", "=", input.version)
          .returning("version")
          .executeTakeFirst();
        if (!updated)
          throw Object.assign(
            new Error(
              "A demanda foi alterada por outra operação. Recarregue os dados.",
            ),
            { status: 409 },
          );
        return { createdDemandId, linkedDemandId };
      });
      const [persisted, created] = await Promise.all([
        db
          .selectFrom("demands")
          .selectAll()
          .where("id", "=", req.params.id)
          .where("module_id", "=", moduleId(res))
          .executeTakeFirstOrThrow(),
        transactionResult.createdDemandId
          ? db
              .selectFrom("demands")
              .selectAll()
              .where("id", "=", transactionResult.createdDemandId)
              .where("module_id", "=", moduleId(res))
              .executeTakeFirst()
          : Promise.resolve(undefined),
      ]);
      await audit(
        req,
        input.isBlocked ? "BLOCK" : "UNBLOCK",
        "demand",
        req.params.id,
        null,
        {
          createRelatedTask: input.createRelatedTask,
          linkedDemandId: transactionResult.linkedDemandId,
        },
      );
      validatedJson(res, blockerResponseSchema, {
        demand: demandJson(persisted),
        createdDemand: created ? demandJson(created) : null,
      });
    }),
  );
  router.post(
    "/demands/:id/complete",
    authorize("demands:update"),
    safe(async (req, res) => {
      const input = completeDemandInputSchema.parse(req.body);
      const db = getDatabase();
      const session = res.locals.session as Session;
      const now = new Date();
      const autoUnblockedIds = await db.transaction().execute(async (trx) => {
        const target = await trx
          .selectFrom("demands")
          .selectAll()
          .where("id", "=", req.params.id)
          .where("module_id", "=", moduleId(res))
          .where("deleted_at", "is", null)
          .executeTakeFirst();
        if (!target)
          throw Object.assign(new Error("Demanda não encontrada."), {
            status: 404,
          });
        if (input.version !== target.version)
          throw Object.assign(
            new Error(
              "A demanda foi alterada por outra operação. Recarregue os dados.",
            ),
            { status: 409 },
          );
        const transition = await validateDemandTransition(
          trx,
          moduleId(res),
          target,
          input.statusId,
          String(res.locals.moduleRole),
          input.override,
          "completion",
        );
        if (transition.target.category !== "completed")
          throw Object.assign(
            new Error(
              "O endpoint de conclusão exige um status final concluído.",
            ),
            {
              status: 422,
              code: "VALIDATION_ERROR",
              fieldErrors: { statusId: ["Selecione um status de conclusão."] },
            },
          );
        const current = demandPayload(target.payload);
        const completed = {
          ...current,
          statusId: input.statusId,
          progressPercent: 100,
          completedAt: now.toISOString(),
          completedByUserId: session.id,
          completionSummary: input.summary,
          updatedAt: now.toISOString(),
          updatedByUserId: session.id,
        };
        const updated = await trx
          .updateTable("demands")
          .set({
            status_id: input.statusId,
            payload: completed,
            completed_at: now,
            version: target.version + 1,
            updated_at: now,
          })
          .where("id", "=", target.id)
          .where("module_id", "=", moduleId(res))
          .where("version", "=", input.version)
          .returning("version")
          .executeTakeFirst();
        if (!updated)
          throw Object.assign(
            new Error(
              "A demanda foi alterada por outra operação. Recarregue os dados.",
            ),
            { status: 409 },
          );
        const candidates = await trx
          .selectFrom("demands")
          .selectAll()
          .where("module_id", "=", moduleId(res))
          .where("deleted_at", "is", null)
          .execute();
        const ids: string[] = [];
        for (const parent of candidates) {
          const payload = demandPayload(parent.payload);
          const blocker = demandBlockerSchema.safeParse(payload.blocker);
          if (
            blocker.success &&
            blocker.data.isBlocked &&
            blocker.data.createRelatedTask &&
            blocker.data.linkedDemandId === target.id
          ) {
            const statusId = blocker.data.previousStatusId || parent.status_id;
            const unblocked = {
              ...payload,
              statusId,
              blocker: {
                ...blocker.data,
                isBlocked: false,
                resolvedAt: now.toISOString(),
                resolvedByDemandId: target.id,
              },
              updatedAt: now.toISOString(),
              updatedByUserId: session.id,
            };
            await trx
              .updateTable("demands")
              .set({
                status_id: statusId,
                payload: unblocked,
                version: parent.version + 1,
                updated_at: now,
              })
              .where("id", "=", parent.id)
              .where("module_id", "=", moduleId(res))
              .execute();
            ids.push(parent.id);
          }
        }
        return ids;
      });
      const [persisted, autoUnblocked] = await Promise.all([
        db
          .selectFrom("demands")
          .selectAll()
          .where("id", "=", req.params.id)
          .where("module_id", "=", moduleId(res))
          .executeTakeFirstOrThrow(),
        autoUnblockedIds.length
          ? db
              .selectFrom("demands")
              .selectAll()
              .where("module_id", "=", moduleId(res))
              .where("id", "in", autoUnblockedIds)
              .orderBy("id")
              .execute()
          : Promise.resolve([]),
      ]);
      await audit(req, "COMPLETE", "demand", req.params.id, null, {
        autoUnblockedIds,
        overrideJustification: input.override?.justification,
      });
      validatedJson(res, completeDemandResponseSchema, {
        demand: demandJson(persisted),
        autoUnblocked: autoUnblocked.map(demandJson),
      });
    }),
  );
  router.patch(
    "/demands/:id",
    authorize("demands:update"),
    safe(async (req, res) => {
      const input = demandSchema.partial().parse(req.body);
      const db = getDatabase();
      const before = await db
        .selectFrom("demands")
        .selectAll()
        .where("id", "=", req.params.id)
        .where("module_id", "=", moduleId(res))
        .where("deleted_at", "is", null)
        .executeTakeFirst();
      if (!before)
        throw Object.assign(new Error("Demanda não encontrada."), {
          status: 404,
        });
      if (input.version !== before.version)
        throw Object.assign(
          new Error(
            "A demanda foi alterada por outra operação. Recarregue os dados.",
          ),
          { status: 409 },
        );
      if (input.statusId !== undefined && input.statusId !== before.status_id) {
        const transition = await validateDemandTransition(
          db,
          moduleId(res),
          before,
          input.statusId,
          String(res.locals.moduleRole),
          input.override,
        );
        if (transition.target.category === "completed")
          throw Object.assign(new Error("Use a operação específica de conclusão para concluir a demanda."), { status: 422, code: "VALIDATION_ERROR", fieldErrors: { statusId: ["A conclusão exige a operação específica."] } });
        if (transition.current.category === "completed")
          throw Object.assign(new Error("A reabertura exige uma operação específica para preservar os dados de conclusão."), { status: 422, code: "VALIDATION_ERROR", fieldErrors: { statusId: ["A reabertura não é permitida pela edição genérica."] } });
      }
      const currentPayload = demandPayload(before.payload);
      const { version: _version, override, ...domainInput } = input;
      await validateDemandReferences(db, moduleId(res), {
        ...currentPayload,
        ...domainInput,
      });
      await validateDemandDependencyGraph(db,moduleId(res),req.params.id,{...currentPayload,...domainInput});
      const mutationTime = new Date();
      const payload = {
        ...currentPayload,
        ...domainInput,
        updatedAt: mutationTime.toISOString(),
        updatedByUserId: (res.locals.session as Session).id,
      };
      const updated = await db.transaction().execute(async (trx) => {
        const result = await trx
          .updateTable("demands")
          .set({
          title: input.title ?? before.title,
          description: input.description ?? before.description,
          status_id: input.statusId ?? before.status_id,
          priority_id: input.priorityId ?? before.priority_id,
          category_id: input.categoryId ?? before.category_id,
          assignee_id:
            input.assigneeId === undefined
              ? before.assignee_id
              : input.assigneeId,
          team_id: input.teamId === undefined ? before.team_id : input.teamId,
          client_id:
            input.clientId === undefined ? before.client_id : input.clientId,
          due_date:
            input.dueDate === undefined
              ? before.due_date
              : input.dueDate
                ? new Date(
                    `${String(input.dueDate).slice(0, 10)}T00:00:00.000Z`,
                  )
                : null,
          payload,
          version: before.version + 1,
          updated_at: mutationTime,
        })
          .where("id", "=", req.params.id)
          .where("module_id", "=", moduleId(res))
          .where("version", "=", input.version)
          .returning("version")
          .executeTakeFirst();
        if (!result)
          throw Object.assign(
          new Error(
            "A demanda foi alterada por outra operação. Recarregue os dados.",
          ),
          { status: 409 },
          );
        await audit(
          req,
          "UPDATE",
          "demand",
          req.params.id,
          { id: before.id, version: before.version },
          {
            fields: Object.keys(domainInput),
            overrideJustification: override?.justification,
          },
          trx,
        );
        return result;
      });
      const persisted = await db
        .selectFrom("demands")
        .selectAll()
        .where("id", "=", req.params.id)
        .where("module_id", "=", moduleId(res))
        .executeTakeFirstOrThrow();
      validatedJson(res, demandDtoSchema, demandJson(persisted));
    }),
  );
  router.delete(
    "/demands/:id",
    authorize("demands:delete"),
    safe(async (req, res) => {
      const { version } = demandDeleteQuerySchema.parse(req.query);
      const db = getDatabase();
      const before = await db
        .selectFrom("demands")
        .selectAll()
        .where("id", "=", req.params.id)
        .where("module_id", "=", moduleId(res))
        .where("deleted_at", "is", null)
        .executeTakeFirst();
      if (!before)
        throw Object.assign(new Error("Demanda não encontrada."), {
          status: 404,
        });
      if (version !== before.version)
        throw Object.assign(
          new Error(
            "A demanda foi alterada por outra operação. Recarregue os dados.",
          ),
          { status: 409 },
        );
      const now = new Date();
      const deleted = await db
        .updateTable("demands")
        .set({ deleted_at: now, version: before.version + 1, updated_at: now })
        .where("id", "=", req.params.id)
        .where("module_id", "=", moduleId(res))
        .where("version", "=", version)
        .returning("version")
        .executeTakeFirst();
      if (!deleted)
        throw Object.assign(
          new Error(
            "A demanda foi alterada por outra operação. Recarregue os dados.",
          ),
          { status: 409 },
        );
      await audit(
        req,
        "DELETE",
        "demand",
        req.params.id,
        { id: before.id, version: before.version },
        { deletedAt: now },
      );
      res.status(204).end();
    }),
  );

  router.get(
    "/audit-logs",
    authorize("audit:read"),
    safe(async (req, res) => {
      const { limit } = auditQuerySchema.parse(req.query);
      const rows = await getDatabase()
        .selectFrom("audit_logs")
        .leftJoin("users", "users.id", "audit_logs.actor_id")
        .select([
          "audit_logs.id",
          "audit_logs.action",
          "audit_logs.actor_id",
          "audit_logs.entity_type",
          "audit_logs.entity_id",
          "audit_logs.created_at",
          "users.name as actor_name",
        ])
        .where("audit_logs.module_id", "=", moduleId(res))
        .orderBy("audit_logs.created_at", "desc")
        .limit(limit)
        .execute();
      validatedJson(
        res,
        auditListResponseSchema,
        rows.map((row) => ({
          id: row.id,
          action: row.action,
          actor: { id: row.actor_id, name: row.actor_name ?? null },
          entity: { type: row.entity_type, id: row.entity_id },
          timestamp: row.created_at.toISOString(),
        })),
      );
    }),
  );
  router.get(
    "/sessions",
    safe(async (_req, res) => {
      const session = res.locals.session as Session;
      const rows = await getDatabase()
        .selectFrom("auth_sessions")
        .select([
          "id",
          "user_agent",
          "created_at",
          "last_seen_at",
          "expires_at",
        ])
        .where("user_id", "=", session.id)
        .where("revoked_at", "is", null)
        .where("expires_at", ">", new Date())
        .orderBy("last_seen_at", "desc")
        .execute();
      validatedJson(
        res,
        sessionListResponseSchema,
        rows.map((row) => ({
          id: row.id,
          device: row.user_agent || "Dispositivo não identificado",
          startedAt: row.created_at.toISOString(),
          lastActiveAt: row.last_seen_at.toISOString(),
          expiresAt: row.expires_at.toISOString(),
          isCurrent: row.id === session.sid,
        })),
      );
    }),
  );
  router.delete(
    "/sessions/:id",
    safe(async (req, res) => {
      const session = res.locals.session as Session;
      const result = await getDatabase()
        .updateTable("auth_sessions")
        .set({ revoked_at: new Date() })
        .where("id", "=", req.params.id)
        .where("user_id", "=", session.id)
        .where("revoked_at", "is", null)
        .executeTakeFirst();
      if (Number(result.numUpdatedRows) === 0)
        throw Object.assign(new Error("Sessão não encontrada."), {
          status: 404,
        });
      await audit(req, "REVOKE", "session", req.params.id, null, {
        current: req.params.id === session.sid,
      });
      res.status(204).end();
    }),
  );
  router.patch(
    "/users/:id",
    authorize("users:update"),
    safe(async (req, res) => {
      const input = userUpdateSchema.parse(req.body);
      const db = getDatabase();
      const before = await db
        .selectFrom("users")
        .selectAll()
        .where("id", "=", req.params.id)
        .where("deleted_at", "is", null)
        .executeTakeFirst();
      if (!before)
        throw Object.assign(new Error("Usuário não encontrado."), {
          status: 404,
        });
      const replacementTeamIds =
        input.teamIds === undefined ? undefined : [...new Set(input.teamIds)];
      if (replacementTeamIds) {
        const valid = replacementTeamIds.length
          ? await db
              .selectFrom("teams")
              .select("id")
              .where("id", "in", replacementTeamIds)
              .where("active", "=", true)
              .where("deleted_at", "is", null)
              .execute()
          : [];
        if (valid.length !== replacementTeamIds.length)
          throw Object.assign(
            new Error(
              "Uma ou mais equipes selecionadas não existem ou estão inativas.",
            ),
            {
              status: 422,
              code: "VALIDATION_ERROR",
              fieldErrors: { teamIds: ["Equipe inexistente ou inativa."] },
            },
          );
      }
      const update = {
        email: input.email?.trim().toLowerCase() ?? before.email,
        name: input.name ?? before.name,
        role: input.role ?? before.role,
        role_title: input.roleTitle ?? before.role_title,
        department: input.department ?? before.department,
        branch: input.branch === undefined ? before.branch : input.branch,
        phone: input.phone === undefined ? before.phone : input.phone,
        avatar:
          input.avatar === undefined ? before.avatar : input.avatar || null,
        active: input.active ?? before.active,
        updated_at: new Date(),
      };
      await db.transaction().execute(async (trx) => {
        await trx
          .updateTable("users")
          .set(update)
          .where("id", "=", req.params.id)
          .execute();
        if (replacementTeamIds !== undefined) {
          await trx
            .deleteFrom("team_members")
            .where("user_id", "=", req.params.id)
            .execute();
          if (replacementTeamIds.length)
            await trx
              .insertInto("team_members")
              .values(
                replacementTeamIds.map((team_id) => ({
                  team_id,
                  user_id: req.params.id,
                  created_at: new Date(),
                })),
              )
              .execute();
        }
        if (input.customPermissions !== undefined) {
          await trx
            .deleteFrom("user_permissions")
            .where("user_id", "=", req.params.id)
            .execute();
          const entries = [
            ...input.customPermissions.granted.map((permission) => ({
              permission,
              effect: "allow" as const,
            })),
            ...input.customPermissions.revoked.map((permission) => ({
              permission,
              effect: "deny" as const,
            })),
          ];
          if (entries.length)
            await trx
              .insertInto("user_permissions")
              .values(
                entries.map((item) => ({
                  user_id: req.params.id,
                  permission: item.permission,
                  effect: item.effect,
                  created_by: (res.locals.session as Session).id,
                  created_at: new Date(),
                })),
              )
              .execute();
        }
        if (
          input.active === false ||
          (input.role && input.role !== before.role)
        )
          await trx
            .updateTable("auth_sessions")
            .set({ revoked_at: new Date() })
            .where("user_id", "=", req.params.id)
            .execute();
      });
      const [persisted, members, permissions] = await Promise.all([
        db
          .selectFrom("users")
          .selectAll()
          .where("id", "=", req.params.id)
          .executeTakeFirstOrThrow(),
        db
          .selectFrom("team_members")
          .select("team_id")
          .where("user_id", "=", req.params.id)
          .orderBy("team_id")
          .execute(),
        db
          .selectFrom("user_permissions")
          .select(["permission", "effect"])
          .where("user_id", "=", req.params.id)
          .execute(),
      ]);
      const customPermissions = {
        granted: permissions
          .filter((item) => item.effect === "allow")
          .map((item) => item.permission),
        revoked: permissions
          .filter((item) => item.effect === "deny")
          .map((item) => item.permission),
      };
      await audit(
        req,
        "UPDATE",
        "user",
        req.params.id,
        { id: before.id },
        { fields: Object.keys(input) },
      );
      validatedJson(
        res,
        publicUserDtoSchema,
        userJson(
          persisted,
          members.map((item) => item.team_id),
          customPermissions,
        ),
      );
    }),
  );
  router.delete(
    "/users/:id",
    authorize("users:update"),
    safe(async (req, res) => {
      const session = res.locals.session as Session;
      if (session.id === req.params.id)
        throw Object.assign(
          new Error("Não é permitido desativar a própria conta."),
          { status: 409 },
        );
      const db = getDatabase();
      const before = await db
        .selectFrom("users")
        .selectAll()
        .where("id", "=", req.params.id)
        .where("deleted_at", "is", null)
        .executeTakeFirst();
      if (!before)
        throw Object.assign(new Error("Usuário não encontrado."), {
          status: 404,
        });
      const now = new Date();
      await db.transaction().execute(async (trx) => {
        await trx
          .updateTable("users")
          .set({ active: false, deleted_at: now, updated_at: now })
          .where("id", "=", req.params.id)
          .execute();
        await trx
          .updateTable("auth_sessions")
          .set({ revoked_at: now })
          .where("user_id", "=", req.params.id)
          .execute();
      });
      await audit(
        req,
        "DEACTIVATE",
        "user",
        req.params.id,
        { id: before.id, active: before.active },
        { active: false, deletedAt: now },
      );
      res.status(204).end();
    }),
  );
  router.put(
    "/configurations/:key",
    authorize("configurations:update"),
    safe(async (req, res) => {
      const key = configurationKeySchema.parse(req.params.key);
      const parsed = configurationUpdateSchemas[key].parse(req.body);
      const jsonValue = sql<unknown>`${JSON.stringify(parsed.value)}::jsonb`;
      const session = res.locals.session as Session;
      await getDatabase()
        .insertInto("module_configurations")
        .values({
          module_id: moduleId(res),
          key,
          value: jsonValue,
          updated_by: session.id,
          updated_at: new Date(),
        })
        .onConflict((oc) =>
          oc
            .columns(["module_id", "key"])
            .doUpdateSet({
              value: jsonValue,
              updated_by: session.id,
              updated_at: new Date(),
            }),
        )
        .execute();
      await audit(req, "UPDATE", "configuration", key, null, {
        count: Array.isArray(parsed.value) ? parsed.value.length : 1,
      });
      res.status(204).end();
    }),
  );
  router.get(
    "/report-presets",
    safe(async (_req, res) => {
      const session = res.locals.session as Session;
      const rows = await getDatabase()
        .selectFrom("report_presets")
        .selectAll()
        .where("module_id", "=", moduleId(res))
        .where("user_id", "=", session.id)
        .orderBy("updated_at", "desc")
        .execute();
      validatedJson(
        res,
        reportPresetListSchema,
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          configuration: row.configuration,
          updatedAt: row.updated_at.toISOString(),
        })),
      );
    }),
  );
  router.post(
    "/report-presets",
    safe(async (req, res) => {
      const input = reportPresetCreateSchema.parse(req.body);
      const session = res.locals.session as Session;
      const now = new Date();
      const id = `rpt-${crypto.randomUUID()}`;
      const selectedModuleId = moduleId(res);
      const configuration = sql<unknown>`${JSON.stringify(input.configuration)}::jsonb`;
      const row = await getDatabase()
        .insertInto("report_presets")
        .values({
          id,
          module_id: selectedModuleId,
          user_id: session.id,
          name: input.name,
          configuration,
          created_at: now,
          updated_at: now,
        })
        .onConflict((oc) =>
          oc
            .columns(["module_id", "user_id", "name"])
            .doUpdateSet({ configuration, updated_at: now }),
        )
        .returningAll()
        .executeTakeFirstOrThrow();
      await audit(req, "SAVE_PRESET", "report_preset", row.id, null, {
        name: row.name,
      });
      validatedJson(
        res,
        reportPresetDtoSchema,
        {
          id: row.id,
          name: row.name,
          configuration: row.configuration,
          updatedAt: row.updated_at.toISOString(),
        },
        201,
      );
    }),
  );

  const requestType = z.enum([
    "access",
    "correction",
    "deletion",
    "portability",
    "restriction",
  ]);
  router.post(
    "/privacy/requests",
    safe(async (req, res) => {
      const input = privacyRequestCreateSchema.parse(req.body);
      const session = res.locals.session as Session;
      const db = getDatabase();
      const user = await db
        .selectFrom("users")
        .select("email")
        .where("id", "=", session.id)
        .executeTakeFirstOrThrow();
      const now = new Date();
      const record = await db
        .insertInto("data_subject_requests")
        .values({
          id: crypto.randomUUID(),
          subject_email: user.email,
          request_type: input.requestType,
          status: "verified",
          verification_token_hash: null,
          assigned_to: null,
          rejection_reason: null,
          due_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          completed_at: null,
          created_at: now,
          updated_at: now,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      await audit(req, "CREATE", "data_subject_request", record.id, null, {
        requestType: record.request_type,
        dueAt: record.due_at,
      });
      validatedJson(
        res,
        privacyRequestDtoSchema,
        ((row: {
          id: string;
          subject_email: string;
          request_type: string;
          status: string;
          assigned_to: string | null;
          rejection_reason: string | null;
          due_at: Date;
          completed_at: Date | null;
          created_at: Date;
          updated_at: Date;
        }) => ({
          id: row.id,
          subjectEmail: row.subject_email,
          requestType: row.request_type,
          status: row.status,
          assignedTo: row.assigned_to,
          rejectionReason: row.rejection_reason,
          dueAt: row.due_at.toISOString(),
          completedAt: row.completed_at?.toISOString() ?? null,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString(),
        }))(record),
        201,
      );
    }),
  );
  router.get(
    "/privacy/requests",
    authorize("privacy:manage"),
    safe(async (req, res) => {
      const status = privacyRequestDtoSchema.shape.status
        .optional()
        .parse(req.query.status);
      let query = getDatabase()
        .selectFrom("data_subject_requests")
        .selectAll()
        .orderBy("created_at", "desc");
      if (status) query = query.where("status", "=", status);
      const rows = await query.limit(500).execute();
      validatedJson(
        res,
        privacyRequestListSchema,
        rows.map(
          (row: {
            id: string;
            subject_email: string;
            request_type: string;
            status: string;
            assigned_to: string | null;
            rejection_reason: string | null;
            due_at: Date;
            completed_at: Date | null;
            created_at: Date;
            updated_at: Date;
          }) => ({
            id: row.id,
            subjectEmail: row.subject_email,
            requestType: row.request_type,
            status: row.status,
            assignedTo: row.assigned_to,
            rejectionReason: row.rejection_reason,
            dueAt: row.due_at.toISOString(),
            completedAt: row.completed_at?.toISOString() ?? null,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
          }),
        ),
      );
    }),
  );
  router.patch(
    "/privacy/requests/:id",
    authorize("privacy:manage"),
    safe(async (req, res) => {
      const input = privacyRequestUpdateSchema.parse(req.body);
      const db = getDatabase();
      const before = await db
        .selectFrom("data_subject_requests")
        .selectAll()
        .where("id", "=", req.params.id)
        .executeTakeFirst();
      if (!before)
        throw Object.assign(new Error("Solicitação não encontrada."), {
          status: 404,
        });
      const session = res.locals.session as Session;
      const completedAt =
        input.status === "completed" || input.status === "rejected"
          ? new Date()
          : null;
      await db
        .updateTable("data_subject_requests")
        .set({
          status: input.status,
          assigned_to: session.id,
          rejection_reason:
            input.status === "rejected" ? input.rejectionReason || null : null,
          completed_at: completedAt,
          updated_at: new Date(),
        })
        .where("id", "=", req.params.id)
        .execute();
      await audit(
        req,
        "UPDATE",
        "data_subject_request",
        req.params.id,
        { status: before.status },
        { status: input.status },
      );
      res.status(204).end();
    }),
  );
  router.get(
    "/privacy/export",
    safe(async (req, res) => {
      const session = res.locals.session as Session;
      const db = getDatabase();
      const [user, requested, assigned, requests, consents] = await Promise.all(
        [
          db
            .selectFrom("users")
            .select([
              "id",
              "email",
              "name",
              "role_title",
              "department",
              "branch",
              "phone",
              "active",
              "created_at",
              "updated_at",
            ])
            .where("id", "=", session.id)
            .executeTakeFirstOrThrow(),
          db
            .selectFrom("demands")
            .select([
              "id",
              "code",
              "title",
              "status_id",
              "created_at",
              "updated_at",
            ])
            .where("requester_id", "=", session.id)
            .execute(),
          db
            .selectFrom("demands")
            .select([
              "id",
              "code",
              "title",
              "status_id",
              "created_at",
              "updated_at",
            ])
            .where("assignee_id", "=", session.id)
            .execute(),
          db
            .selectFrom("data_subject_requests")
            .selectAll()
            .where(
              "subject_email",
              "=",
              db
                .selectFrom("users")
                .select("email")
                .where("id", "=", session.id),
            )
            .execute(),
          db
            .selectFrom("consent_records")
            .select(["purpose", "granted", "policy_version", "created_at"])
            .where(
              "subject_email",
              "=",
              db
                .selectFrom("users")
                .select("email")
                .where("id", "=", session.id),
            )
            .execute(),
        ],
      );
      const demand = (item: {
        id: string;
        code: string;
        title: string;
        status_id: string;
        created_at: Date;
        updated_at: Date;
      }) => ({
        id: item.id,
        code: item.code,
        title: item.title,
        statusId: item.status_id,
        createdAt: item.created_at.toISOString(),
        updatedAt: item.updated_at.toISOString(),
      });
      await audit(req, "EXPORT", "data_subject", session.id, null, {
        requestedDemands: requested.length,
        assignedDemands: assigned.length,
      });
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="prolog-dados-pessoais.json"',
      );
      validatedJson(res, privacyExportSchema, {
        generatedAt: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roleTitle: user.role_title,
          department: user.department,
          branch: user.branch,
          phone: user.phone,
          active: user.active,
          createdAt: user.created_at.toISOString(),
          updatedAt: user.updated_at.toISOString(),
        },
        requestedDemands: requested.map(demand),
        assignedDemands: assigned.map(demand),
        requests: requests.map(
          (row: {
            id: string;
            subject_email: string;
            request_type: string;
            status: string;
            assigned_to: string | null;
            rejection_reason: string | null;
            due_at: Date;
            completed_at: Date | null;
            created_at: Date;
            updated_at: Date;
          }) => ({
            id: row.id,
            subjectEmail: row.subject_email,
            requestType: row.request_type,
            status: row.status,
            assignedTo: row.assigned_to,
            rejectionReason: row.rejection_reason,
            dueAt: row.due_at.toISOString(),
            completedAt: row.completed_at?.toISOString() ?? null,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
          }),
        ),
        consents: consents.map((item) => ({
          purpose: item.purpose,
          granted: item.granted,
          policyVersion: item.policy_version,
          createdAt: item.created_at.toISOString(),
        })),
      });
    }),
  );

  router.get(
    "/privacy/retention-policies",
    authorize("privacy:manage"),
    safe(async (_req, res) => {
      const rows = await getDatabase()
        .selectFrom("retention_policies")
        .selectAll()
        .orderBy("entity_type")
        .execute();
      validatedJson(
        res,
        retentionPolicyListSchema,
        rows.map((row) => ({
          entityType: row.entity_type,
          retentionDays: row.retention_days,
          anonymizeAfterExpiry: row.anonymize_after_expiry,
          legalBasis: row.legal_basis,
          updatedAt: row.updated_at.toISOString(),
        })),
      );
    }),
  );
  router.put(
    "/privacy/retention-policies/:entityType",
    authorize("privacy:manage"),
    safe(async (req, res) => {
      const entityType = retentionEntitySchema.parse(req.params.entityType);
      const input = retentionPolicyInputSchema.parse(req.body);
      const session = res.locals.session as Session;
      await getDatabase()
        .insertInto("retention_policies")
        .values({
          entity_type: entityType,
          retention_days: input.retentionDays,
          anonymize_after_expiry: input.anonymizeAfterExpiry,
          legal_basis: input.legalBasis,
          updated_by: session.id,
          updated_at: new Date(),
        })
        .onConflict((oc) =>
          oc
            .column("entity_type")
            .doUpdateSet({
              retention_days: input.retentionDays,
              anonymize_after_expiry: input.anonymizeAfterExpiry,
              legal_basis: input.legalBasis,
              updated_by: session.id,
              updated_at: new Date(),
            }),
        )
        .execute();
      await audit(req, "UPSERT", "retention_policy", entityType, null, {
        retentionDays: input.retentionDays,
        anonymizeAfterExpiry: input.anonymizeAfterExpiry,
      });
      res.status(204).end();
    }),
  );
  return router;
};
