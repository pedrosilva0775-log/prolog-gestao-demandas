import crypto from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import {
  auditListResponseSchema,
  blockerResponseSchema,
  commentDtoSchema,
  completeDemandResponseSchema,
  privacyRequestDtoSchema,
  privacyRequestListSchema,
  publicUserDtoSchema,
  sessionListResponseSchema,
  teamDtoSchema,
} from "../contracts/index.js";
import { createApp } from "./app.js";
import { closeDatabase, getDatabase } from "./database.js";
import { hashPassword } from "./password.js";

const run = process.env.RUN_DB_TESTS === "true";
const adminId = `contract-admin-${crypto.randomUUID()}`;
const workerId = `contract-worker-${crypto.randomUUID()}`;
const teamName = `Equipe Contratos ${crypto.randomUUID()}`;
const relatedTeamName = `Equipe Relacionada ${crypto.randomUUID()}`;
const csrf = async (agent: ReturnType<typeof request.agent>) => {
  const response = await agent.get("/api/auth/config").expect(200);
  const raw = String(
    response.headers["set-cookie"]?.[0] || response.headers["set-cookie"] || "",
  );
  return decodeURIComponent(raw.match(/prolog_csrf=([^;]+)/)?.[1] || "");
};
const authenticated = async (app: Express) => {
  const agent = request.agent(app);
  const token = await csrf(agent);
  await agent
    .post("/api/auth/login")
    .set("X-CSRF-Token", token)
    .send({ email: `${adminId}@test.local`, password: "Admin123" })
    .expect(200);
  return { agent, token };
};

describe.skipIf(!run)("contratos mutáveis PostgreSQL", () => {
  let app: Express;
  beforeAll(async () => {
    const db = getDatabase();
    const now = new Date();
    const security = {
      deleted_at: null,
      password_changed_at: null,
      mfa_enabled: false,
      mfa_secret_encrypted: null,
      failed_mfa_attempts: 0,
      locked_until: null,
    };
    await db
      .insertInto("users")
      .values([
        {
          id: adminId,
          email: `${adminId}@test.local`,
          name: "Admin Contratos",
          password_hash: hashPassword("Admin123"),
          role: "admin",
          role_title: "Admin",
          department: "Teste",
          branch: null,
          phone: null,
          avatar: null,
          active: true,
          force_password_change: false,
          ...security,
          created_at: now,
          updated_at: now,
        },
        {
          id: workerId,
          email: `${workerId}@test.local`,
          name: "Worker Contratos",
          password_hash: hashPassword("Worker123"),
          role: "colaborador",
          role_title: "Analista",
          department: "Teste",
          branch: null,
          phone: null,
          avatar: null,
          active: true,
          force_password_change: false,
          ...security,
          created_at: now,
          updated_at: now,
        },
      ])
      .execute();
    app = await createApp();
  });
  afterAll(async () => {
    const db = getDatabase();
    await db
      .deleteFrom("auth_sessions")
      .where("user_id", "in", [adminId, workerId])
      .execute();
    await db
      .deleteFrom("demands")
      .where("requester_id", "in", [adminId, workerId])
      .execute();
    await db
      .deleteFrom("module_members")
      .where("user_id", "in", [adminId, workerId])
      .execute();
    await db
      .deleteFrom("team_modules")
      .where(
        "team_id",
        "in",
        db
          .selectFrom("teams")
          .select("id")
          .where("name", "in", [teamName, relatedTeamName]),
      )
      .execute();
    await db
      .deleteFrom("teams")
      .where("name", "in", [teamName, relatedTeamName])
      .execute();
    await db
      .deleteFrom("users")
      .where("id", "in", [adminId, workerId])
      .execute();
    await closeDatabase();
  });

  it("mantém módulo padrão e nenhuma demanda órfã após a migration", async () => {
    const db = getDatabase();
    const defaultModule = await db
      .selectFrom("operational_modules")
      .select(["id", "slug", "active"])
      .where("id", "=", "mod-default")
      .executeTakeFirstOrThrow();
    expect(defaultModule).toEqual({
      id: "mod-default",
      slug: "operacoes",
      active: true,
    });
    const orphan = await db
      .selectFrom("demands")
      .leftJoin(
        "operational_modules",
        "operational_modules.id",
        "demands.module_id",
      )
      .select("demands.id")
      .where("operational_modules.id", "is", null)
      .execute();
    expect(orphan).toHaveLength(0);
  });

  it("administra módulos, vínculos, concorrência e isolamento contra IDOR", async () => {
    const { agent, token } = await authenticated(app);
    const suffix = crypto.randomUUID().slice(0, 8);
    const created = await agent
      .post("/api/v1/modules")
      .set("X-CSRF-Token", token)
      .send({
        name: `Tecnologia ${suffix}`,
        slug: `tecnologia-${suffix}`,
        description: "Módulo de tecnologia",
        icon: "Code2",
        color: "#2563eb",
      })
      .expect(201);
    expect(created.body).toMatchObject({
      slug: `tecnologia-${suffix}`,
      version: 1,
      active: true,
    });
    await agent
      .post("/api/v1/modules")
      .set("X-CSRF-Token", token)
      .send({ name: "Duplicado", slug: `tecnologia-${suffix}` })
      .expect(409);
    await agent
      .delete(`/api/v1/modules/${created.body.id}/members/${adminId}`)
      .set("X-CSRF-Token", token)
      .expect(409);
    const isolated = await agent
      .post("/api/v1/modules")
      .set("X-CSRF-Token", token)
      .send({
        name: `Transporte ${suffix}`,
        slug: `transporte-${suffix}`,
        description: "Módulo de transporte",
        icon: "Truck",
        color: "#0f766e",
      })
      .expect(201);
    const member = await agent
      .post(`/api/v1/modules/${created.body.id}/members`)
      .set("X-CSRF-Token", token)
      .send({ userId: workerId, role: "viewer" })
      .expect(201);
    expect(member.body).toMatchObject({
      userId: workerId,
      role: "viewer",
      active: true,
    });
    const worker = request.agent(app);
    const workerToken = await csrf(worker);
    await worker
      .post("/api/auth/login")
      .set("X-CSRF-Token", workerToken)
      .send({ email: `${workerId}@test.local`, password: "Worker123" })
      .expect(200);
    const authorized = await worker.get("/api/v1/me/modules").expect(200);
    expect(authorized.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: created.body.id, role: "viewer" }),
      ]),
    );
    await worker.get(`/api/v1/modules/${created.body.id}`).expect(200);
    await worker.get(`/api/v1/modules/${isolated.body.id}`).expect(404);
    await worker
      .patch(`/api/v1/modules/${created.body.id}`)
      .set("X-CSRF-Token", workerToken)
      .send({ name: "Invasão", version: 1 })
      .expect(403);
    await agent
      .patch(`/api/v1/modules/${created.body.id}`)
      .set("X-CSRF-Token", token)
      .send({ name: "Versão obsoleta", version: 99 })
      .expect(409);
    const updated = await agent
      .patch(`/api/v1/modules/${created.body.id}`)
      .set("X-CSRF-Token", token)
      .send({ name: `Tecnologia Atualizada ${suffix}`, version: 1 })
      .expect(200);
    expect(updated.body.version).toBe(2);
    const inactive = await agent
      .patch(`/api/v1/modules/${created.body.id}`)
      .set("X-CSRF-Token", token)
      .send({ active: false, version: 2 })
      .expect(200);
    const reactivated = await agent
      .patch(`/api/v1/modules/${created.body.id}`)
      .set("X-CSRF-Token", token)
      .send({ active: true, version: inactive.body.version })
      .expect(200);
    await agent
      .delete(
        `/api/v1/modules/${created.body.id}?version=${reactivated.body.version}`,
      )
      .set("X-CSRF-Token", token)
      .expect(204);
    await agent
      .delete(
        `/api/v1/modules/${isolated.body.id}?version=${isolated.body.version}`,
      )
      .set("X-CSRF-Token", token)
      .expect(204);
    const audited = await getDatabase()
      .selectFrom("audit_logs")
      .select("id")
      .where("module_id", "=", created.body.id)
      .where("entity_type", "=", "module")
      .execute();
    expect(audited.length).toBeGreaterThan(0);
  });

  it("isola demandas por módulo e impede IDOR por identificador conhecido", async () => {
    const { agent, token } = await authenticated(app);
    const suffix = crypto.randomUUID().slice(0, 8);
    const technology = await agent
      .post("/api/v1/modules")
      .set("X-CSRF-Token", token)
      .send({
        name: `Tecnologia Isolada ${suffix}`,
        slug: `tecnologia-isolada-${suffix}`,
      })
      .expect(201);
    const transport = await agent
      .post("/api/v1/modules")
      .set("X-CSRF-Token", token)
      .send({
        name: `Transporte Isolado ${suffix}`,
        slug: `transporte-isolado-${suffix}`,
      })
      .expect(201);
    await agent
      .post(`/api/v1/modules/${technology.body.id}/members`)
      .set("X-CSRF-Token", token)
      .send({ userId: workerId, role: "member" })
      .expect(201);
    const base = {
      description: "",
      statusId: "nova",
      priorityId: "normal",
      categoryId: "tarefa",
    };
    const technologyDemand = await agent
      .post(`/api/v1/modules/${technology.body.id}/demands`)
      .set("X-CSRF-Token", token)
      .send({ ...base, title: "Demanda Tecnologia" })
      .expect(201);
    const transportDemand = await agent
      .post(`/api/v1/modules/${transport.body.id}/demands`)
      .set("X-CSRF-Token", token)
      .send({ ...base, title: "Demanda Transporte" })
      .expect(201);
    expect(technologyDemand.body.moduleId).toBe(technology.body.id);
    expect(transportDemand.body.moduleId).toBe(transport.body.id);
    const technologyList = await agent
      .get(`/api/v1/modules/${technology.body.id}/demands`)
      .expect(200);
    expect(
      technologyList.body.items.map((item: { id: string }) => item.id),
    ).toContain(technologyDemand.body.id);
    expect(
      technologyList.body.items.map((item: { id: string }) => item.id),
    ).not.toContain(transportDemand.body.id);
    expect(technologyList.body.pagination.total).toBe(1);
    const worker = request.agent(app);
    const workerToken = await csrf(worker);
    await worker
      .post("/api/auth/login")
      .set("X-CSRF-Token", workerToken)
      .send({ email: `${workerId}@test.local`, password: "Worker123" })
      .expect(200);
    await worker
      .get(`/api/v1/modules/${transport.body.id}/demands`)
      .expect(404);
    await worker
      .patch(
        `/api/v1/modules/${technology.body.id}/demands/${transportDemand.body.id}`,
      )
      .set("X-CSRF-Token", workerToken)
      .send({
        version: transportDemand.body.version,
        title: "Tentativa cruzada",
      })
      .expect(404);
    await worker
      .post(
        `/api/v1/modules/${technology.body.id}/demands/${transportDemand.body.id}/comments`,
      )
      .set("X-CSRF-Token", workerToken)
      .send({
        version: transportDemand.body.version,
        content: "Tentativa cruzada",
        attachments: [],
      })
      .expect(404);
    const persisted = await getDatabase()
      .selectFrom("demands")
      .select(["title", "module_id"])
      .where("id", "=", transportDemand.body.id)
      .executeTakeFirstOrThrow();
    expect(persisted).toEqual({
      title: "Demanda Transporte",
      module_id: transport.body.id,
    });
    const updated = await agent
      .patch(
        `/api/v1/modules/${technology.body.id}/demands/${technologyDemand.body.id}`,
      )
      .set("X-CSRF-Token", token)
      .send({
        version: technologyDemand.body.version,
        title: "Tecnologia Atualizada",
      })
      .expect(200);
    const staleUpdate = await agent
      .patch(
        `/api/v1/modules/${technology.body.id}/demands/${technologyDemand.body.id}`,
      )
      .set("X-CSRF-Token", token)
      .send({
        version: technologyDemand.body.version,
        title: "Sobrescrita obsoleta",
      })
      .expect(409);
    expect(staleUpdate.body).toMatchObject({ code: "CONFLICT" });
    await agent
      .delete(
        `/api/v1/modules/${technology.body.id}/demands/${technologyDemand.body.id}?version=${technologyDemand.body.version}`,
      )
      .set("X-CSRF-Token", token)
      .expect(409);
    await agent
      .delete(
        `/api/v1/modules/${technology.body.id}/demands/${technologyDemand.body.id}?version=${updated.body.version}`,
      )
      .set("X-CSRF-Token", token)
      .expect(204);
    expect(
      (
        await getDatabase()
          .selectFrom("demands")
          .select("deleted_at")
          .where("id", "=", technologyDemand.body.id)
          .executeTakeFirstOrThrow()
      ).deleted_at,
    ).toBeInstanceOf(Date);
  });

  it("cria e atualiza equipe com DTO completo, versão e membros persistidos", async () => {
    const { agent, token } = await authenticated(app);
    const created = await agent
      .post("/api/v1/teams")
      .set("X-CSRF-Token", token)
      .send({
        name: teamName,
        description: "Teste",
        department: "TI",
        leaderId: workerId,
        color: "#2563eb",
        active: true,
        memberIds: [workerId],
      })
      .expect(201);
    expect(teamDtoSchema.safeParse(created.body).success).toBe(true);
    expect(created.body).toMatchObject({ version: 1, memberIds: [workerId] });
    expect(created.body.createdAt).toBeTruthy();
    expect(created.body.updatedAt).toBeTruthy();
    const preserved = await agent
      .patch(`/api/v1/teams/${created.body.id}`)
      .set("X-CSRF-Token", token)
      .send({ description: "Atualizada" })
      .expect(200);
    expect(teamDtoSchema.safeParse(preserved.body).success).toBe(true);
    expect(preserved.body).toMatchObject({ version: 2, memberIds: [workerId] });
    const replaced = await agent
      .patch(`/api/v1/teams/${created.body.id}`)
      .set("X-CSRF-Token", token)
      .send({ memberIds: [], leaderId: null })
      .expect(200);
    expect(teamDtoSchema.safeParse(replaced.body).success).toBe(true);
    expect(replaced.body).toMatchObject({ version: 3, memberIds: [] });
  });

  it("bloqueia, cria demanda relacionada, conclui e desbloqueia automaticamente com DTOs canônicos", async () => {
    const { agent, token } = await authenticated(app);
    const team = await agent
      .post("/api/v1/teams")
      .set("X-CSRF-Token", token)
      .send({
        name: relatedTeamName,
        description: "",
        department: "TI",
        leaderId: workerId,
        color: "#2563eb",
        active: true,
        memberIds: [workerId],
      })
      .expect(201);
    const source = await agent
      .post("/api/v1/demands")
      .set("X-CSRF-Token", token)
      .send({
        title: "Demanda principal",
        description: "",
        statusId: "status-nova",
        priorityId: "normal",
        categoryId: "tarefa",
      })
      .expect(201);
    const blocked = await agent
      .put(`/api/v1/demands/${source.body.id}/blocker`)
      .set("X-CSRF-Token", token)
      .send({
        version: source.body.version,
        isBlocked: true,
        kind: "blocker",
        reason: "Dependência externa",
        createRelatedTask: true,
        responsibleTeamId: team.body.id,
      })
      .expect(200);
    expect(blockerResponseSchema.safeParse(blocked.body).success).toBe(true);
    expect(blocked.body.demand.version).toBe(source.body.version + 1);
    expect(blocked.body.createdDemand.version).toBe(1);
    expect(blocked.body.demand.blocker.linkedDemandId).toBe(
      blocked.body.createdDemand.id,
    );
    const persisted = await getDatabase()
      .selectFrom("demands")
      .select(["version", "payload"])
      .where("id", "=", source.body.id)
      .executeTakeFirstOrThrow();
    expect(persisted.version).toBe(blocked.body.demand.version);
    expect((persisted.payload as Record<string, unknown>).blocker).toEqual(
      expect.objectContaining({
        isBlocked: true,
        linkedDemandId: blocked.body.createdDemand.id,
      }),
    );
    const completed = await agent
      .post(`/api/v1/demands/${blocked.body.createdDemand.id}/complete`)
      .set("X-CSRF-Token", token)
      .send({
        statusId: "status-concluida",
        summary: "Resolvida",
        version: blocked.body.createdDemand.version,
        override: { justification: "Conclusão administrativa do teste" },
      })
      .expect(200);
    expect(completeDemandResponseSchema.safeParse(completed.body).success).toBe(
      true,
    );
    expect(completed.body.demand.version).toBe(2);
    expect(completed.body.autoUnblocked).toHaveLength(1);
    expect(completed.body.autoUnblocked[0]).toMatchObject({
      id: source.body.id,
      version: blocked.body.demand.version + 1,
      blocker: { isBlocked: false },
    });
  });

  it("desbloqueia diretamente e incrementa a versão", async () => {
    const { agent, token } = await authenticated(app);
    const source = await agent
      .post("/api/v1/demands")
      .set("X-CSRF-Token", token)
      .send({
        title: "Demanda desbloqueio",
        description: "",
        statusId: "nova",
        priorityId: "normal",
        categoryId: "tarefa",
      })
      .expect(201);
    const blocked = await agent
      .put(`/api/v1/demands/${source.body.id}/blocker`)
      .set("X-CSRF-Token", token)
      .send({
        version: source.body.version,
        isBlocked: true,
        kind: "blocker",
        reason: "Aguardando",
      })
      .expect(200);
    await agent
      .put(`/api/v1/demands/${source.body.id}/blocker`)
      .set("X-CSRF-Token", token)
      .send({ version: source.body.version, isBlocked: false })
      .expect(409);
    const unblocked = await agent
      .put(`/api/v1/demands/${source.body.id}/blocker`)
      .set("X-CSRF-Token", token)
      .send({ version: blocked.body.demand.version, isBlocked: false })
      .expect(200);
    expect(blockerResponseSchema.safeParse(unblocked.body).success).toBe(true);
    expect(unblocked.body.demand.version).toBe(blocked.body.demand.version + 1);
    expect(unblocked.body.demand.blocker.isBlocked).toBe(false);
  });

  it("aplica matriz de transição e exige checklist concluído", async () => {
    const { agent, token } = await authenticated(app);
    const created = await agent
      .post("/api/v1/demands")
      .set("X-CSRF-Token", token)
      .send({
        title: "Demanda com governança",
        description: "",
        statusId: "status-nova",
        priorityId: "normal",
        categoryId: "tarefa",
      })
      .expect(201);
    const invalid = await agent
      .patch(`/api/v1/demands/${created.body.id}`)
      .set("X-CSRF-Token", token)
      .send({ version: created.body.version, statusId: "status-concluida" })
      .expect(409);
    expect(invalid.body).toMatchObject({ code: "CONFLICT" });
    const inProgress = await agent
      .patch(`/api/v1/demands/${created.body.id}`)
      .set("X-CSRF-Token", token)
      .send({ version: created.body.version, statusId: "status-andamento" })
      .expect(200);
    const inReview = await agent
      .patch(`/api/v1/demands/${created.body.id}`)
      .set("X-CSRF-Token", token)
      .send({ version: inProgress.body.version, statusId: "status-validacao" })
      .expect(200);
    const incomplete = await agent
      .post(`/api/v1/demands/${created.body.id}/complete`)
      .set("X-CSRF-Token", token)
      .send({
        statusId: "status-concluida",
        summary: "Entrega",
        version: inReview.body.version,
      })
      .expect(409);
    expect(incomplete.body.message).toContain("checklist");
    const checklist = inReview.body.checklist.map(
      (item: { id: string; title: string }) => ({ ...item, completed: true }),
    );
    const ready = await agent
      .patch(`/api/v1/demands/${created.body.id}`)
      .set("X-CSRF-Token", token)
      .send({ version: inReview.body.version, checklist })
      .expect(200);
    const completed = await agent
      .post(`/api/v1/demands/${created.body.id}/complete`)
      .set("X-CSRF-Token", token)
      .send({
        statusId: "status-concluida",
        summary: "Entrega validada",
        version: ready.body.version,
      })
      .expect(200);
    expect(completed.body.demand).toMatchObject({
      statusId: "status-concluida",
      progressPercent: 100,
    });
  });

  it("padroniza validação, recurso inexistente e conflito", async () => {
    const { agent, token } = await authenticated(app);
    const invalid = await agent
      .put("/api/v1/demands/inexistente/blocker")
      .set("X-CSRF-Token", token)
      .send({ version: 1, isBlocked: true })
      .expect(422);
    expect(invalid.body).toMatchObject({ code: "VALIDATION_ERROR" });
    expect(invalid.body.requestId).toBeTruthy();
    expect(invalid.body.fieldErrors.reason).toBeTruthy();
    const missing = await agent
      .post("/api/v1/demands/inexistente/complete")
      .set("X-CSRF-Token", token)
      .send({ statusId: "status-concluida", summary: "Fim", version: 1 })
      .expect(404);
    expect(missing.body).toMatchObject({ code: "NOT_FOUND" });
    expect(missing.body.requestId).toBeTruthy();
    const source = await agent
      .post("/api/v1/demands")
      .set("X-CSRF-Token", token)
      .send({
        title: "Demanda conflito",
        description: "",
        statusId: "status-nova",
        priorityId: "normal",
        categoryId: "tarefa",
      })
      .expect(201);
    const blocked = await agent
      .put(`/api/v1/demands/${source.body.id}/blocker`)
      .set("X-CSRF-Token", token)
      .send({
        version: source.body.version,
        isBlocked: true,
        kind: "blocker",
        reason: "Bloqueada",
      })
      .expect(200);
    const conflict = await agent
      .post(`/api/v1/demands/${source.body.id}/complete`)
      .set("X-CSRF-Token", token)
      .send({
        statusId: "status-concluida",
        summary: "Fim",
        version: blocked.body.demand.version,
      })
      .expect(409);
    expect(conflict.body).toMatchObject({ code: "CONFLICT" });
    expect(conflict.body.requestId).toBeTruthy();
  });
  it("atualiza usuário público preservando e substituindo equipes", async () => {
    const { agent, token } = await authenticated(app);
    const team = await agent
      .post("/api/v1/teams")
      .set("X-CSRF-Token", token)
      .send({
        name: `Equipe Usuário ${crypto.randomUUID()}`,
        description: "",
        department: "TI",
        color: "#2563eb",
        active: true,
        memberIds: [],
      })
      .expect(201);
    const assigned = await agent
      .patch(`/api/v1/users/${workerId}`)
      .set("X-CSRF-Token", token)
      .send({
        teamIds: [team.body.id],
        customPermissions: { granted: ["reports:export"], revoked: [] },
      })
      .expect(200);
    expect(publicUserDtoSchema.safeParse(assigned.body).success).toBe(true);
    expect(assigned.body).not.toHaveProperty("password_hash");
    const preserved = await agent
      .patch(`/api/v1/users/${workerId}`)
      .set("X-CSRF-Token", token)
      .send({ name: "Worker Atualizado" })
      .expect(200);
    expect(preserved.body.teamIds).toEqual([team.body.id]);
    const replaced = await agent
      .patch(`/api/v1/users/${workerId}`)
      .set("X-CSRF-Token", token)
      .send({ teamIds: [] })
      .expect(200);
    expect(replaced.body.teamIds).toEqual([]);
    await agent
      .patch(`/api/v1/users/${workerId}`)
      .set("X-CSRF-Token", token)
      .send({ password_hash: "segredo" })
      .expect(422);
  });

  it("lista sessões e auditoria canônicas e revoga sessão", async () => {
    const { agent, token } = await authenticated(app);
    expect(
      sessionListResponseSchema.safeParse(
        (await agent.get("/api/v1/sessions").expect(200)).body,
      ).success,
    ).toBe(true);
    const extraId = crypto.randomUUID();
    await getDatabase()
      .insertInto("auth_sessions")
      .values({
        id: extraId,
        user_id: adminId,
        expires_at: new Date(Date.now() + 60000),
        revoked_at: null,
        ip_address: null,
        user_agent: "Teste",
        created_at: new Date(),
        last_seen_at: new Date(),
      })
      .execute();
    await agent
      .delete(`/api/v1/sessions/${extraId}`)
      .set("X-CSRF-Token", token)
      .expect(204);
    expect(
      (
        await getDatabase()
          .selectFrom("auth_sessions")
          .select("revoked_at")
          .where("id", "=", extraId)
          .executeTakeFirstOrThrow()
      ).revoked_at,
    ).toBeInstanceOf(Date);
    expect(
      auditListResponseSchema.safeParse(
        (await agent.get("/api/v1/audit-logs?limit=10").expect(200)).body,
      ).success,
    ).toBe(true);
  });

  it("valida comentários e controla JSONB corrompido", async () => {
    const { agent, token } = await authenticated(app);
    const demand = await agent
      .post("/api/v1/demands")
      .set("X-CSRF-Token", token)
      .send({
        title: "Demanda comentários",
        description: "",
        statusId: "nova",
        priorityId: "normal",
        categoryId: "tarefa",
      })
      .expect(201);
    const created = await agent
      .post(`/api/v1/demands/${demand.body.id}/comments`)
      .set("X-CSRF-Token", token)
      .send({
        version: demand.body.version,
        content: "Comentário",
        attachments: [],
      })
      .expect(201);
    expect(commentDtoSchema.safeParse(created.body.comment).success).toBe(true);
    await agent
      .post(`/api/v1/demands/${demand.body.id}/comments`)
      .set("X-CSRF-Token", token)
      .send({
        version: demand.body.version,
        content: "Obsoleto",
        attachments: [],
      })
      .expect(409);
    expect(
      commentDtoSchema.safeParse(
        (
          await agent
            .patch(
              `/api/v1/demands/${demand.body.id}/comments/${created.body.comment.id}`,
            )
            .set("X-CSRF-Token", token)
            .send({ version: created.body.demandVersion, content: "Editado" })
            .expect(200)
        ).body.comment,
      ).success,
    ).toBe(true);
    const row = await getDatabase()
      .selectFrom("demands")
      .select("payload")
      .where("id", "=", demand.body.id)
      .executeTakeFirstOrThrow();
    await getDatabase()
      .updateTable("demands")
      .set({
        payload: {
          ...(row.payload as Record<string, unknown>),
          comments: "corrompido",
        },
      })
      .where("id", "=", demand.body.id)
      .execute();
    await agent
      .post(`/api/v1/demands/${demand.body.id}/comments`)
      .set("X-CSRF-Token", token)
      .send({
        version: created.body.demandVersion + 1,
        content: "Outro",
        attachments: [],
      })
      .expect(409);
  });
  it("isola presets e auditoria pelo módulo selecionado", async () => {
    const { agent, token } = await authenticated(app);
    const module = await agent
      .post("/api/v1/modules")
      .set("X-CSRF-Token", token)
      .send({
        name: `Relatórios ${crypto.randomUUID()}`,
        slug: `relatorios-${crypto.randomUUID()}`,
        description: "",
        color: "#2563eb",
      })
      .expect(201);
    const presetName = `Preset ${crypto.randomUUID()}`;
    await agent
      .post(`/api/v1/modules/${module.body.id}/report-presets`)
      .set("X-CSRF-Token", token)
      .send({
        name: presetName,
        configuration: {
          statusIds: [],
          categoryIds: [],
          blocks: ["indicators"],
          kpis: ["total"],
          impedimentStatusIds: [],
          userIds: [],
          clientIds: [],
          teamIds: [],
          priorityIds: [],
          startDate: "",
          endDate: "",
          evolutionSeries: ["created"],
          evolutionMonths: 6,
          autoSummary: true,
          includeRecommendation: true,
          showRisksAndDecisions: false,
          riskItems: [],
          showImpactDeliveries: false,
          impactItems: [],
          showMilestones: false,
          milestoneItems: [],
        },
      })
      .expect(201);
    const scoped = await agent
      .get(`/api/v1/modules/${module.body.id}/report-presets`)
      .expect(200);
    expect(scoped.body.map((item: { name: string }) => item.name)).toContain(
      presetName,
    );
    const legacy = await agent.get("/api/v1/report-presets").expect(200);
    expect(
      legacy.body.map((item: { name: string }) => item.name),
    ).not.toContain(presetName);
    const audits = await agent
      .get(`/api/v1/modules/${module.body.id}/audit-logs?limit=100`)
      .expect(200);
    expect(
      audits.body.some(
        (item: { entity: { type: string } }) =>
          item.entity.type === "report_preset",
      ),
    ).toBe(true);
  });
  it("aplica filtros múltiplos e paginação no servidor", async () => {
    const { agent, token } = await authenticated(app);
    const first = await agent
      .post("/api/v1/demands")
      .set("X-CSRF-Token", token)
      .send({
        title: `Filtro Nova ${crypto.randomUUID()}`,
        description: "marcador-f3",
        statusId: "nova",
        priorityId: "normal",
        categoryId: "tarefa",
      })
      .expect(201);
    const second = await agent
      .post("/api/v1/demands")
      .set("X-CSRF-Token", token)
      .send({
        title: `Filtro Andamento ${crypto.randomUUID()}`,
        description: "marcador-f3",
        statusId: "status-andamento",
        priorityId: "normal",
        categoryId: "tarefa",
      })
      .expect(201);
    const result = await agent
      .get(
        "/api/v1/demands?q=marcador-f3&statusIds=nova,status-andamento&page=1&pageSize=1&sort=title&direction=asc",
      )
      .expect(200);
    expect(result.body.pagination).toMatchObject({
      page: 1,
      pageSize: 1,
      total: 2,
      totalPages: 2,
    });
    expect([first.body.id, second.body.id]).toContain(result.body.items[0].id);
  });

  it("aplica revogação na mesma sessão e omite auditoria do bootstrap", async () => {
    const { agent: admin, token: adminToken } = await authenticated(app);
    const suffix = crypto.randomUUID().slice(0, 8);
    const module = await admin.post("/api/v1/modules").set("X-CSRF-Token", adminToken).send({ name: `Autorização ${suffix}`, slug: `autorizacao-${suffix}` }).expect(201);
    await admin.post(`/api/v1/modules/${module.body.id}/members`).set("X-CSRF-Token", adminToken).send({ userId: workerId, role: "viewer" }).expect(201);
    await admin.patch(`/api/v1/users/${workerId}`).set("X-CSRF-Token", adminToken).send({ customPermissions: { granted: ["demands:edit"], revoked: [] } }).expect(200);
    const demand = await admin.post(`/api/v1/modules/${module.body.id}/demands`).set("X-CSRF-Token", adminToken).send({ title: "Demanda autorização", description: "", statusId: "nova", priorityId: "normal", categoryId: "tarefa" }).expect(201);
    const worker = request.agent(app);
    const workerToken = await csrf(worker);
    await worker.post("/api/auth/login").set("X-CSRF-Token", workerToken).send({ email: `${workerId}@test.local`, password: "Worker123" }).expect(200);
    await worker.get("/api/v1/modules").expect(403);
    const bootstrap = await worker.get(`/api/v1/modules/${module.body.id}/bootstrap`).expect(200);
    expect(bootstrap.body.effectivePermissions).toContain("demands:update");
    expect(bootstrap.body.effectivePermissions).not.toContain("audit:read");
    expect(bootstrap.body.auditLogs).toEqual([]);
    const allowed = await worker.patch(`/api/v1/modules/${module.body.id}/demands/${demand.body.id}`).set("X-CSRF-Token", workerToken).send({ version: demand.body.version, title: "Permitida pelo papel" }).expect(200);
    const isolated = await admin.post("/api/v1/modules").set("X-CSRF-Token", adminToken).send({ name: `Sem vínculo ${suffix}`, slug: `sem-vinculo-${suffix}` }).expect(201);
    await worker.get(`/api/v1/modules/${isolated.body.id}/demands`).expect(404);
    await admin.patch(`/api/v1/users/${workerId}`).set("X-CSRF-Token", adminToken).send({ customPermissions: { granted: [], revoked: ["demands:edit"] } }).expect(200);
    const denied = await worker.patch(`/api/v1/modules/${module.body.id}/demands/${demand.body.id}`).set("X-CSRF-Token", workerToken).send({ version: allowed.body.version, title: "Não deve persistir" }).expect(403);
    expect(denied.body).toMatchObject({ code: "FORBIDDEN" });
    const refreshed = await worker.get(`/api/v1/modules/${module.body.id}/bootstrap`).expect(200);
    expect(refreshed.body.effectivePermissions).not.toContain("demands:update");
    await admin.patch(`/api/v1/users/${workerId}`).set("X-CSRF-Token", adminToken).send({ customPermissions: { granted: [], revoked: [] } }).expect(200);
    await admin.patch(`/api/v1/modules/${module.body.id}/members/${workerId}`).set("X-CSRF-Token", adminToken).send({ role: "member" }).expect(200);
    const adminComment = await admin.post(`/api/v1/modules/${module.body.id}/demands/${demand.body.id}/comments`).set("X-CSRF-Token", adminToken).send({ version: allowed.body.version, content: "Comentário administrativo", attachments: [] }).expect(201);
    const ownComment = await worker.post(`/api/v1/modules/${module.body.id}/demands/${demand.body.id}/comments`).set("X-CSRF-Token", workerToken).send({ version: adminComment.body.demandVersion, content: "Comentário próprio", attachments: [] }).expect(201);
    const ownEdit = await worker.patch(`/api/v1/modules/${module.body.id}/demands/${demand.body.id}/comments/${ownComment.body.comment.id}`).set("X-CSRF-Token", workerToken).send({ version: ownComment.body.demandVersion, content: "Comentário próprio editado" }).expect(200);
    await worker.patch(`/api/v1/modules/${module.body.id}/demands/${demand.body.id}/comments/${adminComment.body.comment.id}`).set("X-CSRF-Token", workerToken).send({ version: ownEdit.body.demandVersion, content: "Tentativa alheia" }).expect(403);
    const attachment = { id: `att-${suffix}`, name: "evidencia.png", size: 68, type: "image/png", url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=" };
    await worker.post(`/api/v1/modules/${module.body.id}/demands/${demand.body.id}/comments`).set("X-CSRF-Token", workerToken).send({ version: ownEdit.body.demandVersion, content: "Anexo negado", attachments: [attachment] }).expect(403);
    await admin.patch(`/api/v1/modules/${module.body.id}/members/${workerId}`).set("X-CSRF-Token", adminToken).send({ role: "manager" }).expect(200);
    await worker.post(`/api/v1/modules/${module.body.id}/demands/${demand.body.id}/comments`).set("X-CSRF-Token", workerToken).send({ version: ownEdit.body.demandVersion, content: "Anexo permitido", attachments: [attachment] }).expect(201);
    await admin.patch(`/api/v1/users/${adminId}`).set("X-CSRF-Token", adminToken).send({ customPermissions: { granted: [], revoked: ["modules:read"] } }).expect(200);
    await admin.get("/api/v1/modules").expect(403);
    await admin.patch(`/api/v1/users/${adminId}`).set("X-CSRF-Token", adminToken).send({ customPermissions: { granted: [], revoked: [] } }).expect(200);
  });

  it("impede que escritas genéricas contornem operações do domínio", async () => {
    const {agent,token}=await authenticated(app);const suffix=crypto.randomUUID().slice(0,8);
    const module=await agent.post("/api/v1/modules").set("X-CSRF-Token",token).send({name:`Fronteira ${suffix}`,slug:`fronteira-${suffix}`}).expect(201);
    const created=await agent.post(`/api/v1/modules/${module.body.id}/demands`).set("X-CSRF-Token",token).send({title:"Fronteira protegida",description:"original",statusId:"nova",priorityId:"normal",categoryId:"tarefa"}).expect(201);
    const forbidden=[{comments:[]},{attachments:[]},{blocker:{isBlocked:true,reason:"bypass"}},{requesterId:workerId},{moduleId:"outro"},{createdAt:new Date().toISOString()},{updatedAt:new Date().toISOString()},{completedAt:new Date().toISOString()},{completedByUserId:adminId},{completionSummary:"falso"}];
    for(const payload of forbidden)await agent.patch(`/api/v1/modules/${module.body.id}/demands/${created.body.id}`).set("X-CSRF-Token",token).send({version:created.body.version,...payload}).expect(422);
    await agent.patch(`/api/v1/modules/${module.body.id}/demands/${created.body.id}`).set("X-CSRF-Token",token).send({version:created.body.version,statusId:"status-concluida"}).expect(422);
    await agent.patch(`/api/v1/modules/${module.body.id}/demands/${created.body.id}`).set("X-CSRF-Token",token).send({version:created.body.version,statusId:"status-andamento",checklist:[]}).expect(422);
    await agent.patch(`/api/v1/modules/${module.body.id}/demands/${created.body.id}`).set("X-CSRF-Token",token).send({version:created.body.version,progressPercent:50}).expect(422);
    await agent.patch(`/api/v1/modules/${module.body.id}/demands/${created.body.id}`).set("X-CSRF-Token",token).send({version:created.body.version,dependencies:[created.body.id]}).expect(422);
    await agent.post(`/api/v1/modules/${module.body.id}/demands`).set("X-CSRF-Token",token).send({title:"Criação falsa",description:"",statusId:"nova",priorityId:"normal",categoryId:"tarefa",id:"forjado",comments:[]}).expect(422);
    await agent.post(`/api/v1/modules/${module.body.id}/demands`).set("X-CSRF-Token",token).send({title:"Conclusão falsa",description:"",statusId:"status-concluida",priorityId:"normal",categoryId:"tarefa"}).expect(422);
    const dependent=await agent.post(`/api/v1/modules/${module.body.id}/demands`).set("X-CSRF-Token",token).send({title:"Dependente",description:"",statusId:"nova",priorityId:"normal",categoryId:"tarefa",dependencies:[created.body.id]}).expect(201);
    await agent.patch(`/api/v1/modules/${module.body.id}/demands/${created.body.id}`).set("X-CSRF-Token",token).send({version:created.body.version,dependencies:[dependent.body.id]}).expect(422);
    const legitimate=await agent.patch(`/api/v1/modules/${module.body.id}/demands/${created.body.id}`).set("X-CSRF-Token",token).send({version:created.body.version,title:"Edição legítima"}).expect(200);
    await agent.patch(`/api/v1/modules/${module.body.id}/demands/${created.body.id}`).set("X-CSRF-Token",token).send({version:created.body.version,title:"Conflito"}).expect(409);
    const persisted=await getDatabase().selectFrom("demands").select(["title","description","status_id","version","payload"]).where("id","=",created.body.id).executeTakeFirstOrThrow();
    expect(persisted.title).toBe("Edição legítima");expect(persisted.description).toBe("original");expect(persisted.status_id).toBe("nova");expect(persisted.version).toBe(legitimate.body.version);
    const payload=persisted.payload as Record<string,unknown>;expect(payload.comments??[]).toEqual([]);expect(payload.blocker).toBeUndefined();
    const audits=await getDatabase().selectFrom("audit_logs").select("id").where("module_id","=",module.body.id).where("entity_id","=",created.body.id).where("action","=","UPDATE").execute();expect(audits).toHaveLength(1);
  });
});
