# Tasks: Alejandria 1.0.0 → 1.1.0 Hardening

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 0 (Flowise config, no repo code) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR (backup JSON + SDD artifacts) |
| Delivery strategy | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Backup + Límites operativos (AF-002)

- [ ] 1.1 `get_chatflow(a6228a84)` → guardar backup en `sdd/alejandria-agentflow/flow-backup-v1.0.0.json`
- [ ] 1.2 `update_chatflow(a6228a84, patch)`: Router + Lingüista + Bibliotecario + Source Worker + Síntesis → `timeout: "90000"`
- [ ] 1.3 `update_chatflow(a6228a84, patch)`: Bibliotecario `temperature: 0.7 → 0.1`
- [ ] 1.4 `update_chatflow(a6228a84, patch)`: Source Worker `agentMaxIterations: null → 6`
- [ ] 1.5 `validate_agentflow` + `test_chatflow` (smoke: 1 query ES)

## Phase 2: Structured Output + Eliminar Stripper (AF-001, AF-003, AF-R01)

- [ ] 2.1 Definir 4 JSON Schemas: `RouterOutput`, `LinguistaOutput`, `BibliotecarioOutput`, `SourceWorkerOutput`
- [ ] 2.2 `get_chatflow(a6228a84)` → clonar flowData, remover nodo `customFunctionAgentflow_1` y sus 2 edges, agregar edge `Bibliotecario → Source Worker`
- [ ] 2.3 Asignar `llmStructuredOutput`/`agentStructuredOutput` en Router, Lingüista, Bibliotecario, Source Worker
- [ ] 2.4 Condition `Has Results?`: `notContains "[]"` → `evidence.length > 0` (usar `$flow.state.evidence`)
- [ ] 2.5 `update_chatflow(a6228a84, full-replace, forceOverwrite: true)`
- [ ] 2.6 `validate_agentflow` (10 nodos, 9 edges) + `test_chatflow` (smoke: 1 query ES)

## Phase 3: Fallback i18n (AF-004)

- [ ] 3.1 `update_chatflow(a6228a84, patch)`: `directReplyAgentflow_1` template → condicional `{{$flow.state.router_result.language}}` con mensajes ES/EN/PT, default EN
- [ ] 3.2 `test_chatflow`: forzar "no results" en ES, EN, PT → verificar idioma del fallback

## Phase 4: Modelos + Streaming + Bibliotecario type (AF-006)

- [ ] 4.1 `update_chatflow(a6228a84, patch)`: Lingüista `minimax-m2.5 → gemini-2.5-flash-lite`
- [ ] 4.2 `update_chatflow(a6228a84, patch)`: Bibliotecario `gemini-2.5-flash-lite → gemini-2.5-flash` + `type: agentAgentflow → llmAgentflow`
- [ ] 4.3 `update_chatflow(a6228a84, patch)`: Síntesis Final `maxTokens: "" → "8192"`
- [ ] 4.4 `update_chatflow(a6228a84, patch)`: streaming `false` en Router, Lingüista, Bibliotecario, Source Worker
- [ ] 4.5 `test_chatflow`: 5 queries → comparar latencia pre/post upgrade Bibliotecario

## Phase 5: Memoria conversacional (AF-005)

- [ ] 5.1 `update_chatflow(a6228a84, patch)`: Síntesis Final `agentMemory: bufferWindowMemory` con `sessionId, memoryKey: "chat_history", windowSize: 5`
- [ ] 5.2 `test_chatflow`: 3-turn follow-up ("políticas Madeira" → "y en NYC?" → "comparame") con mismo chatId → verificar contexto

## Phase 6: Observabilidad + Deploy (AF-007)

- [ ] 6.1 Definir provider de tracing (Langfuse / Lunary / custom). Pendiente: open question del design.
- [ ] 6.2 `update_chatflow(a6228a84, patch)`: `analytic` config + `name: "Alejandria 1.1.0 stable"` + `deployed: true`
- [ ] 6.3 `test_chatflow`: 20 queries aleatorias (ES/EN/PT, fresh + follow-up) → 0 errores de parseo
- [ ] 6.4 Archivar flow-backup-v1.0.0.json + este SDD en `openspec/changes/alejandria-hardening/`
