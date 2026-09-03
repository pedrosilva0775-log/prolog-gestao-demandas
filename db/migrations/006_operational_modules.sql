CREATE TABLE operational_modules (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon_key text NOT NULL DEFAULT 'FolderKanban' CHECK (icon_key IN ('Briefcase','Code2','Workflow','FolderKanban','Warehouse','Truck','Scale','Users','Boxes')),
  color text NOT NULL DEFAULT '#2563eb' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  active boolean NOT NULL DEFAULT true,
  created_by text REFERENCES users(id) ON DELETE SET NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE UNIQUE INDEX operational_modules_active_slug_uidx
  ON operational_modules (lower(slug)) WHERE deleted_at IS NULL;
CREATE INDEX operational_modules_active_name_idx
  ON operational_modules (active, name) WHERE deleted_at IS NULL;

INSERT INTO operational_modules(id,name,slug,description,icon_key,color,active,created_by,version)
VALUES ('mod-default','Operações','operacoes','Módulo padrão criado para preservar os dados existentes.','FolderKanban','#2563eb',true,null,1);

CREATE TABLE module_members (
  module_id text NOT NULL REFERENCES operational_modules(id) ON DELETE RESTRICT,
  user_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('module_admin','manager','member','viewer')),
  active boolean NOT NULL DEFAULT true,
  created_by text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(module_id,user_id)
);
CREATE INDEX module_members_user_active_idx ON module_members(user_id,module_id) WHERE active = true;

INSERT INTO module_members(module_id,user_id,role,active,created_by)
SELECT 'mod-default',id,
  CASE role WHEN 'admin' THEN 'module_admin' WHEN 'gestor' THEN 'manager' WHEN 'diretoria' THEN 'viewer' ELSE 'member' END,
  true,null
FROM users WHERE active = true AND deleted_at IS NULL;

CREATE TABLE team_modules (
  module_id text NOT NULL REFERENCES operational_modules(id) ON DELETE RESTRICT,
  team_id text NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  created_by text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(module_id,team_id)
);
CREATE INDEX team_modules_team_idx ON team_modules(team_id,module_id);

INSERT INTO team_modules(module_id,team_id,created_by)
SELECT 'mod-default',id,null FROM teams WHERE active = true AND deleted_at IS NULL;

ALTER TABLE demands ADD COLUMN module_id text DEFAULT 'mod-default';
UPDATE demands SET module_id = 'mod-default' WHERE module_id IS NULL;
ALTER TABLE demands ALTER COLUMN module_id SET NOT NULL;
ALTER TABLE demands ADD CONSTRAINT demands_module_fk FOREIGN KEY(module_id) REFERENCES operational_modules(id) ON DELETE RESTRICT;
CREATE INDEX demands_module_active_updated_idx ON demands(module_id,updated_at DESC) WHERE deleted_at IS NULL;

ALTER TABLE sprints ADD COLUMN module_id text DEFAULT 'mod-default';
UPDATE sprints SET module_id = 'mod-default' WHERE module_id IS NULL;
ALTER TABLE sprints ALTER COLUMN module_id SET NOT NULL;
ALTER TABLE sprints ADD CONSTRAINT sprints_module_fk FOREIGN KEY(module_id) REFERENCES operational_modules(id) ON DELETE RESTRICT;
CREATE INDEX sprints_module_status_idx ON sprints(module_id,status,start_date,end_date) WHERE deleted_at IS NULL;

ALTER TABLE report_presets ADD COLUMN module_id text DEFAULT 'mod-default';
UPDATE report_presets SET module_id = 'mod-default' WHERE module_id IS NULL;
ALTER TABLE report_presets ALTER COLUMN module_id SET NOT NULL;
ALTER TABLE report_presets ADD CONSTRAINT report_presets_module_fk FOREIGN KEY(module_id) REFERENCES operational_modules(id) ON DELETE RESTRICT;
ALTER TABLE report_presets DROP CONSTRAINT report_presets_user_id_name_key;
ALTER TABLE report_presets ADD CONSTRAINT report_presets_module_user_name_key UNIQUE(module_id,user_id,name);
CREATE INDEX report_presets_module_user_idx ON report_presets(module_id,user_id,updated_at DESC);

ALTER TABLE audit_logs ADD COLUMN module_id text REFERENCES operational_modules(id) ON DELETE RESTRICT;
CREATE INDEX audit_module_created_idx ON audit_logs(module_id,created_at DESC) WHERE module_id IS NOT NULL;

CREATE TABLE module_configurations (
  module_id text NOT NULL REFERENCES operational_modules(id) ON DELETE RESTRICT,
  key text NOT NULL CHECK (key IN ('categories','statuses','priorities')),
  value jsonb NOT NULL,
  updated_by text REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(module_id,key)
);

INSERT INTO module_configurations(module_id,key,value,updated_by,updated_at)
SELECT 'mod-default',key,value,updated_by,updated_at
FROM configurations WHERE key IN ('categories','statuses','priorities');
