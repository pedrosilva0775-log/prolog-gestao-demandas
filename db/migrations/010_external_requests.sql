CREATE TABLE external_request_links (
  id text PRIMARY KEY,
  token_hash text NOT NULL UNIQUE CHECK (length(token_hash) = 64),
  client_id text NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  module_id text NOT NULL REFERENCES operational_modules(id) ON DELETE RESTRICT,
  recipient_user_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  allowed_types text[] NOT NULL CHECK (cardinality(allowed_types) BETWEEN 1 AND 3),
  expires_at timestamptz NOT NULL,
  max_submissions integer NOT NULL DEFAULT 1 CHECK (max_submissions BETWEEN 1 AND 100),
  submission_count integer NOT NULL DEFAULT 0 CHECK (submission_count BETWEEN 0 AND max_submissions),
  revoked_at timestamptz,
  replaced_by_id text REFERENCES external_request_links(id) ON DELETE SET NULL,
  created_by text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (allowed_types <@ ARRAY['task','project','improvement']::text[])
);
CREATE INDEX external_request_links_module_created_idx ON external_request_links(module_id,created_at DESC);
CREATE INDEX external_request_links_active_idx ON external_request_links(module_id,expires_at) WHERE revoked_at IS NULL;

CREATE TABLE external_requests (
  id text PRIMARY KEY,
  protocol text NOT NULL UNIQUE,
  link_id text NOT NULL REFERENCES external_request_links(id) ON DELETE RESTRICT,
  module_id text NOT NULL REFERENCES operational_modules(id) ON DELETE RESTRICT,
  client_id text NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  recipient_user_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  declared_name text NOT NULL,
  declared_email text NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('task','project','improvement')),
  title text NOT NULL,
  description text NOT NULL,
  expected_outcome text NOT NULL DEFAULT '',
  desired_due_date date,
  perceived_impact text,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','in_review','converted','refused')),
  idempotency_key text NOT NULL,
  converted_demand_id text UNIQUE REFERENCES demands(id) ON DELETE RESTRICT,
  reviewed_by text REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_at timestamptz,
  refusal_reason text,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(link_id,idempotency_key)
);
CREATE INDEX external_requests_module_status_created_idx ON external_requests(module_id,status,created_at DESC);
CREATE INDEX external_requests_recipient_status_idx ON external_requests(recipient_user_id,status,created_at DESC);
