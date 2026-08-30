# PROLOG — prontidão para produção v1.0

## Escopo habilitado

- Autenticação, usuários, equipes, clientes, demandas, configurações essenciais e auditoria.
- Recursos Google, Android, webhooks, automações, backup pela interface, SLA avançado, riscos, recorrências e relatórios programados ficam desabilitados por padrão.

## Controles implementados no repositório

- PostgreSQL, migrations serializadas por advisory lock e checksum imutável.
- Sessões persistentes, RBAC por endpoint, auditoria append-only e rate limit persistente.
- Helmet/CSP, validação de origem, Fetch Metadata, JSON obrigatório e double-submit CSRF nas APIs v1.
- Senhas scrypt com mínimo de 12 caracteres e revogação das outras sessões após troca.
- MFA TOTP funcional, segredo AES-256-GCM, desafio de login de 5 minutos, bloqueio por tentativas e dez códigos de recuperação de uso único; aplicável também ao login Google.
- Feature flags em build time e remoção dos módulos simulados do bundle v1.
- `/health`, `/ready`, `/metrics` autenticado, request ID e logs JSON com redação de credenciais/PII.
- Recuperação de senha com token aleatório armazenado apenas como hash, validade de 20 minutos, uso único, revogação de sessões e entrega por webhook autenticado.
- Listagem e revogação de sessões/dispositivos persistidos no PostgreSQL.
- Exportação CSV com proteção contra formula injection; ExcelJS removido.
- Dockerfile multi-stage não-root, CI com PostgreSQL 17 e geração de SBOM/provenance.
- Gate de cobertura V8 no CI: linhas 90%, statements 60%, funções 60% e branches 40% no núcleo da API/segurança.
- Scripts de backup, checksum e restore verificado.
- Solicitações de titulares, exportação de dados pessoais, políticas de retenção, soft delete e job idempotente de anonimização/expurgo.

## Validação local com PostgreSQL

```bash
docker compose -f docker-compose.test.yml up -d --wait
DATABASE_URL=postgresql://prolog_test:prolog_test_password@localhost:55432/prolog_test npm run db:migrate
DATABASE_URL=postgresql://prolog_test:prolog_test_password@localhost:55432/prolog_test RUN_DB_TESTS=true npm run test:integration
docker compose -f docker-compose.test.yml down
```

## Variáveis obrigatórias de produção

- `DATABASE_URL`, `DB_SSL=true`, `SESSION_SECRET` com ao menos 32 caracteres.
- `APP_URL`, `LOG_HASH_SECRET`, `METRICS_TOKEN`, `MFA_ENCRYPTION_KEY` e credenciais fornecidas por secret manager.
- `PASSWORD_RESET_WEBHOOK_URL` e `PASSWORD_RESET_WEBHOOK_SECRET` para habilitar recuperação de senha.
- `TRUST_PROXY=true` somente quando houver exatamente um proxy confiável na frente da aplicação.
- Todas as `VITE_FEATURE_*` permanecem `false` na v1.0, salvo aprovação técnica específica.

## Dependências externas antes do go-live

- Configurar domínio, TLS, banco gerenciado, secret manager e storage externo imutável para backups.
- Conectar o job de release ao provedor de homologação/produção escolhido.
- Nos environments GitHub `homologation` e `production`, configurar `DEPLOY_WEBHOOK_URL`, `DEPLOY_TOKEN` e `HEALTHCHECK_URL`; o adaptador deve responder `{ "deploymentId": "..." }` e aceitar ações `deploy`/`rollback`.
- Configurar métricas/alertas e destino dos logs estruturados.
- Configurar o provedor de entrega de e-mail; ativar MFA nas contas administrativas e, somente depois, definir `REQUIRE_ADMIN_MFA=true`.
- Aprovar política de retenção, base legal, atendimento ao titular e resposta a incidentes com Jurídico/DPO.
- Executar restore real, teste de carga, E2E, acessibilidade e pentest independente.

## Critério de liberação

O go-live exige CI verde no SHA da tag, migrations aplicadas, smoke tests de `/health` e `/ready`, restore comprovado, zero vulnerabilidades abertas sem aceite formal, aprovação de homologação e rollback ensaiado.

Procedimentos detalhados: [`docs/OPERATIONS_RUNBOOK.md`](docs/OPERATIONS_RUNBOOK.md) e [`docs/LGPD_RUNBOOK.md`](docs/LGPD_RUNBOOK.md).

## Evidência da última validação local (19/08/2026)

- Migrations 001–003 aplicadas com checksum e advisory lock em PostgreSQL 17 Alpine descartável.
- `npm run test:coverage` com `RUN_DB_TESTS=true` contra PostgreSQL 17: 29/29 testes aprovados, incluindo CRUD de clientes com base legal/retenção, RBAC, CSRF, sessão/logout, demandas, reset de senha, LGPD e MFA ponta a ponta.
- Cobertura V8 do núcleo selecionado: 93,83% de linhas, 63,91% de statements, 63,84% de funções e 44,44% de branches; todos acima dos thresholds bloqueantes.
- `npm run lint`: TypeScript aprovado sem erros.
- `npm run build`: cliente Vite, servidor e migrador gerados com sucesso.
- `npm audit --omit=dev --audit-level=moderate`: 0 vulnerabilidades.
- Bundle principal: 201,09 kB (52,63 kB gzip); vendor de gráficos: 395,44 kB (113,45 kB gzip).
- Backup custom-format validado por checksum SHA-256 e restaurado em um segundo banco; 3 migrations e 12 eventos de auditoria confirmados após restore.
- Smoke test do artefato compilado em `NODE_ENV=production`: `/health` 200, `/ready` 200, `/metrics` autenticado 200, acesso sem token oculto com 404 e SPA 200.
- Imagem `prolog:production-readiness` construída pelo Dockerfile multi-stage; runtime saudável contra PostgreSQL 17, `/health` 200, `/ready` 200 e processo não-root `uid=10001(prolog)`.
- Workflow GitHub Actions e scripts shell validados por `actionlint`/ShellCheck; Docker Compose validado por `docker compose config`.

## Decisão atual

**Ainda não liberar para produção.** Código, PostgreSQL 17, backup/restore, artefato compilado e imagem Docker passaram nas verificações locais. Faltam evidências externas: executar o workflow hospedado no SHA versionado, configurar o provedor de deploy/rollback, storage externo de backups, logs/métricas/alertas e entrega de recuperação de senha, além das aprovações de segurança e LGPD.
