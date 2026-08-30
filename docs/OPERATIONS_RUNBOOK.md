# Runbook operacional — PROLOG v1

## Deploy

1. Criar tag semântica a partir de SHA revisado e CI verde.
2. O workflow publica imagem imutável com SBOM/provenance.
3. O environment `homologation` chama o adaptador de deploy, aguarda `/ready` e reverte automaticamente em falha.
4. Executar smoke/UAT em homologação e aprovar manualmente o environment `production`.
5. Produção usa exatamente o mesmo digest e repete readiness; registrar `deploymentId`, digest e aprovador.

O webhook deve aceitar `{action:"deploy",image,environment,runId}` e `{action:"rollback",deploymentId}`, retornando `{deploymentId}` no deploy.

## Migrations

- Executar `node build/migrate.mjs` uma vez por release antes de trocar todo o tráfego.
- O migrador usa advisory lock e checksum; alteração de migration já aplicada deve falhar.
- Usar padrão expand/contract para mudanças incompatíveis. Rollback de aplicação não deve depender de rollback destrutivo de schema.

## Backup e restore

- Executar `scripts/backup.sh` pelo menos diariamente em runner com `pg_dump` compatível.
- Copiar `.dump` e `.sha256` para storage externo criptografado, versionado/imutável e com acesso segregado.
- Definir retenção diária/mensal com Infra e DPO; não assumir prazo no código.
- Executar `scripts/restore-verify.sh` mensalmente em banco isolado e registrar duração, checksum, contagens, RPO/RTO observado e responsável.
- Backup sem restore comprovado não conta como evidência de recuperação.

## Observabilidade

- Coletar stdout JSON e preservar `requestId`, status e duração.
- Scrape autenticado de `/metrics`; nunca colocar `METRICS_TOKEN` em URL.
- Alertas mínimos: `/ready` indisponível, 5xx, latência, pool PostgreSQL, disco, falhas de login/MFA, ausência de backup e ausência do job de retenção.
- `/health` prova processo vivo; `/ready` prova dependência PostgreSQL disponível.

## Segredos

- Armazenar em secret manager: `DATABASE_URL`, `SESSION_SECRET`, `MFA_ENCRYPTION_KEY`, webhook de reset, token de métricas e credenciais de deploy.
- Rotacionar por incidente e calendário corporativo. Trocar `SESSION_SECRET` invalida tickets/cookies; rotação de `MFA_ENCRYPTION_KEY` exige migração controlada dos segredos MFA.
- Nunca reutilizar as chaves de exemplo/CI em produção.

## Rollback

1. Interromper promoção e chamar rollback com o `deploymentId` mais recente.
2. Confirmar `/ready`, versão/digest anterior e fluxo de login.
3. Se houver migration incompatível, aplicar o plano expand/contract aprovado; não restaurar banco sobre produção sem decisão de incidente.
4. Registrar causa, impacto, tempos e evidências.
