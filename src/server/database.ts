import { ColumnType, Generated, Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';

type Default<T> = ColumnType<T, T | undefined, T>;
export interface Database {
  external_request_links: { id:string; token_hash:string; client_id:string; module_id:string; recipient_user_id:string; allowed_types:string[]; expires_at:Date; max_submissions:number; submission_count:number; revoked_at:Date|null; replaced_by_id:string|null; created_by:string; version:Default<number>; created_at:Default<Date>; updated_at:Default<Date> };
  external_requests: { id:string; protocol:string; link_id:string; module_id:string; client_id:string; recipient_user_id:string; declared_name:string; declared_email:string; request_type:'task'|'project'|'improvement'; title:string; description:string; expected_outcome:string; desired_due_date:Date|null; perceived_impact:string|null; status:'received'|'in_review'|'converted'|'refused'; idempotency_key:string; converted_demand_id:string|null; reviewed_by:string|null; reviewed_at:Date|null; refusal_reason:string|null; version:Default<number>; created_at:Default<Date>; updated_at:Default<Date> };
  attachment_files: { id:string; demand_id:string; comment_id:string|null; storage_key:string; original_name:string; mime_type:string; size_bytes:number; uploaded_by:string|null; created_at:Default<Date> };
  attachment_backfill_issues: { storage_key:string; reason:string; reference_count:number; detected_at:Default<Date> };
  operational_modules: { id:string; name:string; slug:string; description:string; icon_key:'Briefcase'|'Code2'|'Workflow'|'FolderKanban'|'Warehouse'|'Truck'|'Scale'|'Users'|'Boxes'; color:string; active:boolean; created_by:string|null; version:Default<number>; deleted_at:Generated<Date|null>; created_at:Default<Date>; updated_at:Default<Date> };
  module_members: { module_id:string; user_id:string; role:'module_admin'|'manager'|'member'|'viewer'; active:Default<boolean>; created_by:string|null; created_at:Default<Date>; updated_at:Default<Date> };
  team_modules: { module_id:string; team_id:string; created_by:string|null; created_at:Default<Date> };
  module_configurations: { module_id:string; key:'categories'|'statuses'|'priorities'|'workflow'; value:unknown; updated_by:string|null; updated_at:Default<Date> };
  users: { id: string; email: string; name: string; password_hash: string | null; role: string; role_title: string; department: string; branch: string | null; phone: string | null; avatar: string | null; active: boolean; force_password_change: boolean; deleted_at: Generated<Date | null>; password_changed_at: Generated<Date | null>; mfa_enabled: Generated<boolean>; mfa_secret_encrypted: Generated<Uint8Array | null>; failed_mfa_attempts: Generated<number>; locked_until: Generated<Date | null>; created_at: Default<Date>; updated_at: Default<Date> };
  teams: { id: string; name: string; description: string; department: string; leader_id: string | null; color: string; active: boolean; deleted_at: Generated<Date | null>; version: Generated<number>; created_at: Default<Date>; updated_at: Default<Date> };
  team_members: { team_id: string; user_id: string; created_at: Default<Date> };
  clients: { id: string; name: string; company: string; email: string; phone: string | null; active: boolean; deleted_at: Generated<Date | null>; version: Generated<number>; legal_basis: Generated<string | null>; retention_until: Generated<Date | null>; created_at: Default<Date>; updated_at: Default<Date> };
  demands: { id: string; module_id:Default<string>; code: string; title: string; description: string; status_id: string; priority_id: string; category_id: string; requester_id: string; assignee_id: string | null; team_id: string | null; client_id: string | null; sprint_id: string | null; backlog_position: Generated<number>; due_date: Date | null; payload: unknown; version: Default<number>; deleted_at: Generated<Date | null>; completed_at: Generated<Date | null>; archived_at: Generated<Date | null>; created_at: Default<Date>; updated_at: Default<Date> };
  sprints: { id:string; module_id:Default<string>; name:string; goal:string; status:'planned'|'active'|'completed'|'cancelled'; start_date:Date; end_date:Date; capacity:number; created_by:string|null; version:Generated<number>; deleted_at:Generated<Date|null>; created_at:Default<Date>; updated_at:Default<Date> };
  configurations: { key: string; value: unknown; updated_by: string | null; updated_at: Default<Date> };
  report_presets: { id: string; module_id:Default<string>; user_id: string; name: string; configuration: unknown; created_at: Default<Date>; updated_at: Default<Date> };
  role_permissions: { role: string; permission: string; created_at: Default<Date> };
  audit_logs: { id: Default<string>; module_id:Generated<string|null>; actor_id: string | null; session_id: string | null; ip_address: string | null; action: string; entity_type: string; entity_id: string | null; before_data: unknown | null; after_data: unknown | null; created_at: Default<Date> };
  login_attempts: { key: string; attempts: number; blocked_until: Date | null; updated_at: Default<Date> };
  auth_sessions: { id: string; user_id: string; expires_at: Date; revoked_at: Date | null; ip_address: string | null; user_agent: string | null; created_at: Default<Date>; last_seen_at: Default<Date> };
  password_reset_tokens: { id: Default<string>; user_id: string; token_hash: string; expires_at: Date; consumed_at: Date | null; requested_ip: string | null; created_at: Default<Date> };
  mfa_recovery_codes: { id: Default<string>; user_id: string; code_hash: string; consumed_at: Date | null; created_at: Default<Date> };
  user_permissions: { user_id: string; permission: string; effect: 'allow' | 'deny'; created_by: string | null; created_at: Default<Date> };
  feature_flags: { key: string; enabled: boolean; description: string; updated_by: string | null; updated_at: Default<Date> };
  data_subject_requests: { id: Generated<string>; subject_email: string; request_type: 'access'|'correction'|'deletion'|'portability'|'restriction'; status: 'open'|'verified'|'processing'|'completed'|'rejected'; verification_token_hash: string | null; assigned_to: string | null; rejection_reason: string | null; due_at: Date; completed_at: Date | null; created_at: Default<Date>; updated_at: Default<Date> };
  retention_policies: { entity_type: string; retention_days: number; anonymize_after_expiry: boolean; legal_basis: string; updated_by: string | null; updated_at: Default<Date> };
  consent_records: { id: Default<string>; subject_email: string; purpose: string; granted: boolean; policy_version: string; evidence: unknown; created_at: Default<Date> };
}

let database: Kysely<Database> | null = null;
export const getDatabase = () => {
  if (database) return database;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL não configurada.');
  database = new Kysely<Database>({ dialect: new PostgresDialect({ pool: new pg.Pool({ connectionString, max: Number(process.env.DB_POOL_SIZE || 10), ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined }) }) });
  return database;
};

export const closeDatabase = async () => { if (database) await database.destroy(); database = null; };
