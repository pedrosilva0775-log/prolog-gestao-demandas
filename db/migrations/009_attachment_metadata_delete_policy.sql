ALTER TABLE attachment_files DROP CONSTRAINT attachment_files_demand_id_fkey;
ALTER TABLE attachment_files ADD CONSTRAINT attachment_files_demand_id_fkey
  FOREIGN KEY (demand_id) REFERENCES demands(id) ON DELETE CASCADE;
