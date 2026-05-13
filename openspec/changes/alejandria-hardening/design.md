# Design: Alejandria 1.0.0 → 1.1.0 Hardening

## Technical Approach

Pipeline de 6 fases aplicadas secuencialmente sobre el flow `a6228a84` vía `flow-control_update_chatflow`. Solo la Fase 2 usa `full-replace` (cambia topología al eliminar Stripper). Las demás usan `patch` (merge no destructivo). Validación con `validate_agentflow` + `test_chatflow` entre fases.

Mapa spec → Fase:
| Spec | Fase | Modo |
|------|------|------|
| AF-002 Límites | F1 | patch |
| AF-001 Structured Output | F2 | **full-replace** |
| AF-003 Branching | F2 | **full-replace** |
| AF-R01 Eliminar Stripper | F2 | **full-replace** |
| AF-004 i18n Fallback | F3 | patch |
| AF-006 Streaming + Modelos | F4 | patch |
| AF-005 Memoria | F5 | patch |
| AF-007 Observabilidad | F6 | patch |

## Architecture Decisions

### Decision: Schema validation in Merger vs Structured Output

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Solo SO | Parseo garantizado, pero schema rígido | ✅ Elegido — 4 nodos reciben SO |
| SO + Merger guard | Doble seguridad, Merger ya tiene try/catch | ✅ También — Merger mantiene validación |
| Solo prompt | Fallas silenciosas de parseo | ❌ Causa raíz del bug actual |

**Rationale**: SO elimina el Markdown Stripper pero el Merger ya tiene lógica defensiva. Mantener ambos es seguro sin overhead nuevo.

### Decision: bufferWindowMemory vs conversationSummaryMemory

| Option | Tradeoff | Decision |
|--------|----------|----------|
| bufferWindow (k=5) | Últimas 5 interacciones, sin resumen | ✅ Elegido |
| summaryMemory | Resume pero requiere LLM extra | ❌ Agrega latencia y costo |
| Sin memoria | Stateless, follow-ups rotos | ❌ Bug actual |

**Rationale**: k=5 es suficiente para follow-ups de 2-3 turnos manteniendo contexto de fuentes y territorio. No justifica costo de summarization para este caso de uso.

### Decision: Fase 2 full-replace vs patch incremental

| Option | Tradeoff | Decision |
|--------|----------|----------|
| full-replace | Reensambla flowData completo, riesgo de perder cambios previos | ✅ Elegido (única fase que cambia edges) |
| patch con delete+add | Más seguro pero `update_chatflow` patch no soporta delete de nodos | ❌ Inviable |

**Rationale**: Eliminar el Stripper requiere quitar un nodo y 2 edges, agregar 1 edge nuevo. Patch no puede borrar nodos. El riesgo se mitiga con backup previo.

### Decision: Migrar Bibliotecario a llmAgentflow

| Option | Tradeoff | Decision |
|--------|----------|----------|
| llmAgentflow | Sin campo agentMaxIterations, más ligero | ✅ Elegido |
| Mantener agentAgentflow | Campo agentMaxIterations irrelevante (no usa tools) | ❌ Confunde semánticamente |

## Data Flow (post-hardening)

```
Start (12 state keys)
  └─ Router (LLM, gemini-2.5-flash-lite, temp=0.2, SO, no stream)
       └─ Lingüista (LLM, gemini-2.5-flash-lite, temp=0.1, SO, no stream)
            └─ Bibliotecario (LLM, gemini-2.5-flash, temp=0.1, SO, no stream)
                 └─ Source Worker (Agent, gemini-2.5-flash, temp=0.1, maxIter=6, timeout=90s, SO, 5 MCP tools)
                      └─ Has Results? (Condition: evidence.length>0)
                           ├─ Evidence Merger (JS dedup+filter)
                           │    └─ Síntesis Final (LLM, minimax-m2.5, temp=0.1, maxTokens=8192, memory k=5, stream)
                           │         └─ Reply
                           └─ Fallback Reply (Template {{router_result.language}})
```

Cambios topológicos respecto a v1.0.0:
- `agentAgentflow_0 (Bibliotecario)` → `llmAgentflow_?`
- `customFunctionAgentflow_1 (Stripper)` → ❌ eliminado
- Edge: `agentAgentflow_0 → agentAgentflow_1` reemplazado por `llmAgentflow_? → agentAgentflow_1`
- `directReplyAgentflow_1 (Fallback)` template actualizado con condicional i18n
- Nodo `agentAgentflow_1` mantiene ID y 5 MCP tools intactos

## Node Configuration Changes

| Nodo | Campo | Antes | Después |
|------|-------|-------|---------|
| Router | temperature | 0.2 | 0.2 (OK) |
| Router | streaming | true | **false** |
| Router | timeout | "" | **"90000"** |
| Router | llmStructuredOutput | "" | **RouterOutput schema** |
| Lingüista | modelName | minimax-m2.5 | **gemini-2.5-flash-lite** |
| Lingüista | streaming | true | **false** |
| Lingüista | timeout | "" | **"90000"** |
| Lingüista | llmStructuredOutput | "" | **LinguistaOutput schema** |
| Bibliotecario | type | agentAgentflow | **llmAgentflow** |
| Bibliotecario | modelName | gemini-2.5-flash-lite | **gemini-2.5-flash** |
| Bibliotecario | temperature | **0.7** | **0.1** |
| Bibliotecario | streaming | true | **false** |
| Bibliotecario | timeout | "" | **"90000"** |
| Bibliotecario | llmStructuredOutput | "" | **BibliotecarioOutput schema** |
| Source Worker | agentMaxIterations | **null** | **6** |
| Source Worker | streaming | true | **false** |
| Source Worker | timeout | "" | **"90000"** |
| Source Worker | agentStructuredOutput | "" | **SourceWorkerOutput schema** |
| Has Results? | condition | `notContains "[]"` | **evidence.length > 0** |
| Fallback Reply | template | ES hardcoded | **Condicional i18n** |
| Síntesis Final | maxTokens | "" | **"8192"** |
| Síntesis Final | agentMemory | "" | **bufferWindowMemory k=5** |
| chatflow | name | "Alejandria 1.0.0 stable" | **"Alejandria 1.1.0 stable"** |
| chatflow | deployed | false | **true** |
| chatflow | analytic | null | **{provider, config}** |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Validation | Estructura flowData sin Markdown Stripper | `validate_agentflow` después de F2 |
| Smoke | Pipeline end-to-end | `test_chatflow(a6228a84)` — 1 query por territorio |
| Integration | SO sin fences, fallback i18n, follow-ups con memoria | 20 queries (ES/EN/PT, fresh + follow-up, con/sin resultados) |
| Edge cases | Timeout MCP, null evidence, chatId fresh, rate limit | Simular MCP caído; query sin resultados en 3 idiomas |
| Regression | Pipeline completo intacto | Comparar respuestas pre/post hardening en 5 queries idénticas |

## Open Questions

- [ ] ¿Qué provider de tracing usar? Langfuse (OSS), Lunary, o custom webhook. Definir antes de F6.
