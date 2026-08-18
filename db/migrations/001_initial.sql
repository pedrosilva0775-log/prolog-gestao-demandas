CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY, email text NOT NULL UNIQUE, name text NOT NULL,
  password_hash text, role text NOT NULL CHECK (role IN ('admin','gestor','diretoria','colaborador')),
  role_title text NOT NULL DEFAULT '', department text NOT NULL DEFAULT '', branch text,
  phone text, avatar text, active boolean NOT NULL DEFAULT true,
  force_password_change boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS teams (
  id text PRIMARY KEY, name text NOT NULL UNIQUE, description text NOT NULL DEFAULT '', department text NOT NULL DEFAULT '',
  leader_id text REFERENCES users(id) ON DELETE SET NULL, color text NOT NULL DEFAULT '#2563eb', active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS team_members (
  team_id text NOT NULL REFERENCES teams(id) ON DELETE CASCADE, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(team_id,user_id)
);
CREATE TABLE IF NOT EXISTS clients (
  id text PRIMARY KEY, name text NOT NULL, company text NOT NULL, email text NOT NULL, phone text, active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company,email)
);
CREATE TABLE IF NOT EXISTS demands (
  id text PRIMARY KEY, code text NOT NULL UNIQUE, title text NOT NULL, description text NOT NULL DEFAULT '',
  status_id text NOT NULL, priority_id text NOT NULL, category_id text NOT NULL,
  requester_id text NOT NULL REFERENCES users(id), assignee_id text REFERENCES users(id) ON DELETE SET NULL,
  team_id text REFERENCES teams(id) ON DELETE SET NULL, client_id text REFERENCES clients(id) ON DELETE SET NULL,
  due_date timestamptz, payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS demands_status_idx ON demands(status_id);
CREATE INDEX IF NOT EXISTS demands_assignee_idx ON demands(assignee_id);
CREATE INDEX IF NOT EXISTS demands_team_idx ON demands(team_id);
CREATE INDEX IF NOT EXISTS demands_updated_idx ON demands(updated_at DESC);
CREATE TABLE IF NOT EXISTS configurations (key text PRIMARY KEY, value jsonb NOT NULL, updated_by text REFERENCES users(id) ON DELETE SET NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS role_permissions (role text NOT NULL, permission text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(role,permission));
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id text, session_id text, ip_address inet,
  action text NOT NULL, entity_type text NOT NULL, entity_id text, before_data jsonb, after_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_created_idx ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_entity_idx ON audit_logs(entity_type,entity_id);
CREATE TABLE IF NOT EXISTS login_attempts (key text PRIMARY KEY, attempts integer NOT NULL DEFAULT 0, blocked_until timestamptz, updated_at timestamptz NOT NULL DEFAULT now());

CREATE OR REPLACE FUNCTION prevent_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'audit_logs is append-only'; END $$;
DROP TRIGGER IF EXISTS audit_logs_immutable ON audit_logs;
CREATE TRIGGER audit_logs_immutable BEFORE UPDATE OR DELETE ON audit_logs FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();
