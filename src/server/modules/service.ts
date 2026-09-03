import crypto from "node:crypto";
import { sql } from "kysely";
import {
  authorizedModuleDtoSchema,
  moduleCreateSchema,
  moduleDtoSchema,
  moduleListResponseSchema,
  moduleMemberCreateSchema,
  moduleMemberDtoSchema,
  moduleMemberUpdateSchema,
  moduleQuerySchema,
  moduleTeamDtoSchema,
  moduleUpdateSchema,
} from "../../contracts/index.js";
import { getDatabase } from "../database.js";
import {
  activeModuleAdminCount,
  findMembership,
  findModule,
  moduleCounts,
  type ModuleRow,
} from "./repository.js";
import { isAuthorized } from "../authorization/policy.js";

export type ModuleSession = { id: string; role?: string; sid?: string };
const fail = (status: number, message: string): never => {
  throw Object.assign(new Error(message), { status });
};
const isGlobalAdmin = (session: ModuleSession) => session.role === "admin";
const overrides = async (session: ModuleSession) => {
  const rows = await getDatabase()
    .selectFrom("user_permissions")
    .select(["permission", "effect"])
    .where("user_id", "=", session.id)
    .execute();
  return {
    grants: rows
      .filter((item) => item.effect === "allow")
      .map((item) => item.permission),
    revocations: rows
      .filter((item) => item.effect === "deny")
      .map((item) => item.permission),
  };
};
const assertGlobalAdmin = async (
  session: ModuleSession,
  permission: "modules:read" | "modules:create",
) => {
  const custom = await overrides(session);
  if (
    !isAuthorized({
      permission,
      scope: "global",
      globalRole: session.role || "colaborador",
      ...custom,
    })
  )
    fail(
      403,
      "Apenas administradores globais podem administrar todos os módulos.",
    );
};

const dto = async (row: ModuleRow) =>
  moduleDtoSchema.parse({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    icon: row.icon_key,
    color: row.color,
    active: row.active,
    createdBy: row.created_by,
    version: row.version,
    deletedAt: row.deleted_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    counts: await moduleCounts(getDatabase(), row.id),
  });

const assertModuleAdmin = async (
  session: ModuleSession,
  moduleId: string,
  permission: "modules:update" | "modules:members" = "modules:members",
) => {
  const membership = await findMembership(getDatabase(), moduleId, session.id);
  const module = await findModule(getDatabase(), moduleId);
  const custom = await overrides(session);
  if (
    !isAuthorized({
      permission,
      scope: "module",
      globalRole: session.role || "colaborador",
      moduleRole: membership?.role,
      moduleActive: Boolean(module?.active && !module.deleted_at),
      membershipActive: Boolean(membership?.active),
      ...custom,
    })
  )
    fail(403, "Você não possui permissão para administrar este módulo.");
};

const audit = async (
  moduleId: string,
  session: ModuleSession,
  action: string,
  entityType: string,
  entityId: string,
  before: unknown,
  after: unknown,
) =>
  getDatabase()
    .insertInto("audit_logs")
    .values({
      id: crypto.randomUUID(),
      module_id: moduleId,
      actor_id: session.id,
      session_id: session.sid ?? null,
      ip_address: null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      before_data: before,
      after_data: after,
      created_at: new Date(),
    })
    .execute();

export const modulesService = {
  async listAdmin(session: ModuleSession, rawQuery: unknown) {
    await assertGlobalAdmin(session, "modules:read");
    const query = moduleQuerySchema.parse(rawQuery);
    const db = getDatabase();
    let base = db
      .selectFrom("operational_modules")
      .selectAll()
      .where("deleted_at", "is", null);
    let countQuery = db
      .selectFrom("operational_modules")
      .select(({ fn }) => fn.countAll<number>().as("count"))
      .where("deleted_at", "is", null);
    if (query.search) {
      base = base.where((eb) =>
        eb.or([
          eb("name", "ilike", `%${query.search}%`),
          eb("slug", "ilike", `%${query.search}%`),
        ]),
      );
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb("name", "ilike", `%${query.search}%`),
          eb("slug", "ilike", `%${query.search}%`),
        ]),
      );
    }
    if (query.active !== undefined) {
      base = base.where("active", "=", query.active);
      countQuery = countQuery.where("active", "=", query.active);
    }
    const total = Number((await countQuery.executeTakeFirstOrThrow()).count);
    const column =
      query.sort === "createdAt"
        ? "created_at"
        : query.sort === "updatedAt"
          ? "updated_at"
          : "name";
    const rows = await base
      .orderBy(column, query.direction)
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize)
      .execute();
    return moduleListResponseSchema.parse({
      items: await Promise.all(rows.map(dto)),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    });
  },
  async listAuthorized(session: ModuleSession) {
    const rows = await getDatabase()
      .selectFrom("module_members")
      .innerJoin(
        "operational_modules",
        "operational_modules.id",
        "module_members.module_id",
      )
      .select([
        "operational_modules.id",
        "operational_modules.name",
        "operational_modules.slug",
        "operational_modules.description",
        "operational_modules.icon_key",
        "operational_modules.color",
        "operational_modules.active",
        "operational_modules.created_by",
        "operational_modules.version",
        "operational_modules.deleted_at",
        "operational_modules.created_at",
        "operational_modules.updated_at",
        "module_members.role",
      ])
      .where("module_members.user_id", "=", session.id)
      .where("module_members.active", "=", true)
      .where("operational_modules.active", "=", true)
      .where("operational_modules.deleted_at", "is", null)
      .orderBy("operational_modules.name")
      .execute();
    return Promise.all(
      rows.map(async (row) =>
        authorizedModuleDtoSchema.parse({
          ...(await dto(row)),
          role: row.role,
        }),
      ),
    );
  },
  async get(session: ModuleSession, moduleId: string) {
    const row = await findModule(getDatabase(), moduleId);
    if (!row) fail(404, "Módulo não encontrado.");
    if (!isGlobalAdmin(session)) {
      const membership = await findMembership(
        getDatabase(),
        moduleId,
        session.id,
      );
      if (!membership?.active) fail(404, "Módulo não encontrado.");
    }
    return dto(row);
  },
  async create(session: ModuleSession, raw: unknown) {
    await assertGlobalAdmin(session, "modules:create");
    const input = moduleCreateSchema.parse(raw);
    const db = getDatabase();
    const id = `mod-${crypto.randomUUID()}`;
    const now = new Date();
    await db.transaction().execute(async (trx) => {
      await trx
        .insertInto("operational_modules")
        .values({
          id,
          name: input.name,
          slug: input.slug,
          description: input.description,
          icon_key: input.icon,
          color: input.color,
          active: true,
          created_by: session.id,
          version: 1,
          deleted_at: null,
          created_at: now,
          updated_at: now,
        })
        .execute();
      await trx
        .insertInto("module_members")
        .values({
          module_id: id,
          user_id: session.id,
          role: "module_admin",
          active: true,
          created_by: session.id,
          created_at: now,
          updated_at: now,
        })
        .execute();
      const configurations = await trx
        .selectFrom("module_configurations")
        .select(["key", "value"])
        .where("module_id", "=", "mod-default")
        .execute();
      if (configurations.length)
        await trx
          .insertInto("module_configurations")
          .values(
            configurations.map((item) => ({
              module_id: id,
              key: item.key,
              value: sql<unknown>`${JSON.stringify(item.value)}::jsonb`,
              updated_by: session.id,
              updated_at: now,
            })),
          )
          .execute();
      await trx
        .insertInto("audit_logs")
        .values({
          id: crypto.randomUUID(),
          module_id: id,
          actor_id: session.id,
          session_id: session.sid ?? null,
          ip_address: null,
          action: "CREATE",
          entity_type: "module",
          entity_id: id,
          before_data: null,
          after_data: { name: input.name, slug: input.slug },
          created_at: now,
        })
        .execute();
    });
    const created = await findModule(db, id);
    if (!created) fail(500, "Falha ao carregar o módulo criado.");
    return dto(created);
  },
  async update(session: ModuleSession, moduleId: string, raw: unknown) {
    await assertModuleAdmin(session, moduleId, "modules:update");
    const input = moduleUpdateSchema.parse(raw);
    const db = getDatabase();
    const before = await findModule(db, moduleId);
    if (!before) fail(404, "Módulo não encontrado.");
    const updated = await db
      .updateTable("operational_modules")
      .set({
        name: input.name ?? before.name,
        slug: input.slug ?? before.slug,
        description: input.description ?? before.description,
        icon_key: input.icon ?? before.icon_key,
        color: input.color ?? before.color,
        active: input.active ?? before.active,
        version: before.version + 1,
        updated_at: new Date(),
      })
      .where("id", "=", moduleId)
      .where("version", "=", input.version)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
    if (!updated)
      fail(
        409,
        "O módulo foi alterado por outro usuário. Recarregue os dados.",
      );
    await audit(
      moduleId,
      session,
      "UPDATE",
      "module",
      moduleId,
      { version: before.version },
      { version: updated.version, fields: Object.keys(input) },
    );
    return dto(updated);
  },
  async remove(session: ModuleSession, moduleId: string, version: number) {
    await assertModuleAdmin(session, moduleId, "modules:update");
    const db = getDatabase();
    const before = await findModule(db, moduleId);
    if (!before) fail(404, "Módulo não encontrado.");
    const now = new Date();
    const removed = await db
      .updateTable("operational_modules")
      .set({
        active: false,
        deleted_at: now,
        version: before.version + 1,
        updated_at: now,
      })
      .where("id", "=", moduleId)
      .where("version", "=", version)
      .where("deleted_at", "is", null)
      .returning("id")
      .executeTakeFirst();
    if (!removed)
      fail(
        409,
        "O módulo foi alterado por outro usuário. Recarregue os dados.",
      );
    await audit(
      moduleId,
      session,
      "DELETE",
      "module",
      moduleId,
      { version: before.version },
      { deletedAt: now.toISOString() },
    );
  },
  async members(session: ModuleSession, moduleId: string) {
    await assertModuleAdmin(session, moduleId);
    if (!(await findModule(getDatabase(), moduleId)))
      fail(404, "Módulo não encontrado.");
    const rows = await getDatabase()
      .selectFrom("module_members")
      .innerJoin("users", "users.id", "module_members.user_id")
      .select([
        "module_members.module_id",
        "module_members.user_id",
        "module_members.role",
        "module_members.active",
        "module_members.created_by",
        "module_members.created_at",
        "module_members.updated_at",
        "users.name",
        "users.email",
      ])
      .where("module_members.module_id", "=", moduleId)
      .orderBy("users.name")
      .execute();
    return rows.map((row) =>
      moduleMemberDtoSchema.parse({
        moduleId: row.module_id,
        userId: row.user_id,
        userName: row.name,
        userEmail: row.email,
        role: row.role,
        active: row.active,
        createdBy: row.created_by,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
      }),
    );
  },
  async addMember(session: ModuleSession, moduleId: string, raw: unknown) {
    await assertModuleAdmin(session, moduleId);
    const input = moduleMemberCreateSchema.parse(raw);
    const db = getDatabase();
    const user = await db
      .selectFrom("users")
      .select(["id", "active", "deleted_at"])
      .where("id", "=", input.userId)
      .executeTakeFirst();
    if (!user?.active || user.deleted_at)
      fail(409, "O usuário não existe ou está inativo.");
    const now = new Date();
    await db
      .insertInto("module_members")
      .values({
        module_id: moduleId,
        user_id: input.userId,
        role: input.role,
        active: true,
        created_by: session.id,
        created_at: now,
        updated_at: now,
      })
      .onConflict((oc) =>
        oc
          .columns(["module_id", "user_id"])
          .doUpdateSet({ role: input.role, active: true, updated_at: now }),
      )
      .execute();
    await audit(
      moduleId,
      session,
      "UPSERT",
      "module_member",
      input.userId,
      null,
      { role: input.role },
    );
    return (await this.members(session, moduleId)).find(
      (item) => item.userId === input.userId,
    )!;
  },
  async updateMember(
    session: ModuleSession,
    moduleId: string,
    userId: string,
    raw: unknown,
  ) {
    await assertModuleAdmin(session, moduleId);
    const input = moduleMemberUpdateSchema.parse(raw);
    const db = getDatabase();
    const before = await findMembership(db, moduleId, userId);
    if (!before) fail(404, "Vínculo não encontrado.");
    if (
      before.active &&
      before.role === "module_admin" &&
      (input.active === false ||
        (input.role && input.role !== "module_admin")) &&
      (await activeModuleAdminCount(db, moduleId)) <= 1
    )
      fail(409, "O módulo deve manter ao menos um administrador ativo.");
    await db
      .updateTable("module_members")
      .set({
        role: input.role ?? before.role,
        active: input.active ?? before.active,
        updated_at: new Date(),
      })
      .where("module_id", "=", moduleId)
      .where("user_id", "=", userId)
      .execute();
    await audit(
      moduleId,
      session,
      "UPDATE",
      "module_member",
      userId,
      { role: before.role, active: before.active },
      input,
    );
    return (await this.members(session, moduleId)).find(
      (item) => item.userId === userId,
    )!;
  },
  async removeMember(session: ModuleSession, moduleId: string, userId: string) {
    return this.updateMember(session, moduleId, userId, { active: false });
  },
  async teams(session: ModuleSession, moduleId: string) {
    await assertModuleAdmin(session, moduleId);
    const rows = await getDatabase()
      .selectFrom("team_modules")
      .innerJoin("teams", "teams.id", "team_modules.team_id")
      .select([
        "team_modules.module_id",
        "team_modules.team_id",
        "team_modules.created_by",
        "team_modules.created_at",
        "teams.name",
      ])
      .where("team_modules.module_id", "=", moduleId)
      .orderBy("teams.name")
      .execute();
    return rows.map((row) =>
      moduleTeamDtoSchema.parse({
        moduleId: row.module_id,
        teamId: row.team_id,
        teamName: row.name,
        createdBy: row.created_by,
        createdAt: row.created_at.toISOString(),
      }),
    );
  },
  async addTeam(session: ModuleSession, moduleId: string, teamId: string) {
    await assertModuleAdmin(session, moduleId);
    const team = await getDatabase()
      .selectFrom("teams")
      .select(["id", "active", "deleted_at"])
      .where("id", "=", teamId)
      .executeTakeFirst();
    if (!team?.active || team.deleted_at)
      fail(409, "A equipe não existe ou está inativa.");
    await getDatabase()
      .insertInto("team_modules")
      .values({
        module_id: moduleId,
        team_id: teamId,
        created_by: session.id,
        created_at: new Date(),
      })
      .execute();
    await audit(moduleId, session, "CREATE", "module_team", teamId, null, {});
    return (await this.teams(session, moduleId)).find(
      (item) => item.teamId === teamId,
    )!;
  },
  async removeTeam(session: ModuleSession, moduleId: string, teamId: string) {
    await assertModuleAdmin(session, moduleId);
    const result = await getDatabase()
      .deleteFrom("team_modules")
      .where("module_id", "=", moduleId)
      .where("team_id", "=", teamId)
      .executeTakeFirst();
    if (Number(result.numDeletedRows) === 0)
      fail(404, "Vínculo de equipe não encontrado.");
    await audit(moduleId, session, "DELETE", "module_team", teamId, null, {});
  },
};
