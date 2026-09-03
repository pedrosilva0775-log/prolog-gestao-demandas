# Checklist de prontidão — produção controlada

| Requisito | Evidência atual | Prioridade | Estado | Bloqueio / risco | Próximo passo |
|---|---|---:|---|---|---|
| Autorização central e isolamento | Integração PostgreSQL cobre permissões e módulos | Bloqueadora | Comprovado em testes | Homologação humana pendente | Repetir na imagem candidata |
| Anexos protegidos | GET/HEAD, persistência e inventário cobertos | Bloqueadora | Comprovado em testes | Restore conjunto pendente | Validar após restore descartável |
| Contratos de demandas | Schemas estritos e concorrência por versão | Bloqueadora | Comprovado em testes | Fluxos de navegador parciais | E2E com três contextos |
| Dependências de produção | `qs` 6.16.0; auditoria sem achados | Bloqueadora | Comprovado | Repetir no artefato final | `npm audit --omit=dev` |
| Drag-and-drop | Desabilitado; seletor permanece funcional | Não bloqueante | Limitação explícita | Sem E2E de rollback visual | Manter fora da primeira versão |
| Reabertura | Bloqueada no backend e indisponível na interface | Não bloqueante | Limitação explícita | Requer operação específica futura | Obter aceite dos usuários |
| Indicadores completos | Endpoint agregado por módulo; dashboard consome KPIs e distribuições validados com 250 demandas | Bloqueadora | Comprovado em integração | Homologação visual pendente | Repetir na imagem candidata |
| Solicitações externas | Backend transacional validado; rotas públicas e internas retornam 404 por padrão | Fora do primeiro GO | Adiada com segurança | Frontend, IDOR ampliado e homologação ainda pendentes | Manter `EXTERNAL_REQUESTS_ENABLED` ausente ou diferente de `true` |
| Três sessões independentes | Duas instâncias SPA já testadas | Bloqueadora | Pendente | Cookies independentes não comprovados | E2E com contextos separados |
| Edição de prazo | Persistência interativa não comprovada | Bloqueadora | Pendente | Automação de `input[type=date]` | E2E Playwright e verificação SQL |
| Backup e restore conjunto | Runbook existente | Bloqueadora | Pendente | Destino externo/retensão não definidos | Restore em ambiente descartável |
| Imagem candidata | Build local aprovado | Bloqueadora | Pendente | Alterações não versionadas | Imagem de homologação separada |
| HTTPS, domínio e alertas | Dependem de infraestrutura externa | Bloqueadora operacional | Aguardando decisão | Hospedagem, domínio e destinatário ausentes | Definir antes do GO operacional |

Estados são atualizados somente com evidência executada no código atual. Testes no banco principal são proibidos.

## Funcionalidade adiada: solicitações externas

O primeiro GO não inclui solicitações externas. O servidor somente monta essas rotas quando `EXTERNAL_REQUESTS_ENABLED=true`; o padrão seguro é desabilitado. Com a flag fechada, GET e POST públicos e endpoints internos retornam HTTP 404. A migration 010 pode permanecer aplicada sem expor o recurso. Não habilitar a flag antes de concluir frontend, testes ampliados de isolamento e homologação no navegador.
