import { ColumnType, Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';

type Default<T> = ColumnType<T, T | undefined, T>;
export interface Database {
  users: { id: string; email: string; name: string; password_hash: string | null; role: string; role_title: string; department: string; branch: string | null; phone: string | null; avatar: string | null; active: boolean; force_password_change: boolean; created_at: Default<Date>; updated_at: Default<Date> };
  teams: { id: string; name: string; description: string; department: string; leader_id: string | null; color: string; active: boolean; created_at: Default<Date>; updated_at: Default<Date> };
  team_members: { team_id: string; user_id: string; created_at: Default<Date> };
  clients: { id: string; name: string; company: string; email: string; phone: string | null; active: boolean; created_at: Default<Date>; updated_at: Default<Date> };
  demands: { id: string; code: string; title: string; description: string; status_id: string; priority_id: string; category_id: string; requester_id: string; assignee_id: string | null; team_id: string | null; client_id: string | null; due_date: Date | null; payload: unknown; version: Default<number>; created_at: Default<Date>; updated_at: Default<Date> };
  configurations: { key: string; value: unknown; updated_by: string | null; updated_at: Default<Date> };
  role_permissions: { role: string; permission: string; created_at: Default<Date> };
  audit_logs: { id: Default<string>; actor_id: string | null; session_id: string | null; ip_address: string | null; action: string; entity_type: string; entity_id: string | null; before_data: unknown | null; after_data: unknown | null; created_at: Default<Date> };
  login_attempts: { key: string; attempts: number; blocked_until: Date | null; updated_at: Default<Date> };
  auth_sessions: { id: string; user_id: string; expires_at: Date; revoked_at: Date | null; ip_address: string | null; user_agent: string | null; created_at: Default<Date>; last_seen_at: Default<Date> };
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
