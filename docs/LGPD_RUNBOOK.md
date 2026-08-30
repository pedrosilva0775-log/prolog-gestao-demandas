# Runbook LGPD — PROLOG v1

## Papéis obrigatórios

- Controlador/DPO: aprova base legal, finalidade, prazo de retenção e decisão final sobre solicitações.
- Segurança: preserva evidências, investiga incidentes e coordena contenção.
- Operação PROLOG: executa somente decisões registradas e aprovadas.

Nenhuma base legal deve ser inferida pela aplicação. O cadastro de cliente exige uma referência aprovada e uma data futura de retenção.

## Solicitações de titulares

1. O usuário autenticado abre `POST /api/v1/privacy/requests`.
2. O sistema associa o e-mail da sessão, registra prazo e auditoria.
3. Administrador consulta `GET /api/v1/privacy/requests` e move o caso para `processing`.
4. Para acesso/portabilidade, o titular usa `GET /api/v1/privacy/export`; a exportação também é auditada.
5. Correção, restrição e exclusão exigem análise de obrigações de retenção e vínculos operacionais.
6. Finalizar como `completed` ou `rejected`; rejeição exige justificativa.

Não enviar exportações por canal não autenticado. Validar identidade por procedimento corporativo antes de entregar dados fora da sessão do próprio titular.

## Retenção e anonimização

1. DPO aprova a política por entidade.
2. Administrador grava a política em `/api/v1/privacy/retention-policies/:entityType`.
3. Agendador executa diariamente `npm run retention:enforce` com identidade técnica de mínimo privilégio.
4. Monitoramento alerta quando `retention_enforcement_failed` ocorrer ou o evento de sucesso deixar de aparecer por 26 horas.
5. Validar amostra mensal e registrar evidência; auditoria append-only não é anonimizada pelo job e exige estratégia própria de particionamento/arquivo aprovada.

## Incidente com dados pessoais

1. Conter: revogar sessões, credenciais e integrações afetadas.
2. Preservar: logs JSON, auditoria, image digest e snapshot consistente do banco.
3. Avaliar: dados, titulares, período, origem, impacto e medidas de mitigação.
4. Escalar imediatamente para Segurança e DPO; eles determinam notificações e prazos legais.
5. Corrigir, validar e documentar causa raiz, linha do tempo e ações preventivas.

Nunca apagar auditoria para ocultar um incidente. Dados sensíveis não devem ser copiados para tickets, chat ou logs.

## Evidências mínimas de go-live

- Registro aprovado de bases legais/finalidades e tabela de retenção.
- Canal público do encarregado e procedimento de verificação de identidade.
- Teste documentado de acesso, portabilidade, correção, restrição e exclusão.
- Exercício de incidente com responsáveis e contatos atualizados.
- Aprovação formal do DPO/Jurídico e do responsável por Segurança.
