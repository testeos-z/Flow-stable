# Proposal: Alejandria 1.0.0 → 1.1.0 Hardening

## Intent

Hardening del AgentFlow "Alejandria 1.0.0 stable" (`a6228a84-c8b7-449b-b484-7ae942cc0386`) para producción. Se detectaron 7 bugs críticos/importantes: temperatura inconsistente en planner, ausencia total de structured output, sin tope de iteraciones, sin timeouts, branching frágil, fallback mono-idioma, y zero memoria conversacional. El flujo ejecuta end-to-end pero falla silenciosamente en edge cases y no tiene observabilidad.

## Scope

### In Scope

- Bajar `agentModelConfig.temperature` del Bibliotecario: 0.7 → 0.1
- Tope `agentMaxIterations` en Source Worker: null → 6
- `timeout` explícito en los 5 nodos LLM/Agent: 90000ms
- Structured Output (`llmStructuredOutput` / `agentStructuredOutput`) en Router, Lingüista, Bibliotecario y Source Worker vía JSON Schema
- Eliminar nodo `Markdown Stripper` (redundante con Structured Output)
- Robustecer condición `Has Results?` evaluando `evidence.length > 0` en vez de `notContains "[]"`
- Fallback Reply multilenguaje vinculado a `router_result.language`
- `agentMemory` tipo `bufferWindowMemory` (k=5) en Síntesis Final
- `maxTokens: 8192` en Síntesis Final
- Streaming solo en Síntesis Final; desactivar en nodos intermedios
- Upgrade Bibliotecario: `gemini-2.5-flash-lite` → `gemini-2.5-flash`
- Downgrade Lingüista: `minimax-m2.5` → `gemini-2.5-flash-lite`
- Convertir Bibliotecario de `agentAgentflow` a `llmAgentflow` (no usa tools)
- Activar `analytic` (tracing) en chatflow config

### Out of Scope

- Nuevas fuentes MCP / data connectors
- Búsqueda vectorial nativa (queda delegada a MCPs)
- Autenticación de usuarios / sesiones
- Cambios en Supabase RPCs
- UI / canvas

## Capabilities

### New Capabilities

None — hardening de flujo existente.

### Modified Capabilities

- `alejandria-flow`: Comportamiento de fallback (i18n), memoria conversacional, structured output, observabilidad, límites operativos (iteraciones, timeout, tokens).

## Approach

Pipeline: **backup → aplicar fixes por fases → validar → desplegar**.

1. Backup vía `get_chatflow(a6228a84)` + archivar en `sdd/alejandria-agentflow/flow-backup-v1.0.0.json`
2. Fase 1 (crítico): temperatura, tope iteraciones, timeouts — `update_chatflow` patch
3. Fase 2 (structured output): definir schemas, aplicar a 4 nodos, eliminar Stripper, reparar condición — `update_chatflow` full-replace (cambia topología)
4. Fase 3 (i18n fallback): template condicional en DirectReply — `update_chatflow` patch
5. Fase 4 (optimización): modelos, tokens, streaming, tipo nodo Bibliotecario — `update_chatflow` patch
6. Fase 5 (memoria + observabilidad): agentMemory + analytic — `update_chatflow` patch
7. Validación entre fases: `validate_agentflow` + `test_chatflow` con queries multilingües
8. Bump nombre a "Alejandria 1.1.0 stable", `deployed: true`

State compartido vía `$flow.state` se preserva intacto (12 claves tipadas en Start).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| Flowise chatflow `a6228a84` | Modified | 6 fases de patch/full-replace |
| Flowise chatflow `a6228a84` | Modified (delete) | Nodo Markdown Stripper eliminado |
| `sdd/alejandria-agentflow/` | New | Backup flow v1.0.0 JSON |
| `openspec/changes/alejandria-hardening/` | New | SDD artifacts |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Structured Output no soportado por gemini-2.5-flash-lite vía OpenRouter | Medium | Verificar antes de aplicar; fallback: prompt-only con schema validación en Merger |
| Full-replace en Fase 2 rompe topología | Medium | Backup previo; rollback inmediato si validate falla |
| Memoria conversacional degrada calidad en queries puntuales | Low | k=5 bajo; testear queries mixtas (follow-up vs fresh) |
| Rate limiting OpenRouter con 5 modelos | Low | Timeouts explícitos evitan requests colgados |

## Rollback Plan

1. Restaurar flow desde `flow-backup-v1.0.0.json` vía `update_chatflow(full-replace)`
2. Verificar con `get_chatflow` que el JSON coincide con backup
3. Smoke test para confirmar funcionalidad pre-hardening

## Dependencies

- Flowise server accesible vía MCP (flow-stable-flow.up.railway.app)
- Credencial OpenRouter `ddeb2757-f8e2-4ed7-9647-5a113332b432` activa
- 5 MCP servers autorizados y operativos

## Success Criteria

- [ ] `test_chatflow` smoke + integration pasan en ES, EN, PT
- [ ] Bibliotecario temperature = 0.1, Source Worker maxIterations = 6
- [ ] Structured Output activo en 4 nodos; Markdown Stripper eliminado
- [ ] Fallback Reply responde en idioma del usuario (ES/EN/PT)
- [ ] Síntesis Final con memoria mantiene contexto en follow-ups (3+ turnos)
- [ ] `analytic` configurado y capturando métricas
- [ ] 0 errores de parseo en 20 queries aleatorias multilingües
