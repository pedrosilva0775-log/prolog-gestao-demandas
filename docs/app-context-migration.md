# Migração do AppContext

## Estado atual

`AppProvider` continua oferecendo a interface completa de `useApp()` como camada de compatibilidade. Novos consumidores devem preferir os hooks de `src/context/domainContexts.tsx`: `useSession`, `usePermissions`, `useDemands`, `usePeople`, `useSettings`, `useNotifications` e `useVisualState`.

As projeções têm identidades independentes por domínio. Assim, um consumidor migrado não assina o objeto monolítico e deixa de receber atualizações de contextos não utilizados. `ProfileSettingsModal` é o primeiro consumidor migrado e serve como exemplo incremental.

## Responsabilidades que permanecem no legado

- bootstrap, indicador de carregamento e erro global;
- auditoria e coordenação de efeitos entre domínios;
- fila offline e sincronização;
- módulos empresariais/experimentais: inbox/triagem, templates e recorrência, SLA, aprovações, objetivos, riscos, relatórios agendados, API/webhooks, LGPD, backups/DR e rastreabilidade;
- regras que coordenam demandas com notificações, auditoria, configurações e pessoas.

Esses módulos não foram promovidos ao novo núcleo operacional. A próxima etapa deve extrair operações de demandas atrás de um serviço/reducer testável e somente então mover a coordenação de efeitos.

## Compatibilidade e comportamento

- `useApp()` mantém os mesmos campos e a mesma validação de provider.
- persistência de tema, modo do dispositivo, sidebar e modo offline não mudou;
- regras RBAC foram movidas sem alteração para `permissionPolicy.ts` e agora possuem testes unitários;
- nenhum pacote ou store externo foi adicionado.

## Estratégia para novos passos

Migrar um consumidor por vez, executar `npm run lint`, os testes direcionados e então a suíte completa. Remover um campo da fachada legada apenas quando não houver mais consumidores de `useApp()` para ele.
