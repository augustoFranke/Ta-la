# Pitfalls Research

**Domain:** Produto social de check-in por proximidade (Expo + Supabase)
**Researched:** 2026-02-10
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Confiar no geofence apenas no cliente

**What goes wrong:**
Usuários conseguem fazer check-in remoto com GPS falsificado, localização antiga (`lastKnown`) ou precisão ruim, gerando presença falsa no local.

**Why it happens:**
Implementação valida apenas no app (distância no JS) e aceita qualquer payload de coordenada enviado pelo cliente.

**How to avoid:**
Aplicar validação server-side no Postgres com `geography` + `ST_DWithin` (50-100m), exigir `accuracy` máxima aceitável, recusar leituras antigas por `timestamp`, registrar `mocked=true` (Android) como sinal de risco e marcar check-in para revisão/step-up.

**Warning signs:**
Volume anormal de check-ins em horários de deslocamento impossível, múltiplos check-ins em locais distantes em janela curta, aumento de `mocked=true` e divergência entre presença no app e presença real reportada por parceiros.

**Phase to address:**
Fase 1 - Trust boundary de localização (validação server-side + regras antifraude básicas).

---

### Pitfall 2: Cálculo geoespacial incorreto (lat/lon e SRID)

**What goes wrong:**
Usuário elegível para check-in é bloqueado (falso negativo) ou usuário distante é aceito (falso positivo).

**Why it happens:**
Troca de ordem latitude/longitude, uso de `geometry` sem consistência de SRID ou cálculo em graus sem modelo geográfico apropriado.

**How to avoid:**
Padronizar tipo `geography(POINT)`, documentar contrato `longitude latitude`, encapsular regras em função SQL única (`can_check_in`) e cobrir com testes de borda (49m, 51m, 99m, 101m).

**Warning signs:**
Tickets de "estou no local e não consigo entrar", mapas corretos com validação errada e regressões após migrações de esquema.

**Phase to address:**
Fase 1 - Modelo geoespacial e função canônica de elegibilidade.

---

### Pitfall 3: Assumir presença contínua com app em background

**What goes wrong:**
Sistema mantém usuário "presente" depois que conexão caiu silenciosamente, ou remove usuário cedo demais, quebrando descoberta no mesmo local.

**Why it happens:**
WebSocket/presença sem heartbeat robusto, throttling em background e diferenças de plataforma (incluindo limitações de Expo Go para serviços de localização/background).

**How to avoid:**
Separar "presença efêmera" de "verdade de negócio": usar Realtime Presence para UX instantânea, mas manter sessão de presença no banco com TTL/heartbeat do servidor, expiração automática e reconciliação periódica. Configurar `worker: true` e `heartbeatCallback` no Realtime quando aplicável.

**Warning signs:**
"Usuários fantasmas" em telas de descoberta, quedas silenciosas após app em segundo plano, diferença crescente entre contagem em Presence e contagem no banco.

**Phase to address:**
Fase 2 - Lifecycle de presença e reconciliação de estado.

---

### Pitfall 4: Vazamento de canais Realtime e estouro de limites

**What goes wrong:**
Erro `TooManyChannels`/`ChannelRateLimitReached`, consumo elevado de bateria/rede, latência e eventos perdidos.

**Why it happens:**
Criação de canais por render/navegação sem `unsubscribe`, cliente Supabase instanciado dentro de componentes e limpeza incompleta no logout.

**How to avoid:**
Cliente singleton, assinatura com cleanup obrigatório, auditoria de `getChannels()` em ambiente de desenvolvimento, `removeAllChannels()` no logout e orçamento de canais por tela/fluxo.

**Warning signs:**
Contagem de canais sobe sem ação do usuário, mesmo tópico repetido várias vezes, picos de reconexão e erros de limite no WebSocket/logs Realtime.

**Phase to address:**
Fase 2 - Higiene de subscriptions e governança de canais.

---

### Pitfall 5: RLS incompleto em tabelas de check-in/presença

**What goes wrong:**
Exposição de presença de outros usuários, leitura indevida de dados privados e risco grave de segurança.

**Why it happens:**
Tabela criada via SQL sem `ENABLE ROW LEVEL SECURITY`, policy permissiva (`using true`), dependência em `auth.uid()` sem verificar autenticação, ou uso indevido de `service_role` no cliente.

**How to avoid:**
Tratar RLS como bloqueador de release: policy por operação (`SELECT/INSERT/UPDATE/DELETE`) com `TO authenticated`, checks explícitos (`auth.uid() IS NOT NULL`), revisão obrigatória de políticas em PR, e proibição de `service_role` em código cliente.

**Warning signs:**
Consultas retornando dados de terceiros, endpoints funcionando sem sessão válida e tabelas novas sem políticas após migração.

**Phase to address:**
Fase 1 - Baseline de segurança de dados (RLS + revisão de chaves).

---

### Pitfall 6: Tratar Postgres Changes como trilha de auditoria completa

**What goes wrong:**
Fluxos de remoção e presença ficam inconsistentes porque `DELETE` não é filtrável e payload antigo pode vir limitado (apenas PK em certos cenários com RLS/replica identity).

**Why it happens:**
Leitura parcial das garantias do Realtime/Postgres Changes e ausência de fallback por polling/estado materializado.

**How to avoid:**
Usar Postgres Changes para atualização incremental de UI, não como fonte única de verdade; manter queries de reconciliação periódica, modelar tombstones/status explícito quando necessário e validar comportamento de `DELETE`/`old` em testes de integração.

**Warning signs:**
Itens "presos" na UI após remoção, divergência entre lista local e banco e bugs intermitentes de sincronização após reconexão.

**Phase to address:**
Fase 2 - Estratégia de consistência eventual (realtime + reconcile).

---

### Pitfall 7: Retenção excessiva de localização precisa

**What goes wrong:**
Risco legal e reputacional por coletar/armazenar mais geodados do que o necessário para check-in e descoberta.

**Why it happens:**
Persistência indiscriminada de trilhas de latitude/longitude sem janela de retenção, sem minimização e sem transparência de finalidade.

**How to avoid:**
Aplicar minimização por padrão: guardar coordenada precisa só para validação temporal curta, derivar e persistir apenas dados agregados para produto (ex.: venue_id, janela de presença), definir TTL e rotina de purge, e publicar política clara de finalidade/retenção em pt-BR.

**Warning signs:**
Tabela de localização crescendo sem limite, ausência de job de expurgo, dificuldade para atender pedido de eliminação/relato de tratamento.

**Phase to address:**
Fase 3 - Privacidade e governança de dados (LGPD by design).

---

### Pitfall 8: Deriva de migração (dashboard-first sem captura em código)

**What goes wrong:**
Ambientes ficam diferentes, funções/policies quebram em produção e regressões aparecem tardiamente.

**Why it happens:**
Alterações diretas no dashboard sem `db diff`/migração versionada, ausência de `db reset` periódico e falta de revisão de SQL.

**How to avoid:**
Fluxo migration-first obrigatório: toda mudança de schema por arquivo em `supabase/migrations`, `supabase db reset` em CI para validar reprodutibilidade, `db pull` controlado para capturar drift remoto e checklist de PR para RLS/indexes/funções.

**Warning signs:**
"Funciona no meu projeto" mas falha em staging/prod, migrações que não aplicam em ordem limpa e objetos existentes só em um ambiente.

**Phase to address:**
Fase 4 - Disciplina de banco e release engineering.

---

### Pitfall 9: Ausência de testes para políticas, geofence e presença

**What goes wrong:**
Mudanças aparentemente pequenas quebram autorização, elegibilidade de check-in e sincronização realtime.

**Why it happens:**
Cobertura focada em UI, sem testes automatizados de banco (RLS/funções SQL) e sem cenários de reconexão/offline.

**How to avoid:**
Criar suíte mínima obrigatória: pgTAP para RLS e funções (`can_check_in`, políticas de leitura/escrita), testes de integração para reconexão e testes de contrato para payload realtime. Bloquear merge sem passar suíte crítica.

**Warning signs:**
Bugs recorrentes após migração, hotfixes de política em produção e comportamento diferente entre usuários autenticados/anon.

**Phase to address:**
Fase 4 - Qualidade e prevenção de regressão.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Validar distância só no app | Entrega rápida do check-in | Fraude geográfica e perda de confiança | Nunca |
| Presence como única verdade de "quem está no local" | Implementação simples | Usuários fantasmas e inconsistência | Nunca |
| Criar tabela no dashboard sem migration | Agilidade momentânea | Drift entre ambientes e deploy quebrado | Apenas experimento local não compartilhado |
| RLS permissivo para destravar frontend | Menos bloqueio no dev | Exposição de dados pessoais | Nunca |
| Sem teste de banco para ganhar velocidade | Menor custo inicial | Regressões caras em produção | MVP inicial de protótipo interno apenas |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Expo Location | Usar `getLastKnownPositionAsync` como prova de presença | Usar `getCurrentPositionAsync` para decisão crítica e validar `timestamp`/`accuracy` no servidor |
| Expo Location + Expo Go | Planejar geofencing/background como se fosse produção | Considerar limitações de Expo Go e planejar fallback foreground/manual refresh |
| Supabase Realtime Presence | Não limpar canais ao trocar tela/logout | `unsubscribe` no cleanup, monitorar `getChannels()`, `removeAllChannels()` no logout |
| Supabase Postgres Changes | Esperar filtragem completa de `DELETE` | Modelar reconciliação por query e status materializado |
| Supabase Auth/DB | Expor `service_role` no cliente mobile | Cliente usa chave publishable/anon; privilégios elevados só no backend seguro |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Sem índice espacial em colunas de venue/location | Busca de venues lenta e timeout | GIST index em `geography` + função SQL otimizada | ~10k+ venues com consultas frequentes |
| Um canal por card/usuário na lista | Quota de canais e bateria alta | Agrupar por tópico de venue/área e reutilizar canais | Algumas centenas de usuários ativos simultâneos |
| Filtro realtime amplo (`schema: public`, `event:*`) | Ruído alto e processamento no cliente | Assinar só tabela/evento necessários + filtros específicos | Crescimento de entidades e eventos por segundo |
| Políticas RLS sem índices nas colunas de filtro | Latência imprevisível | Indexar colunas usadas nas policies e filtros explícitos por usuário | 10k+ sessões ativas e tabelas de presença grandes |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Publicar localização exata de usuários no discovery | Stalking e risco físico | Exibir presença por venue/área, não coordenada exata; controles de visibilidade |
| Aceitar check-in sem autenticação forte de contexto | Fraude de presença e abuso de benefícios | Geofence server-side + heurísticas de fraude + rate limit por usuário/dispositivo |
| Políticas RLS baseadas em metadado mutável do usuário | Escalada de privilégio | Usar claims seguras/app_metadata e políticas restritivas por role |
| Manter histórico bruto indefinido de coordenadas | Exposição massiva em incidente | TTL, purge automatizado e retenção mínima por finalidade |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Mensagem genérica para falha de check-in | Frustração e abandono | Erros específicos: fora do raio, precisão insuficiente, permissão negada, conexão instável |
| Pedir permissão de localização sem contexto | Mais recusas de permissão | Solicitação progressiva com explicação contextual em pt-BR |
| Status de presença sem "atualizado em" | Baixa confiança no discovery | Mostrar recência (ex.: "visto ha X min") e auto-expirar status |
| Não diferenciar "sem pessoas" de "dados indisponíveis" | Interpretação errada do local | Estados vazios distintos e ação de recarregar |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Check-in por proximidade:** Falta validação no servidor - verificar função SQL com `ST_DWithin` e testes de borda.
- [ ] **Discovery em tempo real:** Falta reconciliação pós-reconexão - verificar refresh automático após reconnect/background.
- [ ] **Privacidade de localização:** Falta política de retenção - verificar TTL e job de purge em produção.
- [ ] **RLS de presença/check-in:** Falta cobertura por operação - verificar `SELECT/INSERT/UPDATE/DELETE` com testes.
- [ ] **Migrações:** Falta reprodutibilidade - verificar `supabase db reset` limpo no CI.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Fraude massiva de check-in | HIGH | Congelar benefícios dependentes de check-in, ativar validação server-side estrita, reprocessar sessões suspeitas e invalidar check-ins inconsistentes |
| Usuários fantasmas em presença | MEDIUM | Introduzir TTL imediato, limpar sessões órfãs, forçar resync no app e monitorar taxa de divergência |
| Vazamento por RLS incorreto | HIGH | Revogar acesso, corrigir policies, rotacionar chaves expostas, auditar consultas e comunicar incidente conforme obrigação legal |
| Drift de schema entre ambientes | MEDIUM | Congelar deploy, gerar migração corretiva a partir do estado canônico, aplicar `db reset`/`db push` controlado e reexecutar suíte |
| Regressão silenciosa sem testes | MEDIUM | Criar teste reprodutível do bug, adicionar ao gate de CI e bloquear merges sem suíte crítica |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Confiar no geofence apenas no cliente | Phase 1 | Taxa de check-ins inválidos cai; testes de borda geofence passando |
| Cálculo geoespacial incorreto | Phase 1 | Testes de distância e ordem lon/lat cobrindo cenários limite |
| RLS incompleto em tabelas críticas | Phase 1 | Auditoria de tabelas expostas com RLS habilitado + testes de policy |
| Presença quebrada em background/reconexão | Phase 2 | Métrica de divergência Presence x DB abaixo do SLO definido |
| Vazamento de canais Realtime | Phase 2 | `getChannels()` estável por navegação; zero `TooManyChannels` em logs |
| Semântica incompleta de Postgres Changes | Phase 2 | Reconciliação periódica corrige divergência em testes de caos/reconnect |
| Retenção excessiva de localização | Phase 3 | Job de purge ativo e retenção efetiva auditável |
| Drift de migrações | Phase 4 | Pipeline roda `db reset` + `db push` sem diferenças inesperadas |
| Falta de testes de banco/realtime | Phase 4 | Gate CI com pgTAP + integração bloqueando regressões críticas |

## Sources

- Expo Location (SDK 54): https://docs.expo.dev/versions/latest/sdk/location/ (official docs; background/geofencing limits, permissions, `mocked`, `lastKnown` caveats)
- Supabase PostGIS guide: https://supabase.com/docs/guides/database/extensions/postgis (official docs; `geography`, spatial index, lon/lat ordering)
- PostGIS ST_DWithin: https://postgis.net/docs/ST_DWithin.html (official docs; distance semantics and index behavior)
- Supabase Realtime Presence: https://supabase.com/docs/guides/realtime/presence (official docs; ephemeral presence model)
- Supabase Realtime Postgres Changes: https://supabase.com/docs/guides/realtime/postgres-changes (official docs; delete/filter and payload limitations)
- Supabase Realtime Limits: https://supabase.com/docs/guides/realtime/limits (official docs; channel and throughput limits)
- Supabase troubleshooting - silent disconnections: https://supabase.com/docs/guides/troubleshooting/realtime-handling-silent-disconnections-in-backgrounded-applications-592794 (official docs; heartbeat/worker guidance)
- Supabase troubleshooting - TooManyChannels: https://supabase.com/docs/guides/troubleshooting/realtime-too-many-channels-error (official docs; lifecycle cleanup patterns)
- Supabase RLS guide: https://supabase.com/docs/guides/database/postgres/row-level-security (official docs; policy and security guidance)
- Supabase migrations/local dev/testing: https://supabase.com/docs/guides/deployment/database-migrations , https://supabase.com/docs/guides/local-development/overview , https://supabase.com/docs/guides/database/testing (official docs; migration discipline and automated DB tests)
- LGPD (Lei 13.709/2018): https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm (fonte legal oficial; princípios de necessidade, finalidade, transparência e eliminação)

---
*Pitfalls research for: check-in social por localização (Expo + Supabase)*
*Researched: 2026-02-10*
