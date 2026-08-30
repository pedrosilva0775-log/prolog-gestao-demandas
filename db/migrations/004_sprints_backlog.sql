CREATE TABLE IF NOT EXISTS sprints (
  id text PRIMARY KEY,
  name text NOT NULL,
  goal text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','completed','cancelled')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  capacity integer NOT NULL DEFAULT 0 CHECK (capacity >= 0),
  created_by text REFERENCES users(id) ON DELETE SET NULL,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS sprints_status_dates_idx ON sprints(status,start_date,end_date) WHERE deleted_at IS NULL;

ALTER TABLE demands ADD COLUMN IF NOT EXISTS sprint_id text REFERENCES sprints(id) ON DELETE SET NULL;
ALTER TABLE demands ADD COLUMN IF NOT EXISTS backlog_position integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS demands_sprint_idx ON demands(sprint_id) WHERE deleted_at IS NULL;
