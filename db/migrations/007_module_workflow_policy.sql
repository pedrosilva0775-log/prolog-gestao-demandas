ALTER TABLE module_configurations DROP CONSTRAINT module_configurations_key_check;
ALTER TABLE module_configurations ADD CONSTRAINT module_configurations_key_check
  CHECK (key IN ('categories','statuses','priorities','workflow'));

INSERT INTO module_configurations(module_id,key,value,updated_by)
SELECT id,'workflow','{
  "transitions": {
    "open": ["open", "in_progress", "cancelled"],
    "in_progress": ["waiting", "blocked", "in_review", "cancelled"],
    "waiting": ["in_progress", "blocked", "cancelled"],
    "blocked": ["in_progress", "waiting", "cancelled"],
    "in_review": ["in_progress", "completed", "cancelled"],
    "completed": [],
    "cancelled": []
  },
  "requireCompletedChecklist": true,
  "requireCompletedDependencies": true,
  "overrideRoles": ["manager", "module_admin"],
  "minimumOverrideJustificationLength": 10
}'::jsonb,NULL
FROM operational_modules
ON CONFLICT (module_id,key) DO NOTHING;
