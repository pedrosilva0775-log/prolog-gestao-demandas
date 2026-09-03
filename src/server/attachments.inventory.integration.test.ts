import crypto from "node:crypto";
import path from "node:path";
import { mkdir, mkdtemp, readFile, rm, symlink, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inventoryAttachments } from "./attachments/inventory.js";
import { closeDatabase, getDatabase } from "./database.js";
import { hashPassword } from "./password.js";

const run = process.env.RUN_DB_TESTS === "true";
const suffix = crypto.randomUUID();
const userId = `inventory-user-${suffix}`;
const moduleId = `inventory-module-${suffix}`;
const demandId = `inventory-demand-${suffix}`;
const correctKey = `${crypto.randomUUID()}.png`;
const missingKey = `${crypto.randomUUID()}.png`;
const mismatchKey = `${crypto.randomUUID()}.png`;
const invalidKey = "../fora.png";
const ambiguousKey = `${crypto.randomUUID()}.png`;
let fixtureBase = "";
let root = "";

describe.skipIf(!run)("inventário somente de leitura de anexos", () => {
  beforeAll(async () => {
    fixtureBase = await mkdtemp(path.join(tmpdir(), "prolog-attachment-inventory-"));
    root = path.join(fixtureBase, "uploads");
    const outside = path.join(fixtureBase, "outside");
    await mkdir(root);
    await mkdir(outside);
    await writeFile(path.join(root, correctKey), "ok");
    await writeFile(path.join(root, mismatchKey), "tamanho-divergente");
    await writeFile(path.join(root, "orfao-antigo.png"), "orfao");
    const old = new Date(Date.now() - 10 * 60_000);
    await utimes(path.join(root, "orfao-antigo.png"), old, old);
    await symlink(outside, path.join(root, "escape-link"), "junction");

    const db = getDatabase();
    const now = new Date();
    await db.insertInto("users").values({id:userId,email:`${userId}@test.local`,name:"Inventário",password_hash:hashPassword("Inventory123"),role:"colaborador",role_title:"Teste",department:"Teste",branch:null,phone:null,avatar:null,active:true,force_password_change:false,deleted_at:null,password_changed_at:null,mfa_enabled:false,mfa_secret_encrypted:null,failed_mfa_attempts:0,locked_until:null,created_at:now,updated_at:now}).execute();
    await db.insertInto("operational_modules").values({id:moduleId,name:"Inventário",slug:`inventory-${suffix}`,description:"",icon_key:"Briefcase",color:"#2563eb",active:true,created_by:userId,version:1,deleted_at:null,created_at:now,updated_at:now}).execute();
    await db.insertInto("demands").values({id:demandId,module_id:moduleId,code:`IV-${suffix.slice(0,6)}`,title:"Inventário",description:"",status_id:"nova",priority_id:"normal",category_id:"tarefa",requester_id:userId,assignee_id:null,team_id:null,client_id:null,sprint_id:null,backlog_position:0,due_date:null,payload:{comments:[]},version:1,deleted_at:null,completed_at:null,archived_at:null,created_at:now,updated_at:now}).execute();
    for (const [storageKey, size] of [[correctKey,2],[missingKey,1],[mismatchKey,1],[invalidKey,1]] as const) {
      await db.insertInto("attachment_files").values({id:`attf-${crypto.randomUUID()}`,demand_id:demandId,comment_id:null,storage_key:storageKey,original_name:"fixture.png",mime_type:"image/png",size_bytes:size,uploaded_by:userId,created_at:now}).execute();
    }
    await db.insertInto("attachment_backfill_issues").values({storage_key:ambiguousKey,reason:"AMBIGUOUS_REFERENCE",reference_count:2,detected_at:now}).execute();
  });

  afterAll(async () => {
    const db = getDatabase();
    await db.deleteFrom("attachment_backfill_issues").where("storage_key","=",ambiguousKey).execute();
    await db.deleteFrom("attachment_files").where("demand_id","=",demandId).execute();
    await db.deleteFrom("demands").where("id","=",demandId).execute();
    await db.deleteFrom("operational_modules").where("id","=",moduleId).execute();
    await db.deleteFrom("users").where("id","=",userId).execute();
    await closeDatabase();
    if(fixtureBase) await rm(fixtureBase,{recursive:true,force:true});
  });

  it("identifica inconsistências sem modificar banco ou arquivos", async () => {
    const db = getDatabase();
    const before = await readFile(path.join(root, correctKey), "utf8");
    const report = await inventoryAttachments(db, root, 5 * 60_000);
    expect(report.summary.missing_file).toBeGreaterThanOrEqual(1);
    expect(report.summary.orphan_file).toBeGreaterThanOrEqual(1);
    expect(report.summary.ambiguous_reference).toBeGreaterThanOrEqual(1);
    expect(report.summary.invalid_path).toBeGreaterThanOrEqual(1);
    expect(report.summary.escaping_symlink).toBeGreaterThanOrEqual(1);
    expect(report.summary.size_mismatch).toBeGreaterThanOrEqual(1);
    expect(await readFile(path.join(root, correctKey), "utf8")).toBe(before);
    expect(await db.selectFrom("attachment_files").select("id").where("demand_id","=",demandId).execute()).toHaveLength(4);
  });
});
