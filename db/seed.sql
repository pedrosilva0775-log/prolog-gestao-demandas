INSERT INTO role_permissions(role,permission) VALUES
('admin','*'),
('gestor','demands:read'),('gestor','demands:create'),('gestor','demands:update'),('gestor','clients:read'),('gestor','clients:create'),('gestor','teams:read'),
('diretoria','demands:read'),('diretoria','reports:read'),('diretoria','audit:read'),
('colaborador','demands:read'),('colaborador','demands:create'),('colaborador','demands:update:assigned'),('colaborador','clients:read'),('colaborador','teams:read')
ON CONFLICT DO NOTHING;
INSERT INTO configurations(key,value) VALUES
('statuses','[]'::jsonb),('categories','[]'::jsonb),('priorities','[]'::jsonb),('schema_version','"1"'::jsonb)
ON CONFLICT DO NOTHING;
