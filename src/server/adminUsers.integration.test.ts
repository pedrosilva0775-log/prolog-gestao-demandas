import crypto from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { closeDatabase, getDatabase } from "./database.js";
import { hashPassword } from "./password.js";

const run = process.env.RUN_DB_TESTS === "true";
const adminId = `admin-users-${crypto.randomUUID()}`;
const memberId = `member-users-${crypto.randomUUID()}`;
const createdEmails: string[] = [];

const csrf = async (agent: ReturnType<typeof request.agent>) => {
  const response = await agent.get("/api/auth/config").expect(200);
  const raw = String(response.headers["set-cookie"]?.[0] ?? response.headers["set-cookie"] ?? "");
  return decodeURIComponent(raw.match(/prolog_csrf=([^;]+)/)?.[1] ?? "");
};

const payload = (email: string) => ({
  name: "Usuário Autorização",
  email,
  password: "SenhaSegura123",
  role: "colaborador",
  roleTitle: "Analista",
  department: "Teste",
  teamIds: [],
});

describe.skipIf(!run)("autorização da rota administrativa histórica de usuários", () => {
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    const db = getDatabase();
    const now = new Date();
    const security = { deleted_at: null, password_changed_at: null, mfa_enabled: false, mfa_secret_encrypted: null, failed_mfa_attempts: 0, locked_until: null };
    await db.insertInto("users").values([
      { id: adminId, email: `${adminId}@test.local`, name: "Admin", password_hash: hashPassword("Admin123"), role: "admin", role_title: "Admin", department: "Teste", branch: null, phone: null, avatar: null, active: true, force_password_change: false, ...security, created_at: now, updated_at: now },
      { id: memberId, email: `${memberId}@test.local`, name: "Module Admin", password_hash: hashPassword("Member123"), role: "colaborador", role_title: "Gestor", department: "Teste", branch: null, phone: null, avatar: null, active: true, force_password_change: false, ...security, created_at: now, updated_at: now },
    ]).execute();
    await db.insertInto("module_members").values({ module_id: "mod-default", user_id: memberId, role: "module_admin", active: true, created_by: adminId, created_at: now, updated_at: now }).execute();
    app = await createApp();
  });

  afterAll(async () => {
    const db = getDatabase();
    await db.deleteFrom("user_permissions").where("user_id", "in", [adminId, memberId]).execute();
    await db.deleteFrom("auth_sessions").where("user_id", "in", [adminId, memberId]).execute();
    await db.deleteFrom("module_members").where("user_id", "=", memberId).execute();
    if (createdEmails.length) await db.deleteFrom("users").where("email", "in", createdEmails).execute();
    await db.deleteFrom("users").where("id", "in", [adminId, memberId]).execute();
    await closeDatabase();
  });

  it("aplica papel global, revogações atuais, alias e fail-closed sem gravar negativas", async () => {
    const db = getDatabase();
    const admin = request.agent(app);
    const adminToken = await csrf(admin);
    await admin.post("/api/auth/login").set("X-CSRF-Token", adminToken).send({ email: `${adminId}@test.local`, password: "Admin123" }).expect(200);
    const member = request.agent(app);
    const memberToken = await csrf(member);
    await member.post("/api/auth/login").set("X-CSRF-Token", memberToken).send({ email: `${memberId}@test.local`, password: "Member123" }).expect(200);
    const nextEmail = () => { const email = `authorization-${crypto.randomUUID()}@test.local`; createdEmails.push(email); return email; };
    const expectAbsent = async (email: string) => expect(await db.selectFrom("users").select("id").where("email", "=", email).executeTakeFirst()).toBeUndefined();

    const allowedEmail = nextEmail();
    await admin.post("/api/admin/users").set("X-CSRF-Token", adminToken).send(payload(allowedEmail)).expect(201);
    expect(await db.selectFrom("users").select("id").where("email", "=", allowedEmail).executeTakeFirst()).toBeTruthy();

    const revokedEmail = nextEmail();
    await db.insertInto("user_permissions").values({ user_id: adminId, permission: "users", effect: "deny", created_by: adminId, created_at: new Date() }).execute();
    await admin.post("/api/admin/users").set("X-CSRF-Token", adminToken).send(payload(revokedEmail)).expect(403);
    await expectAbsent(revokedEmail);
    await db.deleteFrom("user_permissions").where("user_id", "=", adminId).execute();

    const restoredEmail = nextEmail();
    await admin.post("/api/admin/users").set("X-CSRF-Token", adminToken).send(payload(restoredEmail)).expect(201);
    const aliasEmail = nextEmail();
    await db.insertInto("user_permissions").values({ user_id: adminId, permission: "users_teams", effect: "deny", created_by: adminId, created_at: new Date() }).execute();
    await admin.post("/api/admin/users").set("X-CSRF-Token", adminToken).send(payload(aliasEmail)).expect(403);
    await expectAbsent(aliasEmail);
    await db.deleteFrom("user_permissions").where("user_id", "=", adminId).execute();

    await db.insertInto("user_permissions").values({ user_id: memberId, permission: "users:create", effect: "allow", created_by: adminId, created_at: new Date() }).execute();
    const moduleAdminEmail = nextEmail();
    await member.post("/api/admin/users").set("X-CSRF-Token", memberToken).send(payload(moduleAdminEmail)).expect(403);
    await expectAbsent(moduleAdminEmail);

    const failingApp = await createApp({ authorizationOverrideReader: async () => { throw new Error("authorization unavailable"); } });
    const failingAdmin = request.agent(failingApp);
    const failingToken = await csrf(failingAdmin);
    await failingAdmin.post("/api/auth/login").set("X-CSRF-Token", failingToken).send({ email: `${adminId}@test.local`, password: "Admin123" }).expect(200);
    const failureEmail = nextEmail();
    await failingAdmin.post("/api/admin/users").set("X-CSRF-Token", failingToken).send(payload(failureEmail)).expect(403);
    await expectAbsent(failureEmail);
  });
});
