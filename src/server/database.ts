import { ColumnType, Generated, Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';

type Default<T> = ColumnType<T, T | undefined, T>;
export interface Database {
  users: { id: string; email: string; name: string; password_hash: string | null; role: string; role_title: string; department: string; branch: string | null; phone: string | null; avatar: string | null; active: boolean; force_password_change: boolean; deleted_at: Generated<Date | null>; password_changed_at: Generated<Date | null>; mfa_enabled: Generated<boolean>; mfa_secret_encrypted: Generated<Uint8Array | null>; failed_mfa_attempts: Generated<number>; locked_until: Generated<Date | null>; created_at: Default<Date>; updated_at: Default<Date> };
  teams: { id: string; name: string; description: string; department: string; leader_id: string | null; color: string; active: boolean; deleted_at: Generated<Date | null>; version: Generated<number>; created_at: Default<Date>; updated_at: Default<Date> };
  team_members: { team_id: string; user_id: string; created_at: Default<Date> };
  clients: { id: string; name: string; company: string; email: string; phone: string | null; active: boolean; deleted_at: Generated<Date | null>; version: Generated<number>; legal_basis: Generated<string | null>; retention_until: Generated<Date | null>; created_at: Default<Date>; updated_at: Default<Date> };
  demands: { id: string; code: string; title: string; description: string; status_id: string; priority_id: string; category_id: string; requester_id: string; assignee_id: string | null; team_id: string | null; client_id: string | null; sprint_id: string | null; backlog_position: Generated<number>; due_date: Date | null; payload: unknown; version: Default<number>; deleted_at: Generated<Date | null>; completed_at: Generated<Date | null>; archived_at: Generated<Date | null>; created_at: Default<Date>; updated_at: Default<Date> };
  sprints: { id:string; name:string; goal:string; status:'planned'|'active'|'completed'|'cancelled'; start_date:Date; end_date:Date; capacity:number; created_by:string|null; version:Generated<number>; deleted_at:Generated<Date|null>; created_at:Default<Date>; updated_at:Default<Date> };
  configurations: { key: string; value: unknown; updated_by: string | null; updated_at: Default<Date> };
  report_presets: { id: string; user_id: string; name: string; configuration: unknown; created_at: Default<Date>; updated_at: Default<Date> };
  role_permissions: { role: string; permission: string; created_at: Default<Date> };
  audit_logs: { id: Default<string>; actor_id: string | null; session_id: string | null; ip_address: string | null; action: string; entity_type: string; entity_id: string | null; before_data: unknown | null; after_data: unknown | null; created_at: Default<Date> };
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
