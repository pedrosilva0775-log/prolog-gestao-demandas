# Relatório de auditoria técnica — PROLOG

Data da avaliação: 18/08/2026  
Escopo: código-fonte, arquitetura, autenticação, persistência, integrações, experiência Web/Android e capacidade de operação.

## Parecer executivo

**Situação: NÃO APROVADO para produção corporativa neste estado.**

O sistema compila e possui uma interface funcional para demonstração ou piloto local controlado. Kanban, lista, calendário, relatórios, usuários, equipes, clientes, RBAC e autenticação têm implementação de interface. Porém, os dados operacionais são persistidos principalmente no `localStorage` do navegador. Assim, cada computador mantém uma base diferente, não existe sincronização multiusuário, controle transacional, recuperação centralizada ou trilha de auditoria confiável.

Classificação estimada de prontidão: **42/100 — protótipo funcional, não produção**.

Uso recomendado hoje:

- Demonstração interna: aprovado.
- Homologação com dados descartáveis: aprovado com restrições.
- Piloto individual em um único navegador: possível, com backup manual.
- Operação multiusuário ou dados reais: não aprovado.
- Auditoria formal, LGPD ou continuidade de negócio: não aprovado.

## Evidências validadas

| Verificação | Resultado |
|---|---|
| TypeScript (`npm run lint`) | Aprovado |
| Build de produção (`npm run build`) | Aprovado |
| Testes unitários | Inexistentes |
| Testes de integração/API | Inexistentes |
| Testes E2E | Inexistentes |
| Banco de dados central | Inexistente |
| Persistência de contas | Arquivos JSON locais no servidor |
| Persistência de demandas e configurações | `localStorage` do navegador |
| Vulnerabilidades npm de produção | 2 moderadas (`exceljs`/`uuid`) |
| Bundle principal | Aproximadamente 2,09 MB; 572 KB gzip |
| APK/AAB Android real no repositório | Inexistente |

## O que está funcional

- Login por usuário e senha com hash `scrypt`.
- Cookie de sessão `HttpOnly`, `SameSite=Lax` e `Secure` em produção.
- Validação de ID token do Google quando `GOOGLE_CLIENT_ID` é configurado.
- Cadastro administrativo de usuários com senha provisória.
- Troca obrigatória de senha no primeiro acesso.
- Papéis de acesso: administrador, gestor, diretoria e colaborador.
- Cadastro de equipes e clientes.
- Cadastro e gestão visual de demandas, Kanban, lista, calendário e Gantt.
- Exportação e relatórios executivos na interface.
- Temas e layout responsivo, incluindo shell móvel/Android.
- Build de produção concluído sem erro.

## Bloqueadores críticos

### 1. Não existe base central para os dados operacionais

Demandas, equipes, clientes, configurações, permissões, auditoria, notificações, riscos, SLA e demais módulos ficam no `localStorage`. Os dados não são compartilhados entre usuários e podem ser apagados ao limpar o navegador. Um usuário autenticado pode manipular esses registros pelas ferramentas do navegador.

**Ação obrigatória:** implementar banco relacional (por exemplo, PostgreSQL), API autenticada, migrations, integridade referencial e transações. Migrar todas as operações do `AppContext`/`StorageService` para endpoints de backend.

### 2. RBAC é majoritariamente aplicado no frontend

A interface esconde ou libera ações conforme o papel, mas a maior parte das operações não chega a um backend capaz de revalidar autorização. Para dados operacionais, alterar o `localStorage` contorna o modelo de permissões.

**Ação obrigatória:** aplicar autorização por endpoint e por recurso no servidor, com testes para cada perfil.

### 3. Auditoria não é confiável

Os logs de auditoria também são locais e podem ser editados ou removidos pelo próprio navegador. Não atendem aos requisitos de imutabilidade, autoria, horário confiável e retenção.

**Ação obrigatória:** trilha append-only no servidor, identificação de ator/sessão/IP, carimbo UTC, correlação de requisição e política de retenção.

### 4. “Android” não é um aplicativo distribuível comprovado

O repositório não contém projeto Android, Capacitor, Cordova, React Native, manifest, assinatura ou pipeline de APK/AAB. A tela anuncia binários, versão, hash e download, mas os botões apenas exibem mensagens simuladas.

**Ação obrigatória:** decidir entre PWA instalável ou aplicativo Android. Para PWA, adicionar manifest e service worker reais. Para APK/AAB, criar projeto Capacitor/Android, pipeline de assinatura e artefatos verificáveis. Remover alegações simuladas até existir um binário.

### 5. Integrações Google são parcialmente simuladas

O login Google valida token, mas Drive, Sheets, Docs, Slides, Chat e parte do Calendar retornam URLs e resultados simulados, com atrasos artificiais. Não há persistência segura de tokens OAuth nem chamadas reais para essas APIs.

**Ação obrigatória:** implementar OAuth server-side com escopos mínimos, armazenamento criptografado de refresh tokens, revogação e chamadas oficiais; ou marcar claramente os módulos como indisponíveis.

## Riscos altos

- Credenciais padrão `admin/admin` permanecem como fallback no código e no `.env.example`.
- `SESSION_SECRET` possui fallback conhecido; publicação sem variável de ambiente torna sessões forjáveis.
- Contas são armazenadas em arquivo JSON, inadequado para concorrência, escala, replicação e recuperação.
- Não existe proteção CSRF explícita nos endpoints mutáveis.
- Rate limit de login fica somente em memória, por IP, e é perdido ao reiniciar o servidor.
- A opção “lembrar dispositivo” grava cookie por 30 dias, mas o token interno expira em 8 horas.
- Não há recuperação de senha por e-mail, MFA efetivo ou política corporativa completa de senha.
- Não há cabeçalhos de segurança configurados por middleware, como CSP e HSTS.
- Não há validação de esquema centralizada para requisições.
- Fluxo antigo de convites permanece como código morto e endpoints `410`, aumentando manutenção e superfície desnecessária.

## Riscos funcionais e de qualidade

- Datas padrão estão fixadas em agosto de 2026 em criação e edição de demandas.
- O cadastro de clientes também é apenas local e não possui edição, desativação, deduplicação ou histórico.
- Não há teste automatizado para login, troca de senha, RBAC, criação de demanda, Kanban ou exportação.
- Não há paginação; tabelas e estados em memória podem degradar com volume.
- O bundle principal supera o limite recomendado pelo Vite e precisa de divisão por rotas/módulos.
- Parte de `initialData.ts` ainda contém conteúdo demonstrativo, apesar de as coleções operacionais principais iniciarem vazias.
- Backup, integridade, API/webhooks, relatórios programados e integrações apresentam telas mais completas que a infraestrutura real disponível.
- Não há observabilidade de produção: logs estruturados, métricas, tracing, alertas ou integração com monitoramento.
- Não há configuração documentada de CI/CD, ambientes, rollback ou recuperação de desastre.

## Segurança e LGPD

O sistema ainda não deve receber dados pessoais reais. Nome, e-mail, telefone, avatar, comentários e anexos podem ser dados pessoais, mas faltam:

- base legal e finalidade documentadas;
- controle central de retenção e exclusão;
- exportação/atendimento de titular;
- criptografia central em repouso;
- segregação por organização/filial;
- trilha imutável de acesso;
- política e teste de backup/restauração;
- gestão de incidentes e acessos privilegiados.

## Plano recomendado para ficar operacional

### Fase 1 — bloqueadores de produção

1. Criar PostgreSQL e modelo de dados central.
2. Implementar API para usuários, clientes, equipes, demandas, configurações e auditoria.
3. Mover RBAC para o backend.
4. Eliminar credenciais e segredos padrão; exigir variáveis seguras no startup.
5. Criar migrations, seed apenas estrutural e rotina de backup/restauração testada.
6. Substituir datas fixas por datas relativas ao dia corrente.
7. Remover ou rotular recursos simulados.

### Fase 2 — segurança e confiabilidade

1. CSRF, Helmet/CSP/HSTS, rate limit persistente e validação de payload.
2. Recuperação de senha com token curto, MFA para administradores e gestão de sessões.
3. Testes unitários, integração e E2E para fluxos críticos.
4. Logs estruturados e auditoria append-only.
5. Corrigir as duas vulnerabilidades moderadas identificadas no `npm audit`.

### Fase 3 — entrega e escala

1. Pipeline CI/CD com lint, testes, build, análise de dependências e rollback.
2. Separação de bundle e carregamento sob demanda.
3. PWA real ou Android Capacitor com artefato assinado.
4. Integrações Google reais e observabilidade.
5. Teste de carga, acessibilidade, dispositivos Android e homologação de usuários.

## Critérios mínimos para aprovação futura

- Dois usuários em navegadores diferentes visualizam os mesmos dados autorizados.
- Todas as mutações passam por API autenticada e autorizada.
- Reinício do servidor não perde dados nem controles de segurança.
- Backup é restaurado com sucesso em teste documentado.
- Testes automatizados cobrem autenticação, RBAC e ciclo completo de demanda.
- Nenhuma credencial padrão funciona em produção.
- Recursos anunciados como Google/Android executam de verdade ou estão removidos.
- Auditoria é central, pesquisável e não editável pelo cliente.
- Avaliação de segurança e homologação final são aprovadas.

## Conclusão

O PROLOG possui boa base visual e cobre muitos processos de gestão, mas hoje a profundidade do backend não acompanha a amplitude da interface. O principal trabalho restante não é de design: é transformar a aplicação local em um sistema centralizado, multiusuário, auditável e recuperável. Até isso ser concluído, use somente dados fictícios ou descartáveis em ambiente controlado.
